import type { EquipStatus, Equipment, InvCategory, InvStatus, InventoryItem } from '../data';
import type { EquipmentRecord, InventoryRecord, UploadPlan } from './labStore';

/* Turn an uploaded Excel / CSV / PDF file into proposed inventory + equipment
   changes. Everything runs in the browser; heavy parsers are loaded on demand. */

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'heic', 'heif'];
export const ACCEPT = ['.xlsx', '.xls', '.csv', '.pdf', ...IMAGE_EXT.map((e) => `.${e}`)].join(',');

type Table = string[][];

/** One sheet / PDF table. `name` is the workbook tab name (empty for PDFs and images). */
interface Sheet {
  name: string;
  rows: Table;
}

/** Progress messages for long steps (text recognition can take a while). */
export type OnProgress = (message: string) => void;

/* --------------------------------------------------------------- reading --- */

async function readSpreadsheet(file: File): Promise<Sheet[]> {
  const XLSX = await import('xlsx');
  // CSVs are text: decode as UTF-8 ourselves, otherwise SheetJS assumes Latin-1 and mangles "–", "µ", etc.
  const wb = file.name.toLowerCase().endsWith('.csv')
    ? XLSX.read(await file.text(), { type: 'string', cellDates: true })
    : XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  return wb.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], { header: 1, raw: false, defval: '', dateNF: 'yyyy-mm-dd' }),
  }));
}

/** A piece of text with its position. `y` is the baseline, growing downward. */
interface TextWord {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** OCR confidence 0–100 (absent for real PDF text). */
  conf?: number;
}

const center = (w: TextWord) => w.x + w.w / 2;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 10;

/** Cluster words that share a baseline into lines, top to bottom. */
function toLines(words: TextWord[], tol = 3): TextWord[][] {
  const lines: TextWord[][] = [];
  for (const w of [...words].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(line[0].y - w.y) < tol) line.push(w);
    else lines.push([w]);
  }
  lines.forEach((l) => l.sort((a, b) => a.x - b.x));
  return lines;
}

/** Turn positioned words (from a PDF or OCR) into a table. */
function wordsToSheet(words: TextWord[]): Sheet {
  const lh = median(words.map((w) => w.h));
  const tol = Math.max(3, 0.45 * lh);
  const lines = toLines(words, tol);
  const headerIdx = bestHeader(lines.map((l) => phrases(l, lh).map((w) => w.str)));
  return { name: '', rows: headerIdx >= 0 ? layoutTable(lines, headerIdx, lh, tol) : gapSplit(lines, lh) };
}

async function loadPdf(file: File) {
  const pdfjs = await import('pdfjs-dist');
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}

async function readPdf(file: File, onProgress: OnProgress): Promise<{ sheets: Sheet[]; ocrConfidence?: number }> {
  const doc = await loadPdf(file);
  const words: TextWord[] = [];
  let pageOffset = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const { height } = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      // Flip y so it grows downward, and stack pages vertically.
      words.push({
        str: item.str.trim(),
        x: item.transform[4],
        y: pageOffset + height - item.transform[5],
        w: item.width,
        h: item.height || 10,
      });
    }
    pageOffset += height;
  }
  if (words.length > 0) return { sheets: [wordsToSheet(words)] };

  // No text layer — a scanned PDF. Render each page to an image and run text recognition.
  const pages: HTMLCanvasElement[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    onProgress(`Rendering page ${p} of ${doc.numPages}…`);
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    pages.push(canvas);
  }
  const ocrd = await ocrWords(pages, onProgress);
  return { sheets: [wordsToSheet(ocrd)], ocrConfidence: meanConfidence(ocrd) };
}

async function readImage(file: File, onProgress: OnProgress): Promise<{ sheets: Sheet[]; ocrConfidence: number }> {
  let image: Blob = file;
  if (/\.(heic|heif)$/i.test(file.name)) {
    onProgress('Converting iPhone photo (HEIC)…');
    const { heicTo } = await import('heic-to');
    image = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.95 });
  }
  const ocrd = await ocrWords([image], onProgress);
  return { sheets: [wordsToSheet(ocrd)], ocrConfidence: meanConfidence(ocrd) };
}

/** Junk OCR picks up from table borders and specks (dashes are kept — they're real content). */
const NOISE = /^[|_=~.,:;'"`!¦/\\[\](){}]+$/;

/**
 * Shrink huge phone photos (faster, and no accuracy loss). Small images are left alone: upscaling
 * them on a canvas measurably hurt recognition in testing — Tesseract handles low resolution itself.
 */
async function prepareForOcr(image: Blob | HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const src = image instanceof Blob ? await createImageBitmap(image) : image;
  const scale = src.width > 3500 ? 3000 / src.width : 1;
  if (scale === 1 && src instanceof HTMLCanvasElement) return src;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(src.width * scale);
  canvas.height = Math.round(src.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Run text recognition on page images and return positioned words, pages stacked vertically. */
async function ocrWords(images: (Blob | HTMLCanvasElement)[], onProgress: OnProgress): Promise<TextWord[]> {
  onProgress('Loading text recognition…');
  const { createWorker, PSM } = await import('tesseract.js');
  let page = 0;
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const pageLabel = images.length > 1 ? `page ${page + 1} of ${images.length} · ` : '';
        onProgress(`Reading text — ${pageLabel}${Math.round(m.progress * 100)}%`);
      }
    },
  });
  try {
    // "Sparse text" mode: tables with grid lines confuse the default page-layout analysis, which then skips cells.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const words: TextWord[] = [];
    let offset = 0;
    for (page = 0; page < images.length; page++) {
      const { data } = await worker.recognize(await prepareForOcr(images[page]), {}, { blocks: true });
      const pageWords = ocrPageWords(data.blocks ?? []);
      words.push(...pageWords.map((w) => ({ ...w, y: w.y + offset })));
      offset += Math.max(0, ...pageWords.map((w) => w.y)) + 100;
    }
    if (words.length === 0) {
      throw new Error("No text could be recognised in this image. Make sure the photo is sharp, well lit and taken straight on, then try again.");
    }
    return words;
  } finally {
    await worker.terminate();
  }
}

type OcrBlock = { paragraphs: { lines: OcrLine[] }[] };
type OcrLine = {
  baseline: { x0: number; y0: number; x1: number; y1: number };
  words: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[];
};

/**
 * Positioned words from one OCR'd page, straightened. Photos are rarely level: a 2° tilt moves a
 * table row ~40px across a page, which would scramble rows. Each text line's baseline gives a local
 * slope; a slope-vs-height fit (photos of screens tilt differently top and bottom) is then used to
 * shear every word back onto a level baseline.
 */
export function ocrPageWords(blocks: OcrBlock[]): TextWord[] {
  const lines = blocks.flatMap((b) => b.paragraphs.flatMap((p) => p.lines));
  const slopeOf = (l: OcrLine) => {
    const dx = l.baseline.x1 - l.baseline.x0;
    return dx > 0 ? (l.baseline.y1 - l.baseline.y0) / dx : 0;
  };

  // Least-squares fit slope = a + b·y over lines long enough to measure.
  const pts = lines
    .filter((l) => l.baseline.x1 - l.baseline.x0 > 60)
    .map((l) => ({ y: l.baseline.y0, s: slopeOf(l) }))
    .filter((p) => Math.abs(p.s) < 0.15);
  let a = 0;
  let b = 0;
  if (pts.length >= 3) {
    const my = pts.reduce((t, p) => t + p.y, 0) / pts.length;
    const ms = pts.reduce((t, p) => t + p.s, 0) / pts.length;
    const vy = pts.reduce((t, p) => t + (p.y - my) ** 2, 0);
    b = vy > 0 ? pts.reduce((t, p) => t + (p.y - my) * (p.s - ms), 0) / vy : 0;
    a = ms - b * my;
  }
  const xs = lines.flatMap((l) => l.words.map((w) => (w.bbox.x0 + w.bbox.x1) / 2));
  const xc = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;

  const out: TextWord[] = [];
  for (const line of lines) {
    const ls = slopeOf(line);
    for (const word of line.words) {
      const str = word.text.trim();
      // Confidence alone isn't trusted: a word touching a table border can score 0 yet be read
      // perfectly ("Quantity"). Only drop low-confidence specks with no real letters/digits.
      if (!str || NOISE.test(str) || (word.confidence < 20 && !/[a-z0-9]{2,}/i.test(str))) continue;
      const cx = (word.bbox.x0 + word.bbox.x1) / 2;
      // Baseline under this word (the line's, so descenders don't split a line), then levelled.
      const yb = line.baseline.y0 + ls * (cx - line.baseline.x0);
      out.push({
        str,
        x: word.bbox.x0,
        y: yb - (a + b * yb) * (cx - xc),
        w: word.bbox.x1 - word.bbox.x0,
        h: word.bbox.y1 - word.bbox.y0,
        conf: word.confidence,
      });
    }
  }
  return out;
}

/** Mean OCR confidence of the recognised words (0–100). */
const meanConfidence = (words: TextWord[]) =>
  Math.round(words.reduce((t, w) => t + (w.conf ?? 100), 0) / Math.max(1, words.length));

/** Join words on a line that sit closer than a space-and-a-bit into phrases ("Item" + "Name"). */
function phrases(line: TextWord[], lh: number): TextWord[] {
  const out: TextWord[] = [];
  for (const w of [...line].sort((a, b) => a.x - b.x)) {
    const last = out[out.length - 1];
    if (last && w.x - (last.x + last.w) < 0.6 * lh) {
      last.str += ` ${w.str}`;
      last.w = w.x + w.w - last.x;
      last.h = Math.max(last.h, w.h);
    } else out.push({ ...w });
  }
  return out;
}

/* Header-driven table reading. Copes with centred headers over left-aligned
   data, headers wrapped onto two lines, and cells wrapped onto several lines. */
function layoutTable(lines: TextWord[][], headerIdx: number, lh: number, tol: number): Table {
  const readingOrder = (a: TextWord, b: TextWord) => (Math.abs(a.y - b.y) < tol ? a.x - b.x : a.y - b.y);

  // Header block: header cells often wrap ("Store Stock / as on / 01/04/2026"), so grow the block
  // line by line above and below the best header line. A neighbouring line belongs to the header while
  // it's close and has nothing in the Name/Description column — data rows and titles always do.
  const headerPhrases = phrases(lines[headerIdx], lh);
  const nameCol = headerPhrases[resolveColumns(headerPhrases.map((p) => p.str)).indexOf('name')];
  const inNameCol = (line: TextWord[]) =>
    !!nameCol && phrases(line, lh).some((p) => p.x < nameCol.x + nameCol.w + lh && p.x + p.w > nameCol.x - lh);
  let first = headerIdx;
  let last = headerIdx;
  const near = (i: number, j: number) => Math.abs(lines[i][0].y - lines[j][0].y) <= 1.8 * lh;
  while (first > 0 && near(first - 1, first) && (nameCol ? !inNameCol(lines[first - 1]) : first - 1 >= headerIdx - 1)) first--;
  while (last < lines.length - 1 && near(last + 1, last) && (nameCol ? !inNameCol(lines[last + 1]) : last + 1 <= headerIdx + 1)) last++;

  // Stacked phrases (x-overlap) within the block form one header cell.
  const band = lines.slice(first, last + 1)
    .flatMap((l) => phrases(l, lh))
    .sort((a, b) => a.x - b.x);
  const heads: TextWord[][] = [];
  for (const w of band) {
    const last = heads[heads.length - 1];
    const lastEnd = last ? Math.max(...last.map((v) => v.x + v.w)) : -Infinity;
    if (last && w.x < lastEnd - 2) last.push(w);
    else heads.push([w]);
  }
  const headerCells = heads.map((h) => h.sort(readingOrder).map((w) => w.str).join(' '));
  const centers = heads.map((h) => (Math.min(...h.map((w) => w.x)) + Math.max(...h.map((w) => w.x + w.w))) / 2);
  const colOf = (w: TextWord) => {
    const c = center(w);
    let best = 0;
    centers.forEach((x, i) => { if (Math.abs(c - x) < Math.abs(c - centers[best])) best = i; });
    return best;
  };

  // Body text as phrases, so a multi-word cell ("Lab A – Shelf 2") lands in one column.
  // Text well outside the header's span (a sidebar, margin notes, stamps) isn't part of the table.
  const left = Math.min(...heads.flat().map((w) => w.x)) - 3 * lh;
  const right = Math.max(...heads.flat().map((w) => w.x + w.w)) + 3 * lh;
  const body = lines.slice(last + 1)
    .flatMap((l) => phrases(l, lh))
    .filter((p) => p.x + p.w > left && p.x < right && center(p) > left && center(p) < right);

  // Row anchors: baselines in the Quantity / Serial columns (short, never-wrapped values).
  const fields = resolveColumns(headerCells);
  const anchorCols = fields.flatMap((f, i) => (f === 'qty' || f === 'serial' ? [i] : []));
  const anchorYs = toLines(body.filter((w) => anchorCols.includes(colOf(w))), tol).map((l) => l[0].y);
  if (anchorYs.length === 0) {
    // No anchor column: treat each text line as a row.
    return [headerCells, ...toLines(body, tol).map((l) => cellsFor(l, headerCells.length, colOf, readingOrder))];
  }

  // Attach every phrase to the nearest anchor (if it's close enough to belong to that row).
  const rows: TextWord[][] = anchorYs.map(() => []);
  for (const w of body) {
    let best = 0;
    anchorYs.forEach((y, i) => { if (Math.abs(w.y - y) < Math.abs(w.y - anchorYs[best])) best = i; });
    if (Math.abs(w.y - anchorYs[best]) <= 2.5 * lh) rows[best].push(w);
  }
  return [headerCells, ...rows.map((r) => cellsFor(r, headerCells.length, colOf, readingOrder))];
}

function cellsFor(
  rowWords: TextWord[],
  n: number,
  colOf: (w: TextWord) => number,
  readingOrder: (a: TextWord, b: TextWord) => number
): string[] {
  const cells = Array.from({ length: n }, () => [] as TextWord[]);
  for (const w of rowWords) cells[colOf(w)].push(w);
  return cells.map((c) => c.sort(readingOrder).map((w) => w.str).join(' '));
}

/** No header row: split each line into cells wherever there's a wide gap. */
function gapSplit(lines: TextWord[][], lh: number): Table {
  return lines.map((line) => phrases(line, lh).map((p) => p.str));
}

/* --------------------------------------------------------------- columns --- */

type Field =
  | 'name' | 'category' | 'qty' | 'unit' | 'location' | 'expiry'
  | 'serial' | 'lab' | 'status' | 'calibrationDue' | 'lastServiced' | 'nextService';

const SYNONYMS: Record<Field, string[]> = {
  name: ['name', 'item', 'item name', 'items', 'description', 'item description', 'description of item', 'equipment', 'equipment name', 'chemical', 'chemical name', 'name of chemical', 'name of item', 'material', 'product', 'particulars', 'particular', 'instrument'],
  category: ['category', 'type', 'item type', 'group', 'class'],
  qty: ['qty', 'quantity', 'stock', 'store stock', 'stock as on', 'available stock', 'stock in hand', 'closing stock', 'present stock', 'current stock', 'balance stock', 'balance', 'in stock', 'count', 'nos', 'no of units', 'units available', 'qty available'],
  unit: ['unit', 'units', 'uom', 'pack', 'pack size', 'packing', 'packaging'],
  location: ['location', 'shelf', 'storage', 'room', 'place', 'rack', 'cabinet'],
  expiry: ['expiry', 'expiry date', 'exp', 'exp date', 'expires', 'expiration', 'expiration date', 'best before', 'use by'],
  // Not "S.N." / "Sr. No." — in most lab sheets that's just the row number.
  serial: ['serial', 'serial no', 'serial number', 'asset id', 'asset no', 'asset number', 'equipment id'],
  lab: ['lab', 'assigned lab', 'laboratory', 'lab name'],
  status: ['status', 'condition', 'state'],
  calibrationDue: ['calibration', 'calibration due', 'calib due', 'next calibration', 'calibration date'],
  lastServiced: ['last serviced', 'last service', 'serviced on', 'last maintenance'],
  nextService: ['next service', 'service due', 'next maintenance'],
};

/** Quantity-looking columns that are NOT current stock (requirements, orders, prices). */
const NOT_STOCK = /\b(req|reqd|required|requirement|order|ordered|purchase|rate|price|cost|amount|value|per pkg|fy|sy|ty)\b/;

/** Placeholder cell values that mean "nothing here". */
const BLANK = /^(-+|—|–|n\/?a|nil|none|null)$/i;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** How well a header matches a synonym: exact > starts with > contains the phrase. */
function score(h: string, syn: string) {
  if (h === syn) return 3;
  if (h.startsWith(syn + ' ')) return 2;
  return ` ${h} `.includes(` ${syn} `) ? 1 : 0;
}

/** Map header cells to fields. Each field goes to its single best-matching column. */
function resolveColumns(headers: string[]): (Field | null)[] {
  const candidates: { col: number; field: Field; s: number }[] = [];
  headers.forEach((raw, col) => {
    const h = norm(String(raw));
    if (!h || h.length > 60) return;
    for (const [field, syns] of Object.entries(SYNONYMS) as [Field, string[]][]) {
      if (field === 'qty' && NOT_STOCK.test(h)) continue;
      const best = Math.max(...syns.map((syn) => score(h, syn)));
      if (best > 0) candidates.push({ col, field, s: best });
    }
  });
  candidates.sort((a, b) => b.s - a.s || a.col - b.col);
  const out: (Field | null)[] = headers.map(() => null);
  const used = new Set<Field>();
  for (const c of candidates) {
    if (used.has(c.field) || out[c.col]) continue;
    out[c.col] = c.field;
    used.add(c.field);
  }
  return out;
}

/**
 * Index of the header row: the one naming the most columns (at least 2), earliest on a tie.
 * "Most", not "first": a title like "Lab B Stock Report" can name two fields by accident.
 */
function bestHeader(rows: string[][]): number {
  let best = -1;
  let bestCount = 1;
  rows.forEach((r, i) => {
    const n = countHeaders(r);
    if (n > bestCount) [best, bestCount] = [i, n];
  });
  return best;
}

/** How many distinct fields a row names *exactly* — used to spot header rows (loose matches would also hit data). */
function countHeaders(cells: string[]) {
  const fields = new Set<Field>();
  for (const raw of cells) {
    const h = norm(String(raw));
    for (const [field, syns] of Object.entries(SYNONYMS) as [Field, string[]][]) {
      if (syns.includes(h) || (field === 'qty' && !NOT_STOCK.test(h) && syns.some((syn) => score(h, syn) >= 2))) fields.add(field);
    }
  }
  return fields.size;
}

/* ---------------------------------------------------------------- values --- */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (n: number) => String(n).padStart(2, '0');

/** Normalize common date spellings to YYYY-MM-DD. Slash/dash dates are read as DD/MM/YYYY. */
export function parseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s || s === '-' || s === '—' || /^n\/?a$/i.test(s)) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return `${y}-${pad(+m[2])}-${pad(+m[1])}`;
  }
  m = s.match(/^(\d{1,2})[\s-]([a-z]{3})[a-z]*[\s-,]+(\d{4})$/i);
  if (m && MONTHS.includes(m[2].toLowerCase())) {
    return `${m[3]}-${pad(MONTHS.indexOf(m[2].toLowerCase()) + 1)}-${pad(+m[1])}`;
  }
  m = s.match(/^([a-z]{3})[a-z]*\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (m && MONTHS.includes(m[1].toLowerCase())) {
    return `${m[3]}-${pad(MONTHS.indexOf(m[1].toLowerCase()) + 1)}-${pad(+m[2])}`;
  }
  return null;
}

const COUNT_UNITS = /^(pcs?|pieces?|nos?|numbers?|units?|bottles?|packs?|packets?|boxes?|box|pairs?|sheets?|plates?|vials?|kits?|tubes?|rolls?|sets?)$/i;
const MEASURE = /^(\d+(?:\.\d+)?)\s*(µl|ul|ml|l|ltr|lit|litre|liter|mg|g|gm|gms|gram|grams|kg)\.?$/i;
const SAME_UNIT: Record<string, string> = { gm: 'g', gms: 'g', gram: 'g', grams: 'g', ltr: 'l', lit: 'l', litre: 'l', liter: 'l', ul: 'µl' };
const unitKey = (u: string) => SAME_UNIT[u.toLowerCase()] ?? u.toLowerCase();
/** "2.5ltr" → "2.5 ltr" */
const tidyUnit = (s: string) => s.trim().replace(/^(\d+(?:\.\d+)?)\s*([a-zµ])/i, '$1 $2');

interface Stock {
  qty: number;
  unit?: string;
  note?: string;
}

/**
 * Read a stock cell. Plain counts ("45", "45 pcs") are used as-is. Lab sheets often
 * record stock as pack sizes instead — "2x2.5ltr" is 2 packs of 2.5 ltr, and "25gm"
 * with a Packing of "25gm" is 1 pack — so those become a pack count + pack-size unit.
 */
function parseStock(raw: string, packing?: string): Stock | null {
  const s = raw.replace(/,/g, '').trim();
  if (BLANK.test(s)) return { qty: 0 };

  let m = s.match(/^(\d+)\s*[x×*]\s*(.+)$/i);
  if (m) return { qty: +m[1], unit: tidyUnit(m[2]) };

  m = s.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!m) return null;
  const num = +m[1];
  const word = m[2].trim();
  if (!word || COUNT_UNITS.test(word)) return { qty: Math.round(num), ...(word && { unit: word }) };

  const amount = s.match(MEASURE);
  const pack = packing?.replace(/,/g, '').trim().match(MEASURE);
  if (amount && pack && unitKey(amount[2]) === unitKey(pack[2]) && +pack[1] > 0) {
    const packs = num / +pack[1];
    if (packs >= 1 && Math.abs(packs - Math.round(packs)) < 0.01) {
      return { qty: Math.round(packs), unit: tidyUnit(packing!) };
    }
  }
  return { qty: 1, unit: tidyUnit(s), note: `Stock "${raw}" read as 1 × ${tidyUnit(s)}` };
}

const CATEGORY_WORDS: [InvCategory, RegExp][] = [
  ['Chemical', /chem|antibiotic|agar|broth|medium|media|stain|acid|reagent|solvent|salt|oxide|hydroxide|chloride|sulph|nitrate|ethanol|methanol|acetone|alcohol|%|buffer|indicator|powder|pellet/i],
  ['Glassware', /glass|beaker|flask|pipette|burette|test tube|cylinder|funnel|petri|dish|condenser|watch glass|bottle/i],
  ['Consumables', /consum|kit|disposable|paper|slide|cover ?slip|glove|tip|swab|cotton|tissue|label|filter|mask/i],
  ['Equipment', /equip|instrument|apparatus|burner|stand|clamp|tripod|meter|balance|microscope|centrifuge|oven|incubator|heater|stirrer/i],
];

function guessCategory(text: string): InvCategory | null {
  for (const [cat, re] of CATEGORY_WORDS) if (re.test(text)) return cat;
  return null;
}

const INV_STATUSES: InvStatus[] = ['Available', 'Low Stock', 'Out of Stock'];
const EQUIP_STATUSES: EquipStatus[] = ['Working', 'Under Maintenance', 'Calibration Due'];

function matchStatus<T extends string>(raw: string, options: T[]): T | null {
  const s = norm(raw);
  if (!s) return null;
  return options.find((o) => norm(o) === s) ?? options.find((o) => s.includes(norm(o).split(' ')[0])) ?? null;
}

/* ----------------------------------------------------------------- rows --- */

export interface ProposedInventory {
  kind: 'inventory';
  key: string;
  include: boolean;
  item: InventoryItem;
  existing?: InventoryRecord;
  notes: string[];
}

export interface ProposedEquipment {
  kind: 'equipment';
  key: string;
  include: boolean;
  item: Equipment;
  existing?: EquipmentRecord;
  notes: string[];
}

export type Proposed = ProposedInventory | ProposedEquipment;

export interface ParseResult {
  rows: Proposed[];
  skipped: number;
  /** Set when the text came from text recognition (photo / scanned PDF): mean word confidence 0–100. */
  ocrConfidence?: number;
}

export async function parseUpload(
  file: File,
  inventory: InventoryRecord[],
  equipment: EquipmentRecord[],
  onProgress: OnProgress = () => {}
): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  let sheets: Sheet[];
  let ocrConfidence: number | undefined;
  if (ext === 'pdf') ({ sheets, ocrConfidence } = await readPdf(file, onProgress));
  else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') sheets = await readSpreadsheet(file);
  else if (IMAGE_EXT.includes(ext)) ({ sheets, ocrConfidence } = await readImage(file, onProgress));
  else throw new Error('Unsupported file type. Upload an Excel (.xlsx, .xls), CSV, PDF, or a photo (JPG, PNG, HEIC).');

  const rows: Proposed[] = [];
  let skipped = 0;
  let sawHeader = false;

  for (const sheet of sheets) {
    const table = sheet.rows;
    const headerIdx = bestHeader(table.slice(0, 30).map((r) => r.map(String)));
    if (headerIdx < 0) continue;
    const fields = resolveColumns(table[headerIdx].map(String));
    if (!fields.includes('name')) continue;
    sawHeader = true;
    const sheetCategory = guessCategory(sheet.name);

    for (const cells of table.slice(headerIdx + 1)) {
      const rec: Partial<Record<Field, string>> = {};
      fields.forEach((f, i) => {
        const v = String(cells[i] ?? '').replace(/\s+/g, ' ').trim();
        if (!f || !v) return;
        // "Nil" / "-" in a stock column means zero; elsewhere it means empty.
        if (BLANK.test(v)) { if (f === 'qty') rec.qty = '0'; return; }
        rec[f] = v;
      });
      if (!rec.name || /^(sub ?)?(grand )?total\b/i.test(rec.name) || countHeaders(cells.map(String)) >= 2) {
        if (cells.some((c) => String(c).trim())) skipped++;
        continue;
      }
      const isEquipment = !!rec.serial || !!matchStatus(rec.status ?? '', EQUIP_STATUSES);
      const key = `${rows.length}-${rec.name}`;
      rows.push(isEquipment ? toEquipmentRow(key, rec, equipment) : toInventoryRow(key, rec, inventory, sheetCategory));
    }
  }

  if (!sawHeader && ocrConfidence !== undefined) {
    throw new Error(
      "Text was found, but not a table header like Name / Description, Quantity / Stock, Unit. Make sure the column titles are in the photo, sharp and straight-on — or upload the Excel/PDF file instead."
    );
  }
  if (!sawHeader) {
    throw new Error(
      "Couldn't find a header row. The file needs column titles such as Name, Category, Quantity, Unit, Location, Expiry (or Serial No. for equipment). Download the template to see the expected layout."
    );
  }
  return { rows, skipped, ocrConfidence };
}

/** No status column: infer it. Restocking above the old level re-evaluates; otherwise keep what was set. */
function deriveStatus(qty: number, existing?: InventoryRecord): InvStatus {
  if (qty === 0) return 'Out of Stock';
  if (existing && existing.qty > 0 && qty <= existing.qty) return existing.status;
  return qty <= 5 ? 'Low Stock' : 'Available';
}

function toInventoryRow(
  key: string,
  rec: Partial<Record<Field, string>>,
  existingRows: InventoryRecord[],
  sheetCategory: InvCategory | null
): ProposedInventory {
  const name = rec.name!;
  const existing = existingRows.find((r) => r.name.trim().toLowerCase() === name.toLowerCase());
  const notes: string[] = [];
  if (!existing) {
    const n = norm(name);
    const similar = existingRows.find((r) => {
      const e = norm(r.name);
      return e.startsWith(n + ' ') || n.startsWith(e + ' ');
    });
    if (similar) notes.push(`Similar to existing "${similar.name}" — rename it to match if it's the same item`);
  }

  let category = guessCategory(rec.category ?? '') ?? sheetCategory ?? existing?.category ?? null;
  if (!category) {
    category = guessCategory(name) ?? 'Consumables';
    notes.push('Category guessed');
  }

  const stock = rec.qty !== undefined ? parseStock(rec.qty, rec.unit) : null;
  if (rec.qty !== undefined && !stock) notes.push(`Couldn't read quantity "${rec.qty}"`);
  if (stock?.note) notes.push(stock.note);
  let qty = stock?.qty ?? null;
  if (qty === null) {
    if (existing) qty = existing.qty;
    else {
      qty = 0;
      notes.push('No quantity found');
    }
  }

  let expiry = existing?.expiry ?? null;
  // A stray letter or two (e.g. OCR reading a "-" as "R") is never a date — treat it as blank.
  if (rec.expiry && !/^[^0-9]{1,2}$/.test(rec.expiry)) {
    const d = parseDate(rec.expiry);
    if (d) expiry = d;
    else notes.push(`Couldn't read expiry "${rec.expiry}"`);
  }

  const status = matchStatus(rec.status ?? '', INV_STATUSES) ?? deriveStatus(qty, existing);

  return {
    kind: 'inventory',
    key,
    include: true,
    existing,
    notes,
    item: {
      name: existing?.name ?? name,
      category,
      qty,
      // A bare count word ("30 pcs") shouldn't overwrite an existing unit like "Pieces".
      unit:
        (stock?.unit && !(existing?.unit && COUNT_UNITS.test(stock.unit)) ? stock.unit : undefined) ??
        (rec.unit && tidyUnit(rec.unit)) ??
        existing?.unit ??
        stock?.unit ??
        '',
      location: rec.location ?? existing?.location ?? '',
      expiry,
      status,
    },
  };
}

function toEquipmentRow(key: string, rec: Partial<Record<Field, string>>, existingRows: EquipmentRecord[]): ProposedEquipment {
  const name = rec.name!;
  const serial = rec.serial ?? '';
  const existing =
    (serial && existingRows.find((r) => r.serial.toLowerCase() === serial.toLowerCase())) ||
    existingRows.find((r) => r.name.trim().toLowerCase() === name.toLowerCase()) ||
    undefined;
  const notes: string[] = [];
  if (!serial && !existing) notes.push('No serial number — one will be generated');

  const date = (v: string | undefined, fallback: string) => (v ? parseDate(v) ?? v : fallback);

  return {
    kind: 'equipment',
    key,
    include: true,
    existing,
    notes,
    item: {
      name: existing?.name ?? name,
      serial: serial || existing?.serial || `NEW-${Date.now().toString(36).toUpperCase()}-${key.split('-')[0]}`,
      lab: rec.lab ?? existing?.lab ?? '',
      status: matchStatus(rec.status ?? '', EQUIP_STATUSES) ?? existing?.status ?? 'Working',
      calibrationDue: date(rec.calibrationDue, existing?.calibrationDue ?? ''),
      lastServiced: rec.lastServiced ?? existing?.lastServiced ?? '',
      nextService: rec.nextService ?? existing?.nextService ?? '',
    },
  };
}

/** Collect the rows the user kept into a plan the store can save. */
export function toPlan(rows: Proposed[]): UploadPlan {
  const plan: UploadPlan = { inventory: [], equipment: [] };
  for (const r of rows) {
    if (!r.include) continue;
    if (r.kind === 'inventory') plan.inventory.push({ ...r.item, ...(r.existing && { id: r.existing.id }) });
    else plan.equipment.push({ ...r.item, ...(r.existing && { id: r.existing.id }) });
  }
  return plan;
}

/** A short "what changes" summary for an existing record. */
export function describeChange(r: Proposed): string[] {
  if (!r.existing) return [];
  const before = r.existing as unknown as Record<string, unknown>;
  const after = r.item as unknown as Record<string, unknown>;
  const labels: Record<string, string> =
    r.kind === 'inventory'
      ? { qty: 'Qty', unit: 'Unit', location: 'Location', expiry: 'Expiry', status: 'Status', category: 'Category' }
      : { lab: 'Lab', status: 'Status', calibrationDue: 'Calibration', lastServiced: 'Last serviced', nextService: 'Next service' };
  return Object.entries(labels)
    .filter(([k]) => (before[k] ?? '') !== (after[k] ?? ''))
    .map(([k, label]) => `${label}: ${before[k] ?? '—'} → ${after[k] ?? '—'}`);
}

export const TEMPLATE_CSV = [
  'Name,Category,Quantity,Unit,Location,Expiry Date,Serial No.,Lab,Status,Calibration Due',
  'Hydrochloric Acid (36%),Chemical,20,Bottles (500 ml),Lab A – Shelf 2,2026-12-31,,,,',
  'Beakers 250 ml,Glassware,60,Pieces,Lab B – Cabinet 1,,,,,',
  'Digital pH Meter,Equipment,,,,,PM-2024-003,Lab C,Working,2027-01-15',
].join('\n');

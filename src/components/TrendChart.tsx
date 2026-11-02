import { trend } from '../data';

// Lightweight SVG area chart: two series (sessions, items) over 6 months.
export default function TrendChart() {
  const W = 620, H = 240, padL = 36, padR = 12, padT = 12, padB = 28;
  const max = 400;
  const n = trend.months.length;
  const x = (i: number) => padL + (i * (W - padL - padR)) / (n - 1);
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);

  const line = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const area = (data: number[]) =>
    `${line(data)} L ${x(n - 1)} ${H - padB} L ${x(0)} ${H - padB} Z`;

  const yTicks = [0, 100, 200, 300, 400];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Lab usage and inventory trend">
      <defs>
        <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c5ce6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#7c5ce6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gItems" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2722f" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#e2722f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* grid + y labels */}
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="var(--chart-grid)" strokeWidth={1} />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-faint)">
            {t}
          </text>
        </g>
      ))}

      {/* areas */}
      <path d={area(trend.items)} fill="url(#gItems)" />
      <path d={area(trend.sessions)} fill="url(#gSessions)" />

      {/* lines */}
      <path d={line(trend.items)} fill="none" stroke="#e2722f" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={line(trend.sessions)} fill="none" stroke="#7c5ce6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* endpoint dots */}
      <circle cx={x(n - 1)} cy={y(trend.sessions[n - 1])} r={4} fill="#7c5ce6" stroke="var(--surface)" strokeWidth={2} />
      <circle cx={x(n - 1)} cy={y(trend.items[n - 1])} r={4} fill="#e2722f" stroke="var(--surface)" strokeWidth={2} />

      {/* x labels */}
      {trend.months.map((m, i) => (
        <text key={m} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-faint)">
          {m}
        </text>
      ))}
    </svg>
  );
}

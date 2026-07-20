// Sample data for LabSync — mirrors the Mithibai College design prototype.

export type InvCategory = 'Chemical' | 'Glassware' | 'Consumables' | 'Equipment';
export type InvStatus = 'Available' | 'Low Stock' | 'Out of Stock';

export interface InventoryItem {
  name: string;
  category: InvCategory;
  qty: number;
  unit: string;
  location: string;
  expiry: string | null;
  status: InvStatus;
}

export const inventory: InventoryItem[] = [
  { name: 'Hydrochloric Acid (36%)', category: 'Chemical', qty: 8, unit: 'Bottles (500 ml)', location: 'Lab A – Shelf 2', expiry: '2024-12-15', status: 'Low Stock' },
  { name: 'Beakers 250 ml', category: 'Glassware', qty: 45, unit: 'Pieces', location: 'Lab B – Cabinet 1', expiry: null, status: 'Available' },
  { name: 'Microscope Slides', category: 'Consumables', qty: 200, unit: 'Pieces', location: 'Storage Room', expiry: null, status: 'Available' },
  { name: 'Sodium Hydroxide Pellets', category: 'Chemical', qty: 3, unit: 'Bags (1 kg)', location: 'Lab C – Shelf 1', expiry: '2025-03-20', status: 'Low Stock' },
  { name: 'Bunsen Burners', category: 'Equipment', qty: 15, unit: 'Units', location: 'Lab A – Counter', expiry: null, status: 'Available' },
  { name: 'Filter Paper Grade 1', category: 'Consumables', qty: 500, unit: 'Sheets', location: 'Storage Room', expiry: null, status: 'Available' },
  { name: 'Ethanol (95%)', category: 'Chemical', qty: 0, unit: 'Bottles (2 L)', location: 'Lab B – Shelf 3', expiry: '2024-09-30', status: 'Out of Stock' },
  { name: 'Conical Flask 250 ml', category: 'Glassware', qty: 30, unit: 'Pieces', location: 'Lab C – Cabinet 2', expiry: null, status: 'Available' },
  { name: 'Acetone (Pure)', category: 'Chemical', qty: 5, unit: 'Bottles (1 L)', location: 'Lab A – Shelf 1', expiry: '2025-06-10', status: 'Available' },
];

export const inventoryStats = {
  total: 485,
  lowStock: 5,
  outOfStock: 1,
  expiringSoon: 3,
};

export type EquipStatus = 'Working' | 'Under Maintenance' | 'Calibration Due';

export interface Equipment {
  name: string;
  serial: string;
  lab: string;
  status: EquipStatus;
  calibrationDue: string;
  lastServiced: string;
  nextService: string;
}

export const equipment: Equipment[] = [
  { name: 'Analytical Balance', serial: 'AB-2024-001', lab: 'Lab A', status: 'Working', calibrationDue: '2024-10-15', lastServiced: '15 Jan 2024', nextService: '15 Jul 2024' },
  { name: 'Compound Microscope', serial: 'CM-2023-012', lab: 'Lab B', status: 'Under Maintenance', calibrationDue: '2024-06-01', lastServiced: '01 Dec 2023', nextService: '01 Jun 2024' },
  { name: 'Digital pH Meter', serial: 'PM-2024-003', lab: 'Lab C', status: 'Calibration Due', calibrationDue: '2024-07-15', lastServiced: '15 Jan 2024', nextService: '15 Jul 2024' },
  { name: 'High-Speed Centrifuge', serial: 'CF-2022-004', lab: 'Lab A', status: 'Working', calibrationDue: '2024-11-20', lastServiced: '20 Feb 2024', nextService: '20 Aug 2024' },
  { name: 'Autoclave 25 L', serial: 'AC-2021-005', lab: 'Lab B', status: 'Working', calibrationDue: '2024-09-10', lastServiced: '10 Mar 2024', nextService: '10 Sep 2024' },
  { name: 'UV Spectrophotometer', serial: 'UV-2023-006', lab: 'Lab C', status: 'Under Maintenance', calibrationDue: '2024-08-05', lastServiced: '05 Dec 2023', nextService: '05 Jun 2024' },
];

export type SlotKind = 'occupied' | 'reserved' | 'available';
export interface Slot {
  kind: SlotKind;
  title?: string;
  faculty?: string;
  lab?: string;
}

export const scheduleDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const scheduleTimes = ['9:00 – 11:00', '11:00 – 1:00', '2:00 – 4:00', '4:00 – 6:00'];

// rows[time][day]
export const schedule: Slot[][] = [
  [
    { kind: 'occupied', title: 'BSc Chemistry Practical', faculty: 'Dr. R. Sharma', lab: 'Lab A' },
    { kind: 'available' },
    { kind: 'occupied', title: 'BSc Physics Practical', faculty: 'Dr. S. Mehta', lab: 'Lab B' },
    { kind: 'occupied', title: 'MSc Organic Chemistry', faculty: 'Dr. P. Patel', lab: 'Lab C' },
    { kind: 'available' },
    { kind: 'occupied', title: 'BSc Biology Practical', faculty: 'Dr. A. Shah', lab: 'Lab A' },
  ],
  [
    { kind: 'occupied', title: 'MSc Biochemistry', faculty: 'Dr. K. Joshi', lab: 'Lab B' },
    { kind: 'occupied', title: 'BSc Zoology Practical', faculty: 'Dr. M. Rao', lab: 'Lab A' },
    { kind: 'reserved', title: 'Staff Meeting', faculty: 'All Faculty', lab: 'Conference Room' },
    { kind: 'available' },
    { kind: 'occupied', title: 'BSc Chem Practical', faculty: 'Dr. R. Sharma', lab: 'Lab A' },
    { kind: 'available' },
  ],
  [
    { kind: 'available' },
    { kind: 'occupied', title: 'MSc Microbiology', faculty: 'Dr. L. Nair', lab: 'Lab C' },
    { kind: 'occupied', title: 'BSc Chem Practical', faculty: 'Dr. R. Sharma', lab: 'Lab A' },
    { kind: 'occupied', title: 'BSc Physics Practical', faculty: 'Dr. S. Mehta', lab: 'Lab B' },
    { kind: 'occupied', title: 'MSc Org. Chemistry', faculty: 'Dr. P. Patel', lab: 'Lab C' },
    { kind: 'available' },
  ],
  [
    { kind: 'reserved', title: 'Remedial Lab Session', faculty: 'Dr. R. Sharma', lab: 'Lab A' },
    { kind: 'available' },
    { kind: 'available' },
    { kind: 'reserved', title: 'Project Lab – TY BSc', faculty: 'Dr. K. Joshi', lab: 'Lab B' },
    { kind: 'available' },
    { kind: 'available' },
  ],
];

export interface LowStock {
  name: string;
  unit: string;
  remaining: number;
  minimum: number;
  recommended: number;
  level: 'Low Stock' | 'Critical';
}

export const lowStock: LowStock[] = [
  { name: 'Hydrochloric Acid (36%)', unit: 'Bottles', remaining: 8, minimum: 20, recommended: 30, level: 'Low Stock' },
  { name: 'Sodium Hydroxide Pellets', unit: 'Bags (1 kg)', remaining: 3, minimum: 10, recommended: 15, level: 'Critical' },
  { name: 'Litmus Paper (Red)', unit: 'Packs', remaining: 2, minimum: 5, recommended: 8, level: 'Low Stock' },
  { name: 'Disposable Gloves (M)', unit: 'Boxes', remaining: 15, minimum: 20, recommended: 30, level: 'Low Stock' },
  { name: 'Petri Dishes (90 mm)', unit: 'Pieces', remaining: 25, minimum: 50, recommended: 100, level: 'Low Stock' },
];

export type ExpiryStatus = 'Critical' | 'Warning' | 'Safe';
export interface Chemical {
  name: string;
  batch: string;
  quantity: string;
  expiry: string;
  daysRemaining: number;
  status: ExpiryStatus;
}

export const chemicals: Chemical[] = [
  { name: 'Acetaldehyde (99%)', batch: 'ACD-2023-034', quantity: '3 Bottles (1 L)', expiry: '2024-07-10', daysRemaining: 5, status: 'Critical' },
  { name: 'Formaldehyde (40%)', batch: 'FA-2023-008', quantity: '4 Bottles (1 L)', expiry: '2024-07-18', daysRemaining: 13, status: 'Critical' },
  { name: 'Acetic Acid (Glacial)', batch: 'AA-2022-145', quantity: '6 Bottles (2.5 L)', expiry: '2024-08-22', daysRemaining: 28, status: 'Warning' },
  { name: 'Ethanol (95%)', batch: 'ETH-2022-089', quantity: '8 Bottles (2 L)', expiry: '2024-09-30', daysRemaining: 45, status: 'Warning' },
  { name: 'Hydrochloric Acid (36%)', batch: 'HCL-2022-112', quantity: '12 Bottles (500 ml)', expiry: '2024-12-15', daysRemaining: 120, status: 'Safe' },
  { name: 'Sodium Thiosulphate', batch: 'ST-2022-067', quantity: '5 Bags (500 g)', expiry: '2025-01-20', daysRemaining: 180, status: 'Safe' },
];

export interface DamageReport {
  item: string;
  reportedOn: string;
  reportNo: string;
  fine: string;
  resolved: boolean;
  description: string;
  remarks: string;
}

export const damageStudent = {
  name: 'Rahul Sharma',
  sapId: '60004210123',
  course: 'BSc Chemistry',
  semester: '4th Semester',
  pendingCases: true,
  reports: 2,
};

export const damageReports: DamageReport[] = [
  {
    item: 'Beaker (250 ml)', reportedOn: '15 Jan 2024', reportNo: '001', fine: '₹50', resolved: true,
    description: 'Beaker shattered during acid-base titration due to improper handling near the Bunsen burner.',
    remarks: 'Student cautioned. Fine levied as per college policy.',
  },
  {
    item: 'Glass Thermometer (-10°C to 110°C)', reportedOn: '03 Mar 2024', reportNo: '002', fine: '₹120', resolved: false,
    description: 'Thermometer dropped from workbench. Mercury contamination detected in Lab A Sector B.',
    remarks: 'Under review. Awaiting safety officer clearance before closing the case.',
  },
];

export type NotifTone = 'orange' | 'amber' | 'red' | 'green' | 'blue';
export interface Notification {
  icon: 'trend' | 'wrench' | 'clock' | 'check' | 'alert' | 'info';
  tone: NotifTone;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export const notifications: Notification[] = [
  { icon: 'trend', tone: 'orange', title: 'Low Stock Alert', body: 'Hydrochloric Acid (36%) is below minimum threshold. Only 8 of 20 required bottles remain.', time: '10 min ago', unread: true },
  { icon: 'wrench', tone: 'amber', title: 'Equipment Maintenance Due', body: 'UV Spectrophotometer (UV-2023-006 – Lab C) is overdue for its 6-month service by 12 days.', time: '1 hour ago', unread: true },
  { icon: 'clock', tone: 'red', title: 'Chemical Expiry Warning', body: 'Acetaldehyde (batch ACD-2023-034) expires in 5 days on 10 Jul 2024. Dispose of or use immediately.', time: '3 hours ago', unread: true },
  { icon: 'check', tone: 'green', title: 'Purchase Request Approved', body: 'PR-2024-089 for Sodium Hydroxide (10 bags) has been approved by the Principal.', time: 'Yesterday', unread: false },
  { icon: 'alert', tone: 'orange', title: 'New Damage Report Filed', body: 'Student Rahul Sharma (60004210123) filed a damage report for a Glass Thermometer in Lab A.', time: '2 days ago', unread: false },
  { icon: 'info', tone: 'blue', title: 'Lab Schedule Updated', body: 'BSc Chemistry Practical (Thursday) relocated to Lab B due to ongoing maintenance in Lab A.', time: '3 days ago', unread: false },
];

export interface Lab {
  name: string;
  department: string;
  capacity: string;
  assistant: string;
  equipment: string;
  active: boolean;
}

export const labs: Lab[] = [
  { name: 'Lab A', department: 'Chemistry', capacity: '30 students', assistant: 'Mr. Vijay Kulkarni', equipment: '18 units', active: true },
  { name: 'Lab B', department: 'Physics / Biochemistry', capacity: '25 students', assistant: 'Ms. Sunita Dalvi', equipment: '15 units', active: true },
  { name: 'Lab C', department: 'Chemistry / Microbiology', capacity: '30 students', assistant: 'Mr. Raju Naik', equipment: '14 units', active: true },
  { name: 'Computer Lab', department: 'Information Technology', capacity: '40 students', assistant: 'Mr. Ajay More', equipment: '42 units', active: true },
];

export const adminTabs = ['Labs', 'Faculty', 'Students', 'Lab Assistants', 'Departments', 'Roles & Permissions'];

// Dashboard trend chart — monthly sessions & inventory count, Jan–Jun 2024
export const trend = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  sessions: [42, 38, 55, 61, 58, 72],
  items: [50, 48, 52, 58, 60, 66],
};

export const profile = {
  fullName: 'Dr. Admin User',
  employeeId: 'EMP-1001',
  email: 'admin@mithibai.edu',
  phone: '+91 98765 43210',
  department: 'Chemistry',
  designation: 'Lab Administrator',
};

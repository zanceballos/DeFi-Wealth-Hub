export const netAssetHistory = [
  { date: '23 Nov', value: 22000 },
  { date: '24', value: 25800 },
  { date: '25', value: 24200 },
  { date: '26', value: 27500 },
  { date: '27', value: 30800 },
  { date: '28', value: 33200 },
  { date: '28.5', value: 36500 },
  { date: '29', value: 39800 },
  { date: '29.5', value: 38200 },
  { date: '30', value: 45678 },
]

export const assetAllocation = [
  { name: 'OCBC', value: 20, color: '#FBBF24' },
  { name: 'DBS', value: 30, color: '#EF4444' },
  { name: 'MariBank', value: 10, color: '#22C55E' },
  { name: 'Interactive Brokers', value: 25, color: '#84CC16' },
  { name: 'Webull', value: 8, color: '#3B82F6' },
  { name: 'Tiger Brokers', value: 7, color: '#A855F7' },
]

export const netAssetChange = [
  { month: 'Jan', value: 48000 },
  { month: 'Feb', value: 52000 },
  { month: 'Mar', value: 47000 },
  { month: 'Apr', value: 50000 },
  { month: 'May', value: 56000 },
  { month: 'Jun', value: 78000 },
  { month: 'Jul', value: 68000 },
  { month: 'Aug', value: 60000 },
  { month: 'Sep', value: 54000 },
  { month: 'Oct', value: 50000 },
  { month: 'Nov', value: 46000 },
  { month: 'Dec', value: 32000 },
]

export const recentTransactions = [
  { id: 1, source: 'PRIME SUPERMARKET', posted: '5m ago', amount: -7.52, merchant: 'OCBC', category: 'Groceries' },
  { id: 2, source: 'THE COFFEE BEAN-JURONG', posted: '30m ago', amount: -9.30, merchant: 'DBS', category: 'Food' },
  { id: 3, source: 'KANG XUAN', posted: '2hr ago', amount: 500, merchant: 'Maribank', category: 'Bills' },
  { id: 4, source: 'QASHIER-959 MIXED RICE', posted: '1d ago', amount: -4.00, merchant: 'OCBC', category: 'Food' },
  { id: 5, source: 'NTU FOODCOURT NTU - ST', posted: '1d ago', amount: -5.50, merchant: 'Maribank', category: 'Food' },
  { id: 6, source: 'BUS/MRT SINGAPORE SG', posted: '1d ago', amount: -1.28, merchant: 'OCBC', category: 'Transport' },
  { id: 7, source: 'IZZAN', posted: '2d ago', amount: 20, merchant: 'DBS', category: 'Bills' },
]

export const CATEGORIES = [
  'Food', 'Transport', 'Bills', 'Groceries', 'Paynow',
  'Unknown', 'Entertainment', 'Health', 'Shopping',
]

export const allTransactions = [
  { id: 1,  source: 'BUS/MRT SINGAPORE SG',       merchant: 'OCBC',     date: '2026-03-03', time: '06:36', category: 'Transport',   posted: '5m ago',   amount: -7.52 },
  { id: 2,  source: 'THE COFFEE BEAN-JURONG',      merchant: 'DBS',      date: '2026-03-03', time: '06:36', category: 'Food',         posted: '25m ago',  amount: -7.52 },
  { id: 3,  source: 'STARHUB',                     merchant: 'Maribank', date: '2026-03-03', time: '06:36', category: 'Bills',        posted: '1h ago',   amount: -42.00 },
  { id: 4,  source: 'QASHIER-959 MIXED RICE',      merchant: 'OCBC',     date: '2026-03-03', time: '06:36', category: 'Unknown',      posted: '15h ago',  amount: -7.52 },
  { id: 5,  source: 'NTU FOODCOURT NTU - ST',      merchant: 'Maribank', date: '2026-03-03', time: '06:36', category: 'Paynow',       posted: '1w ago',   amount: -7.52 },
  { id: 6,  source: 'PRIME SUPERMARKET',           merchant: 'OCBC',     date: '2026-03-03', time: '06:36', category: 'Groceries',    posted: '5mth ago', amount: -32.40 },
  { id: 7,  source: 'THE COFFEE BEAN-JURONG',      merchant: 'DBS',      date: '2026-03-03', time: '06:36', category: 'Food',         posted: '1y ago',   amount: -8.90 },
  { id: 8,  source: 'KANG XUAN',                   merchant: 'Maribank', date: '2026-03-03', time: '06:36', category: 'Bills',        posted: '1y ago',   amount: 1000 },
  { id: 9,  source: 'BLK 345',                     merchant: 'OCBC',     date: '2026-03-03', time: '06:36', category: 'Unknown',      posted: '1y ago',   amount: -7.52 },
  { id: 10, source: 'NTU FOODCOURT NTU - ST',      merchant: 'Maribank', date: '2026-03-03', time: '06:36', category: 'Paynow',       posted: '1y ago',   amount: -6.50 },
  { id: 11, source: 'Grab* A-9XN7DOGWW7TUAV',      merchant: 'OCBC',     date: '2026-03-03', time: '06:36', category: 'Transport',    posted: '1y ago',   amount: -14.50 },
  { id: 12, source: 'THE COFFEE BEAN-JURONG',      merchant: 'DBS',      date: '2026-03-03', time: '06:36', category: 'Food',         posted: '1y ago',   amount: -9.30 },
  { id: 13, source: 'SP GROUP',                    merchant: 'Maribank', date: '2026-03-03', time: '06:36', category: 'Bills',        posted: '1y ago',   amount: -87.50 },
  { id: 14, source: 'CASHIER-949',                 merchant: 'OCBC',     date: '2026-03-03', time: '06:36', category: 'Unknown',      posted: '1y ago',   amount: -7.52 },
  { id: 15, source: 'ASTONS @ JEM',                merchant: 'Maribank', date: '2026-03-03', time: '06:36', category: 'Paynow',       posted: '1y ago',   amount: -35.00 },
]

export const spendingByCategory = [
  { category: 'Food',          amount: 342.50, color: '#F97316', percentage: 34 },
  { category: 'Bills',         amount: 215.00, color: '#84CC16', percentage: 21 },
  { category: 'Transport',     amount: 156.80, color: '#22C55E', percentage: 16 },
  { category: 'Groceries',     amount: 128.40, color: '#EC4899', percentage: 13 },
  { category: 'Entertainment', amount:  89.20, color: '#A855F7', percentage:  9 },
  { category: 'Health',        amount:  68.00, color: '#0EA5E9', percentage:  7 },
]

export const upcomingBills = [
  { name: 'Starhub Mobile',  amount:  42.00, dueDate: 'Mar 10', daysLeft:  4 },
  { name: 'SP Group',        amount:  87.50, dueDate: 'Mar 15', daysLeft:  9 },
  { name: 'Netflix',         amount:  18.00, dueDate: 'Mar 18', daysLeft: 12 },
  { name: 'Gym Membership',  amount:  65.00, dueDate: 'Mar 25', daysLeft: 19 },
]

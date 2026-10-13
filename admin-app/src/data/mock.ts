export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
export const emis = months.map((m, i) => ({
  no: i + 1,
  amount: 4250,
  date: `05 ${m} ${i < 7 ? 2026 : 2027}`,
  status: i < 4 ? "Paid" : i === 4 ? "Due" : "Upcoming",
}));

const names = ["Harun R", "Priya Nair", "Suresh Kumar", "Anjali Deshmukh", "Mohammed Irfan", "Lakshmi Venkat", "Rakesh Yadav", "Fatima Shaikh", "Gopal Reddy", "Meena Pillai", "Arjun Patil", "Kavita Joshi"];
const places = ["Kochi", "Thrissur", "Madurai", "Nashik", "Hubli", "Salem", "Indore", "Pune", "Guntur", "Kollam", "Satara", "Jaipur"];
const prods = ["Personal Loan", "Agri Loan", "LAP", "Personal Loan", "Agri Loan"];
const statuses = ["Active", "Active", "Active", "Overdue", "Active", "New", "Active", "Inactive", "Active", "Overdue", "Active", "Existing"];

export const customers = names.map((n, i) => ({
  id: `CUS-${10248 + i * 7}`,
  name: n,
  place: places[i],
  mobile: `+91 9${(8765432 + i * 13791).toString().slice(0, 4)} ${(43210 + i * 1117).toString().slice(0, 5)}`,
  product: prods[i % 5],
  loan: [50000, 120000, 450000, 35000, 80000, 25000, 200000, 0, 60000, 75000, 150000, 40000][i],
  outstanding: [38500, 92400, 401200, 21800, 61250, 25000, 168000, 0, 44100, 58900, 131000, 12600][i],
  emi: [4250, 6800, 14200, 3150, 4900, 2400, 9800, 0, 3900, 7250, 8100, 3600][i],
  due: `${String(5 + (i % 4) * 5).padStart(2, "0")} Oct 2026`,
  status: statuses[i],
}));

export const applications = [
  { id: "SM-2026-00123", name: "Harun R", type: "Personal & Emergency", amount: 50000, date: "28 Sep 2026", status: "Under Review" },
  { id: "SM-2026-00122", name: "Deepa Menon", type: "Agri & Rural Allied", amount: 180000, date: "27 Sep 2026", status: "Submitted" },
  { id: "SM-2026-00121", name: "Vikram Singh", type: "Loan Against Property", amount: 900000, date: "26 Sep 2026", status: "Under Review" },
  { id: "SM-2026-00120", name: "Sunita Bai", type: "Agri & Rural Allied", amount: 65000, date: "25 Sep 2026", status: "Approved" },
  { id: "SM-2026-00119", name: "Ramesh Gowda", type: "Personal & Emergency", amount: 30000, date: "25 Sep 2026", status: "Disbursement Pending" },
  { id: "SM-2026-00118", name: "Ayesha Khan", type: "Personal & Emergency", amount: 45000, date: "24 Sep 2026", status: "Rejected" },
  { id: "SM-2026-00117", name: "Naveen Raj", type: "Agri & Rural Allied", amount: 120000, date: "23 Sep 2026", status: "Approved" },
  { id: "SM-2026-00116", name: "Pooja Sharma", type: "Personal & Emergency", amount: 20000, date: "22 Sep 2026", status: "Submitted" },
];

export const agents = [
  { id: "AGT-01", name: "Ravi Shankar", mobile: "+91 94470 11223", assigned: 42, today: 51250, held: 13150, status: "Active" },
  { id: "AGT-02", name: "Manoj Thomas", mobile: "+91 94471 55210", assigned: 38, today: 22400, held: 22400, status: "Active" },
  { id: "AGT-03", name: "Sajitha K", mobile: "+91 98950 77812", assigned: 35, today: 10850, held: 4200, status: "Active" },
  { id: "AGT-04", name: "Biju Varghese", mobile: "+91 97440 32190", assigned: 29, today: 0, held: 0, status: "Inactive" },
];

export const monthly = [
  { m: "May", upi: 3.2, cash: 1.4, disbursed: 8.5, overdue: 0.6 },
  { m: "Jun", upi: 3.8, cash: 1.6, disbursed: 7.2, overdue: 0.7 },
  { m: "Jul", upi: 4.1, cash: 1.9, disbursed: 9.1, overdue: 0.9 },
  { m: "Aug", upi: 4.6, cash: 2.1, disbursed: 6.8, overdue: 0.8 },
  { m: "Sep", upi: 5.2, cash: 2.4, disbursed: 10.4, overdue: 1.1 },
  { m: "Oct", upi: 5.9, cash: 2.6, disbursed: 9.6, overdue: 0.9 },
];

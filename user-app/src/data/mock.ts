export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export const customer = {
  name: "Harun R",
  first: "Harun",
  mobile: "+91 98765 43210",
  email: "harun.r@example.in",
  id: "CUS-10248",
  loanId: "SM-LN-2026-0418",
};

export const products = [
  {
    id: "agri",
    name: "Agri & Rural Allied Loan",
    badge: "RURAL PRIORITY",
    desc: "Credit support for agricultural inputs, dairy farming, poultry, livestock and rural needs.",
    amount: "₹20,000 – ₹3,50,000",
    rate: "12% – 28% p.a.",
    tenure: "6 – 30 Months",
  },
  {
    id: "personal",
    name: "Personal & Emergency Loan",
    badge: "FAST TRACK",
    desc: "Quick digital cash assistance for medical emergencies, education and urgent needs.",
    amount: "₹10,000 – ₹75,000",
    rate: "15% – 20% p.a.",
    tenure: "3 – 12 Months",
  },
  {
    id: "lap",
    name: "Loan Against Property",
    badge: "HIGHER LIMIT",
    desc: "Higher-value financing secured against eligible property.",
    amount: "Flexible",
    rate: "Based on approved terms",
    tenure: "Flexible",
  },
];

const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
export const emis = months.map((m, i) => ({
  no: i + 1,
  amount: 4250,
  date: `05 ${m} ${i < 7 ? 2026 : 2027}`,
  status: i < 4 ? "Paid" : i === 4 ? "Due" : "Upcoming",
}));

export const payments = [
  { emi: "EMI #04", amount: 4250, date: "05 Sep 2026, 10:42 AM", status: "Successful", txn: "SMT8842193021" },
  { emi: "EMI #03", amount: 4250, date: "04 Aug 2026, 06:15 PM", status: "Successful", txn: "SMT8731049921" },
  { emi: "EMI #03", amount: 4250, date: "04 Aug 2026, 06:02 PM", status: "Failed", txn: "SMT8731049007" },
  { emi: "EMI #02", amount: 4250, date: "05 Jul 2026, 09:20 AM", status: "Successful", txn: "SMT8620117745" },
  { emi: "EMI #01", amount: 4250, date: "05 Jun 2026, 11:08 AM", status: "Successful", txn: "SMT8511902210" },
  { emi: "Processing fee", amount: 1000, date: "28 May 2026, 03:30 PM", status: "Pending", txn: "SMT8499001284" },
];

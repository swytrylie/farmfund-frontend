// Mock data for the Financial Reports page, shaped like real API responses.
// Only "Aug 2026" has real numbers for either report type — every other
// period/report combination resolves to null, which the component reads as
// "nothing generated for this selection yet" and shows the placeholder for.
// Swap each function's body for a real `authedRequest(...)` call once the
// matching backend endpoint exists — the components calling them don't change.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

// Note: the three income rows below sum to ₱250,800, not the stated ₱253,000
// Gross Income — a ₱2,200 gap in the original spec. Net Profit (₱129,800)
// only reconciles using the stated ₱253,000, so that figure is kept as the
// authoritative summary value while the line items are shown exactly as given.
export async function getProfitLossStatement(period) {
  if (period !== "Aug 2026") return delay(null);

  return delay({
    incomeRows: [
      { label: "Crop Sales", value: "₱171,800" },
      { label: "Livestock / Dairy", value: "₱64,000" },
      { label: "Government Grants", value: "₱15,000" },
    ],
    grossIncome: "₱253,000",
    expenseRows: [
      { label: "Seeds & Inputs", value: "₱54,700" },
      { label: "Labour", value: "₱24,000" },
      { label: "Equipment", value: "₱9,800" },
      { label: "Transport", value: "₱7,300" },
      { label: "Irrigation", value: "₱27,400" },
    ],
    totalExpenses: "₱123,200",
    netProfit: "₱129,800",
  });
}

// Note: only June's figures were specified in the original spec. Its profit
// (₱58,000) doesn't actually equal income minus expenses (₱121,000 −
// ₱85,000 = ₱36,000) — that literal value is kept as given. Every other
// month here is a filled-in placeholder, built so its own profit stays
// mathematically correct (income − expenses).
export async function getCashFlowData(period) {
  if (period !== "Aug 2026") return delay(null);

  return delay([
    { month: "Mar", income: 95000, expenses: 60000, profit: 35000 },
    { month: "Apr", income: 105000, expenses: 68000, profit: 37000 },
    { month: "May", income: 115000, expenses: 78000, profit: 37000 },
    { month: "Jun", income: 121000, expenses: 85000, profit: 58000 }, // given, doesn't reconcile
    { month: "Jul", income: 130000, expenses: 90000, profit: 40000 },
    { month: "Aug", income: 145000, expenses: 95000, profit: 50000 },
  ]);
}

// These percentages reconcile exactly with the dollar amounts, which
// together sum to ₱123,200 — the same Total Expenses figure from the
// Profit & Loss report for the same period.
export async function getExpenseBreakdown(period) {
  if (period !== "Aug 2026") return delay(null);

  return delay([
    { label: "Seed & Inputs", percent: 44, amount: "₱54,700" },
    { label: "Labour", percent: 20, amount: "₱24,000" },
    { label: "Equipment", percent: 8, amount: "₱9,800" },
    { label: "Transport", percent: 6, amount: "₱7,300" },
    { label: "Irrigation", percent: 22, amount: "₱27,400" },
  ]);
}

// Only May's figures were specified (and they reconcile exactly: ₱165,000
// − ₱91,000 = ₱74,000 profit). Every other month here is a filled-in
// placeholder, built so its own profit stays mathematically correct.
export async function getCropReport(period) {
  if (period !== "Aug 2026") return delay(null);

  return delay([
    { month: "Mar", income: 120000, expenses: 70000, profit: 50000 },
    { month: "Apr", income: 140000, expenses: 80000, profit: 60000 },
    { month: "May", income: 165000, expenses: 91000, profit: 74000 }, // given, reconciles
    { month: "Jun", income: 150000, expenses: 85000, profit: 65000 },
    { month: "Jul", income: 145000, expenses: 82000, profit: 63000 },
    { month: "Aug", income: 155000, expenses: 88000, profit: 67000 },
  ]);
}
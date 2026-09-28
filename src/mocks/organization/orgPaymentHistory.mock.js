// Mock data for Payment History. Nelmar's 4 rows were given exactly (see
// the reconciliation note in chat — only the first pair checks out as a
// clean running balance, kept as given regardless). Juan is used as the
// genuine empty-history example, since he's already "Overdue" everywhere
// else in the app — no payments yet is consistent with that, not arbitrary.
// Zxcv's 3 payments are invented but match his existing trend chart on
// Loan Records exactly (₱40k installments reducing ₱120k → 0).

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const LOAN_OPTIONS = [
  { value: "LN-0231", label: "Nelmar Lauron - LN-0231" },
  { value: "LN-0244", label: "Juan Dela Cruz - LN-0244" },
  { value: "LN-0918", label: "Zxcv Bnm - LN-0918" },
];

const PAYMENT_HISTORY = {
  "LN-0231": [
    {
      date: "2026-08-30",
      amount: 14200,
      method: "Gcash",
      balanceAfter: 312000,
      receivedBy: "Coord. Qwe",
      status: "on-time",
    },
    {
      date: "2026-07-30",
      amount: 12000,
      method: "Gcash",
      balanceAfter: 326200,
      receivedBy: "Coord. Juan",
      status: "on-time",
    },
    {
      date: "2026-06-30",
      amount: 9000,
      method: "Bank Transfer",
      balanceAfter: 340400,
      receivedBy: "Coord. Jklcv",
      status: "on-time",
    },
    {
      date: "2026-05-30",
      amount: 50000,
      method: "Gcash",
      balanceAfter: 354000,
      receivedBy: "Coord. Mnbv",
      status: "late-3",
    },
  ],
  "LN-0244": [], // Juan — genuinely no payments yet, matches his Overdue status elsewhere
  "LN-0918": [
    {
      date: "2024-07-20",
      amount: 40000,
      method: "Bank Transfer",
      balanceAfter: 0,
      receivedBy: "Coord. Qwe",
      status: "on-time",
    },
    {
      date: "2024-04-20",
      amount: 40000,
      method: "Bank Transfer",
      balanceAfter: 40000,
      receivedBy: "Coord. Qwe",
      status: "on-time",
    },
    {
      date: "2024-01-20",
      amount: 40000,
      method: "Bank Transfer",
      balanceAfter: 80000,
      receivedBy: "Coord. Qwe",
      status: "on-time",
    },
  ],
};

export async function getPaymentHistory(loanId) {
  return delay(PAYMENT_HISTORY[loanId] ?? []);
}
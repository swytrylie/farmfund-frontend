// Mock data for Repayment Tracking. This page is now read-only — payment
// records are meant to come from the backend fetching real data, not a
// manual "add" form — so this only exports the payment list itself.
// "Received By" names, amounts, and remaining balances were given exactly
// for these 3 rows.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

const PAYMENTS = [
  {
    id: "pay-1",
    date: "2026-08-30",
    borrower: "Nelmar Lauron",
    loanId: "LN-0231",
    amount: 188000,
    method: "GCash",
    receivedBy: "Coord. Abcd",
    remainingBalance: 312000, // matches Nelmar's known real outstanding exactly (500,000 principal − 188,000 = 312,000)
  },
  {
    id: "pay-2",
    date: "2026-08-22",
    borrower: "Asdf Ghjk",
    loanId: "LN-0271",
    amount: 6500,
    method: "Cash",
    receivedBy: "Coord. Zxcv",
    remainingBalance: 26000,
  },
  {
    id: "pay-3",
    date: "2026-08-05",
    borrower: "Maria Santos",
    loanId: "LN-0177",
    amount: 10000,
    method: "Bank Transfer (BDO, BPI, Landbank)",
    receivedBy: "Coord. Abcd",
    remainingBalance: 0,
  },
];

export async function getRepaymentData() {
  return delay({ payments: PAYMENTS });
}
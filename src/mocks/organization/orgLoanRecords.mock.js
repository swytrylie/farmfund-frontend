// Mock data for the Org Dashboard's Loan Records page. Nelmar's full detail
// breakdown was given exactly and matches his loan on the individual side
// (same LANDBANK numbers). Juan and Zxcv's card-level numbers match what's
// already shown on Borrower Management, but their full detail-panel
// breakdowns (interest rate, term, monthly payment, next due) weren't
// specified anywhere — filled in as reasonable placeholders so selecting
// either card is genuinely interactive, not real given figures.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

// Same borrower roster as Borrower Management, kept consistent across pages
export const BORROWER_OPTIONS = [
  "Nelmar Lauron",
  "Juan Dela Cruz",
  "Asdf Ghjk",
  "Zxcv Bnm",
  "Maria Santos",
  "Ramon Cruz",
];

export const LOAN_TYPE_OPTIONS = [
  "Crop production loan",
  "Farm equipment / machinery loan",
  "Livestock loan",
  "Land acquisition loan",
  "Farm expansion loan",
  "Working capital loan",
  "Input financing (seeds, fertilizer, chemicals)",
  "Post-harvest facility loan (dryer, warehouse, etc.)",
  "Emergency / calamity loan",
  "Other",
];

export const LOAN_TERM_OPTIONS = [
  "3 months",
  "6 months",
  "12 months",
  "18 months",
  "24 months",
  "36 months",
  "48 months",
  "60 months",
  "Custom",
];

export const PAYMENT_FREQUENCY_OPTIONS = [
  "Weekly",
  "Biweekly",
  "Monthly",
  "Quarterly",
  "Semi-annual",
  "Annual",
  "Per harvest / seasonal",
  "Lump sum at maturity (balloon payment)",
];

const LOANS = {
  "LN-0231": {
    id: "LN-0231",
    borrower: "Nelmar Lauron",
    subtitle: "Farm Equipment",
    status: "active",
    progress: 42,
    remainingLabel: "₱87,500 remaining",
    interestRate: "14% p.a.",
    term: "2025-03-01 to 2026-12-01",
    principal: "₱500,000",
    outstanding: "₱312,000",
    totalPaid: "₱188,000",
    monthlyPayment: "₱14,200",
    nextDue: "2026-09-05",
    nextDueDays: "(7 days)",
    trend: [500000, 420000, 340000, 260000, 180000, 100000, 20000],
  },
  "LN-0244": {
    id: "LN-0244",
    borrower: "Juan Dela Cruz",
    subtitle: "Crop Production",
    status: "overdue",
    progress: 33,
    remainingLabel: "₱120,000 remaining • overdue",
    interestRate: "11% p.a.", // placeholder — not specified
    term: "2025-01-10 to 2026-07-10", // placeholder — not specified
    principal: "₱180,000",
    outstanding: "₱120,000",
    totalPaid: "₱60,000",
    monthlyPayment: "₱10,000", // placeholder — not specified
    nextDue: "2026-08-10", // placeholder — already overdue
    nextDueDays: "(overdue)",
    trend: [180000, 165000, 150000, 135000, 120000, 120000, 120000], // placeholder — flat where overdue/stalled
  },
  "LN-0918": {
    id: "LN-0918",
    borrower: "Zxcv Bnm",
    subtitle: "Fully repaid",
    status: "paid",
    progress: 100,
    remainingLabel: "₱0 remaining",
    interestRate: "9% p.a.", // placeholder — not specified
    term: "2024-01-20 to 2024-07-20", // placeholder — not specified
    principal: "₱120,000",
    outstanding: "₱0",
    totalPaid: "₱120,000",
    monthlyPayment: "₱40,000", // placeholder — not specified
    nextDue: "—",
    nextDueDays: "(fully repaid)",
    trend: [120000, 80000, 40000, 0, 0, 0, 0],
  },
};

export async function getLoanRecords() {
  return delay({
    kpis: {
      totalOutstanding: "₱4.82M",
      activeLoans: 62, // note: Org Dashboard home shows "6 Active loans" for this same figure — discrepancy, kept as given here
      avgInterestRate: "12.3%",
    },
    loans: LOANS,
  });
}

export async function saveNewLoanRecord() {
  return delay({ success: true });
}
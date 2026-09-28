// Mock data for Admin Financial Record Monitoring.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

const METRICS = {
  transactionsToday: "3,402",
  receiptsUploaded: "18,204 total",
  totalLoanVolume: "₱48.2M",
  aiAdvisorSessions: "6,810 this month",
};

const FEATURE_ADOPTION = [
  { feature: "Income & Expenses", activeUsers: 1190, rate: "95.4%" },
  { feature: "Budget Management", activeUsers: 842, rate: "67.5%" },
  { feature: "AI Advisor", activeUsers: 701, rate: "56.2%" },
  { feature: "Loans & Debt", activeUsers: 612, rate: "49.0%" },
  { feature: "Digital Receipts", activeUsers: 1050, rate: "84.1%" },
];

const RECORD_ACCESS = [
  {
    id: "access-1",
    farmer: "Nelmar Lauron",
    cooperative: "Kasama Farmers Association",
    status: "not-authorized",
    caseRef: null,
  },
  {
    id: "access-2",
    farmer: "Juan Dela Cruz",
    cooperative: "Kasama Farmers Association",
    status: "authorized",
    caseRef: "Fraud review #4471",
    // Record summary shown when an authorized admin clicks "View record" —
    // reuses Juan's already-established figures from elsewhere in the app
    // (Loan Records, Borrower Management) rather than inventing new ones.
    record: {
      loanId: "LN-0244",
      loanType: "Crop Production",
      principal: "₱180,000",
      outstanding: "₱120,000",
      totalPaid: "₱60,000",
      status: "Overdue",
    },
  },
];

export async function getFinancialMonitoring() {
  return delay({
    metrics: METRICS,
    featureAdoption: FEATURE_ADOPTION,
    recordAccess: RECORD_ACCESS,
  });
}

export async function submitAccessRequest() {
  return delay({ success: true });
}
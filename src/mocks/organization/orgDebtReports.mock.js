// Mock data for Debt Reports. Every figure in this spec reconciled exactly
// against itself and against numbers already established elsewhere in the
// app (Net Outstanding, 62 active loans, the 134-repayment split, all 7
// overdue accounts, both Total Collections breakdowns) — genuinely clean,
// no fixes or flags needed this time. Only "Aug 2026" has real data, same
// pattern as Financial Reports/Forecasting — other periods resolve to null.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const REPORT_CARDS = [
  {
    key: "outstanding-loans",
    title: "Outstanding Loans",
    subtitle: "62 active loans",
  },
  {
    key: "completed-requirements",
    title: "Completed Requirements",
    subtitle: "This quarter",
  },
  {
    key: "overdue-debts",
    title: "Overdue Debts",
    subtitle: "7 accounts",
  },
  {
    key: "total-collections",
    title: "Total Collections",
    subtitle: "Year to date",
  },
];

export const PERIODS = ["Aug 2026", "Jul 26", "Q2 2026", "2026 YTD"];

const REPORTS = {
  "outstanding-loans": {
    cardTitle: "Outstanding Loans Report — August 2026",
    sections: [
      {
        heading: "By status",
        rows: [
          { label: "Current", value: "55 loans", color: "text-emerald-700 font-medium" },
          { label: "Overdue", value: "7 loans", color: "text-red-600 font-medium" },
        ],
      },
      {
        heading: "By amount",
        rows: [
          { label: "Principal disbursed to date", value: "₱6,100,000", color: "" },
          {
            label: "Total collected to date",
            value: "₱1,280,000",
            color: "text-emerald-700 font-medium",
          },
        ],
      },
    ],
    totalLabel: "Net Outstanding",
    totalValue: "₱4,820,000",
  },

  "completed-requirements": {
    cardTitle: "Outstanding Repayments Report — August 2026",
    sections: [
      {
        heading: "Summary",
        rows: [
          {
            label: "Loans fully repaid this quarter",
            value: "9 loans",
            color: "text-emerald-700 font-medium",
          },
          { label: "Repayments recorded this month", value: "134 repayments", color: "" },
          {
            label: "On-time repayments",
            value: "121 repayments (90.3%)",
            color: "text-emerald-700 font-medium",
          },
          {
            label: "Late payments (1-5 days)",
            value: "13 repayments (9.7%)",
            color: "text-red-700 font-medium",
          },
        ],
      },
      {
        heading: "By amount",
        rows: [
          {
            label: "Total repaid by this quarter",
            value: "₱842,000",
            color: "text-emerald-700 font-medium",
          },
          { label: "Average repayment amount", value: "₱13,450", color: "" },
        ],
      },
    ],
    totalLabel: "Fully repaid loan value",
    totalValue: "₱1,015,000",
  },

  "overdue-debts": {
    cardTitle: "Overdue Debts Report — August 2026",
    sections: [
      {
        heading: "By days overdue",
        rows: [
          { label: "1-7 days overdue", value: "3 accounts", color: "text-red-700 font-medium" },
          { label: "8-14 days overdue", value: "2 accounts", color: "text-red-700 font-medium" },
          { label: "15+ days overdue", value: "2 accounts", color: "text-red-700 font-medium" },
        ],
      },
      {
        heading: "By amount",
        rows: [
          {
            label: "Juan Dela Cruz - LN-0244",
            value: "₱15,000",
            color: "text-red-700 font-medium",
          },
          { label: "Asdf Ghjk - LN-0256", value: "₱8,500", color: "text-red-700 font-medium" },
          {
            label: "Remaining overdue accounts (5)",
            value: "₱294,500",
            color: "text-red-700 font-medium",
          },
        ],
      },
    ],
    totalLabel: "Total overdue at risk",
    totalValue: "₱318,000",
  },

  "total-collections": {
    // Spec's title for this card was a copy-paste of Card C's — using the
    // sensible parenthetical alternative it also offered instead.
    cardTitle: "Total Collections Report — August 2026",
    sections: [
      {
        heading: "By quarter",
        rows: [
          { label: "Q1 2026", value: "₱268,400", color: "" },
          { label: "Q2 2026", value: "₱312,900", color: "" },
          { label: "Q3 2026 (to date)", value: "₱612,400", color: "" },
        ],
      },
      {
        heading: "By method",
        rows: [
          { label: "Gcash", value: "₱742,300", color: "" },
          { label: "Bank Transfer", value: "₱318,600", color: "" },
          { label: "Cash", value: "₱132,800", color: "" },
        ],
      },
    ],
    totalLabel: "Total collected YTD",
    totalValue: "₱1,193,700",
  },
};

export async function getDebtReport(reportKey, period) {
  if (period !== "Aug 2026") return delay(null);
  return delay(REPORTS[reportKey] ?? null);
}
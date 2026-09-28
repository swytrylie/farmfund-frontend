// Mock data for Overdue Debt Monitoring. Only Juan Dela Cruz and Asdf
// Ghjk's exact amount/days-overdue were given; Wkwkwkw and 4 more rows were
// invented to reach the stated "7 overdue accounts" — their amounts were
// deliberately chosen so all 7 sum to exactly ₱318,000, matching the
// header banner (and the Overdue Loans KPI already shown elsewhere).
//
// REMINDER_TYPE_OPTIONS/SEND_VIA_OPTIONS used to live here, but the shared
// Send Reminder modal now imports the canonical versions from
// orgPaymentReminders.mock.js instead — see the note there.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

const OVERDUE_ACCOUNTS = [
  { borrower: "Juan Dela Cruz", loanId: "LN-0244", amountDue: 15000, daysOverdue: 18 },
  { borrower: "Asdf Ghjk", loanId: "LN-0256", amountDue: 8500, daysOverdue: 6 },
  { borrower: "Wkwkwkw", loanId: "LN-0259", amountDue: 45000, daysOverdue: 32 },
  { borrower: "Pedro Reyes", loanId: "LN-0263", amountDue: 62000, daysOverdue: 12 },
  { borrower: "Ana Garcia", loanId: "LN-0268", amountDue: 38500, daysOverdue: 45 },
  { borrower: "Roberto Santos", loanId: "LN-0272", amountDue: 71000, daysOverdue: 9 },
  { borrower: "Liza Torres", loanId: "LN-0277", amountDue: 78000, daysOverdue: 21 },
];

export async function getOverdueAccounts() {
  const totalAtRisk = OVERDUE_ACCOUNTS.reduce((sum, a) => sum + a.amountDue, 0);
  return delay({
    accounts: OVERDUE_ACCOUNTS,
    totalAtRisk,
  });
}

export async function sendReminder() {
  return delay({ success: true });
}
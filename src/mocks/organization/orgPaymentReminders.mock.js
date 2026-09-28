// Mock data for Payment Reminders. Also the canonical source for the
// REMINDER_TYPE_OPTIONS/SEND_VIA_OPTIONS lists shared with Overdue Debt
// Monitoring's Send Reminder modal — this page's spec gave a fuller list
// (4 reminder types, slightly different Send Via wording) than that page's
// original spec did, so this version wins and both pages now use it.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const REMINDER_TYPE_OPTIONS = [
  "Overdue notice",
  "Upcoming payment",
  "Payment follow-up",
  "Final overdue notice",
];

export const SEND_VIA_OPTIONS = [
  "App notification + email",
  "App notification only",
  "Email only",
];

// Same borrower/loan roster used elsewhere (Borrower Management, Loan
// Records), for consistency across pages.
export const BORROWER_LOAN_OPTIONS = [
  { value: "Nelmar Lauron|LN-0231", label: "Nelmar Lauron - LN-0231" },
  { value: "Juan Dela Cruz|LN-0244", label: "Juan Dela Cruz - LN-0244" },
  { value: "Asdf Ghjk|LN-0256", label: "Asdf Ghjk - LN-0256" },
  { value: "Zxcv Bnm|LN-0918", label: "Zxcv Bnm - LN-0918" },
  { value: "Maria Santos|LN-0177", label: "Maria Santos - LN-0177" },
  { value: "Ramon Cruz|LN-0263", label: "Ramon Cruz - LN-0263" },
];

const RECENTLY_SENT = [
  {
    id: "rem-1",
    borrower: "Juan Dela Cruz",
    type: "Overdue notice",
    channel: "App notification only",
    sent: "2026-08-31",
    status: "delivered",
    unread: true,
  },
  {
    id: "rem-2",
    borrower: "Asdf Ghjk",
    type: "Upcoming payment",
    channel: "Email only",
    sent: "2026-08-29",
    status: "delivered",
    unread: true,
  },
  {
    id: "rem-3",
    borrower: "Wkwkwkw",
    type: "Overdue notice",
    channel: "App notification + email",
    sent: "2026-08-27",
    status: "pending",
    unread: true,
  },
];

export async function getPaymentReminders() {
  return delay({ reminders: RECENTLY_SENT });
}

export async function sendReminder() {
  return delay({ success: true });
}
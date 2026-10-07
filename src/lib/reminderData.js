import { peso } from "./repaymentData";

// Shared by the Send Reminder form, Overdue Debt Monitoring and Payment
// Reminders, so "is this loan overdue, and by how many days" and "what does
// the default message say" are decided in exactly one place.

export const MAX_MESSAGE = 200;

export const REMINDER_TYPES = [
  { value: "overdue_notice", label: "Overdue notice" },
  { value: "upcoming_payment", label: "Upcoming payment" },
  { value: "payment_followup", label: "Payment follow-up" },
  { value: "final_overdue_notice", label: "Final overdue notice" },
];

export const REMINDER_TYPE_LABEL = Object.fromEntries(REMINDER_TYPES.map((t) => [t.value, t.label]));

const MS_PER_DAY = 86400000;
const startOfLocalDay = (d) => {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
};

// Whole calendar days past the due date: positive = overdue, 0 = due today,
// negative = still ahead, null = the loan has no due date on record. Counted
// by calendar day, so a loan due today is not "overdue" until tomorrow.
export function daysOverdue(dueDate, now = new Date()) {
  if (!dueDate) return null;
  return Math.round((startOfLocalDay(now) - startOfLocalDay(dueDate)) / MS_PER_DAY);
}

// A reminder only makes sense for a loan that's actually out and still owes
// something — not one that's pending, rejected, or already paid off.
export function canRemind(loan) {
  return (loan.status === "active" || loan.status === "defaulted") && loan.remainingBalance > 0;
}

export function isOverdue(loan, now = new Date()) {
  const days = daysOverdue(loan.dueDate, now);
  return canRemind(loan) && days !== null && days > 0;
}

export function defaultReminderType(loan, now = new Date()) {
  const days = daysOverdue(loan.dueDate, now);
  return days !== null && days > 0 ? "overdue_notice" : "upcoming_payment";
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// The starting text for a reminder. It's built from the loan's real amount
// and timing — and always fits the 200-character limit — but it's only a
// starting point: staff can edit it before sending.
export function defaultMessage(type, loan, now = new Date()) {
  const amount = peso(loan.remainingBalance);
  const days = daysOverdue(loan.dueDate, now);

  let timing;
  if (days === null) timing = "is outstanding";
  else if (days > 0) timing = `is now ${plural(days, "day")} overdue`;
  else if (days === 0) timing = "is due today";
  else timing = `is due in ${plural(-days, "day")}`;

  switch (type) {
    case "upcoming_payment":
      return days !== null && days > 0
        ? `Your loan payment of ${amount} ${timing}. Please settle at your earliest convenience.`
        : `Your loan payment of ${amount} ${timing}. Please prepare your payment.`;
    case "payment_followup":
      return `This is a follow-up about your outstanding loan balance of ${amount}. Please contact us if you need to arrange payment.`;
    case "final_overdue_notice":
      return `FINAL NOTICE: your loan balance of ${amount} ${timing}. Please settle it immediately or contact us right away.`;
    case "overdue_notice":
    default:
      return `Your loan payment of ${amount} ${timing}. Please settle at your earliest convenience.`;
  }
}
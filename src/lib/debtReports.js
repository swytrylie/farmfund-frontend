import { peso, round2, loanRef, personName, METHOD_LABEL } from "./repaymentData";
import { isOverdue, daysOverdue } from "./reminderData";

// All four Debt Reports, computed from the cooperative's real loans and
// payments. Two kinds of report, and the difference matters:
//
//  - SNAPSHOT reports (Outstanding Loans, Overdue Debts) describe the state
//    of things RIGHT NOW. They can't be rebuilt for a past month: a loan has
//    no history of what its status or balance used to be, only what they
//    are today. So the period selector doesn't apply to them.
//  - PERIOD reports (Completed Repayments, Total Collections) are built
//    from payments, which each carry a real date — so they genuinely can
//    be cut by period.
//
// "Overdue" and "on time" use the same helpers as Overdue Debt Monitoring
// and Payment History, so every page agrees.

export const REPORT_CARDS = [
  { key: "outstanding-loans", title: "Outstanding Loans", snapshot: true },
  { key: "completed-requirements", title: "Completed Repayments", snapshot: false },
  { key: "overdue-debts", title: "Overdue Debts", snapshot: true },
  { key: "total-collections", title: "Total Collections", snapshot: false },
];

export const PERIOD_OPTIONS = [
  { key: "this-month", chip: "This month" },
  { key: "last-month", chip: "Last month" },
  { key: "this-quarter", chip: "This quarter" },
  { key: "ytd", chip: "Year to date" },
];

const DISBURSED = ["active", "paid_off", "defaulted"];
const sum = (items, pick) => round2(items.reduce((s, x) => s + pick(x), 0));
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const monthLabel = (d) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
const loanIdOf = (payment) => String(payment.loan?._id || payment.loan);

// Periods are relative to today, never hardcoded months.
export function resolvePeriod(key, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case "last-month": {
      const start = new Date(y, m - 1, 1);
      return { key, chip: "Last month", label: monthLabel(start), start, end: new Date(y, m, 1) };
    }
    case "this-quarter": {
      const q = Math.floor(m / 3);
      return { key, chip: "This quarter", label: `Q${q + 1} ${y}`, start: new Date(y, q * 3, 1), end: new Date(y, q * 3 + 3, 1) };
    }
    case "ytd":
      return { key, chip: "Year to date", label: `${y} (year to date)`, start: new Date(y, 0, 1), end: new Date(y, m, now.getDate() + 1) };
    case "this-month":
    default: {
      const start = new Date(y, m, 1);
      return { key: "this-month", chip: "This month", label: monthLabel(start), start, end: new Date(y, m + 1, 1) };
    }
  }
}

const within = (date, period) => {
  const d = new Date(date);
  return d >= period.start && d < period.end;
};

// The calendar months a period covers, up to today — each with its own label.
function monthsInPeriod(period, now) {
  const months = [];
  let cursor = new Date(period.start.getFullYear(), period.start.getMonth(), 1);
  while (cursor < period.end && cursor <= now) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    months.push({ start: cursor, end: next, label: monthLabel(cursor) });
    cursor = next;
  }
  return months;
}

const GOOD = "text-emerald-700 font-medium";
const BAD = "text-red-700 font-medium";

function outstandingLoansReport(loans, now) {
  const disbursed = loans.filter((l) => DISBURSED.includes(l.status));
  const stillOut = loans.filter((l) => (l.status === "active" || l.status === "defaulted") && l.remainingBalance > 0);
  const overdueCount = stillOut.filter((l) => isOverdue(l, now)).length;

  const principal = sum(disbursed, (l) => l.principalAmount);
  const owed = sum(disbursed, (l) => l.totalPayable);
  const collected = sum(disbursed, (l) => l.amountPaid);

  return {
    cardTitle: `Outstanding Loans Report — as of ${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    sections: [
      {
        heading: "By status",
        rows: [
          { label: "Current", value: plural(stillOut.length - overdueCount, "loan"), color: GOOD },
          { label: "Overdue", value: plural(overdueCount, "loan"), color: BAD },
          { label: "Marked as defaulted", value: plural(loans.filter((l) => l.status === "defaulted").length, "loan"), color: "" },
        ],
      },
      {
        heading: "By amount",
        rows: [
          { label: "Principal disbursed to date", value: peso(principal), color: "" },
          { label: "Interest on those loans", value: peso(round2(owed - principal)), color: "" },
          { label: "Total collected to date", value: peso(collected), color: GOOD },
        ],
      },
    ],
    totalLabel: "Net Outstanding",
    // The sum of what each loan still owes — which is exactly principal +
    // interest − collected, since a paid-off loan owes nothing.
    totalValue: peso(sum(stillOut, (l) => l.remainingBalance)),
    meta: { activeLoans: stillOut.length },
  };
}

function overdueDebtsReport(loans, now) {
  const overdue = loans
    .filter((l) => isOverdue(l, now))
    .map((l) => ({ loan: l, days: daysOverdue(l.dueDate, now) }));

  const bucket = (min, max) => overdue.filter((o) => o.days >= min && o.days <= max).length;
  const top = [...overdue].sort((a, b) => b.loan.remainingBalance - a.loan.remainingBalance || b.days - a.days).slice(0, 5);
  const rest = overdue.filter((o) => !top.includes(o));

  const amountRows = top.map((o) => ({
    label: `${personName(o.loan.farmer)} - ${loanRef(o.loan._id)}`,
    value: peso(o.loan.remainingBalance),
    color: BAD,
  }));
  if (rest.length > 0) {
    amountRows.push({
      label: `Other overdue accounts (${rest.length})`,
      value: peso(sum(rest, (o) => o.loan.remainingBalance)),
      color: BAD,
    });
  }
  if (amountRows.length === 0) amountRows.push({ label: "No overdue accounts", value: peso(0), color: "" });

  return {
    cardTitle: `Overdue Debts Report — as of ${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    sections: [
      {
        heading: "By days overdue",
        rows: [
          { label: "1-7 days overdue", value: plural(bucket(1, 7), "account"), color: BAD },
          { label: "8-14 days overdue", value: plural(bucket(8, 14), "account"), color: BAD },
          { label: "15+ days overdue", value: plural(bucket(15, Infinity), "account"), color: BAD },
        ],
      },
      { heading: "By amount", rows: amountRows },
    ],
    totalLabel: "Total overdue at risk",
    totalValue: peso(sum(overdue, (o) => o.loan.remainingBalance)),
    meta: { accounts: overdue.length },
  };
}

function completedRepaymentsReport(loans, payments, now, period) {
  const loansById = new Map(loans.map((l) => [String(l._id), l]));
  const inPeriod = payments.filter((p) => within(p.paymentDate, period));

  let onTime = 0;
  let late = 0;
  let unknown = 0;
  for (const p of inPeriod) {
    const loan = loansById.get(loanIdOf(p));
    // Judged against the day the payment was made: on or before the due date is on time.
    const days = loan ? daysOverdue(loan.dueDate, new Date(p.paymentDate)) : null;
    if (days === null) unknown++;
    else if (days > 0) late++;
    else onTime++;
  }
  const judged = onTime + late;
  const pct = (n) => (judged ? `${(Math.round((n / judged) * 1000) / 10).toFixed(1)}%` : "—");

  // A loan counts as fully repaid in this period if its FINAL payment was made in it.
  const lastPayment = new Map();
  for (const p of payments) {
    const id = loanIdOf(p);
    const when = new Date(p.paymentDate);
    if (!lastPayment.has(id) || when > lastPayment.get(id)) lastPayment.set(id, when);
  }
  const repaid = loans.filter(
    (l) => l.status === "paid_off" && lastPayment.has(String(l._id)) && within(lastPayment.get(String(l._id)), period)
  );

  const total = sum(inPeriod, (p) => p.amount);
  const summaryRows = [
    { label: "Loans fully repaid in this period", value: plural(repaid.length, "loan"), color: GOOD },
    { label: "Repayments recorded", value: plural(inPeriod.length, "repayment"), color: "" },
    { label: "On-time repayments", value: `${plural(onTime, "repayment")} (${pct(onTime)})`, color: GOOD },
    { label: "Late repayments (after the due date)", value: `${plural(late, "repayment")} (${pct(late)})`, color: BAD },
  ];
  if (unknown > 0) summaryRows.push({ label: "No due date on record", value: plural(unknown, "repayment"), color: "" });

  return {
    cardTitle: `Completed Repayments Report — ${period.label}`,
    sections: [
      { heading: "Summary", rows: summaryRows },
      {
        heading: "By amount",
        rows: [
          { label: "Total repaid in this period", value: peso(total), color: GOOD },
          { label: "Average repayment amount", value: peso(inPeriod.length ? round2(total / inPeriod.length) : 0), color: "" },
        ],
      },
    ],
    totalLabel: "Fully repaid loan value",
    totalValue: peso(sum(repaid, (l) => l.totalPayable)),
    meta: { fullyRepaid: repaid.length, repayments: inPeriod.length, onTime, late, unknown },
  };
}

function totalCollectionsReport(payments, now, period) {
  const inPeriod = payments.filter((p) => within(p.paymentDate, period));

  const monthRows = monthsInPeriod(period, now).map((month) => ({
    label: month.label,
    value: peso(sum(inPeriod.filter((p) => new Date(p.paymentDate) >= month.start && new Date(p.paymentDate) < month.end), (p) => p.amount)),
    color: "",
  }));

  const methodRows = Object.keys(METHOD_LABEL).map((method) => ({
    label: METHOD_LABEL[method],
    value: peso(
      sum(
        inPeriod.filter((p) => (METHOD_LABEL[p.method] ? p.method : "other") === method),
        (p) => p.amount
      )
    ),
    color: "",
  }));

  return {
    cardTitle: `Total Collections Report — ${period.label}`,
    sections: [
      { heading: "By month", rows: monthRows },
      { heading: "By method", rows: methodRows },
    ],
    totalLabel: `Total collected — ${period.chip.toLowerCase()}`,
    totalValue: peso(sum(inPeriod, (p) => p.amount)),
    meta: { payments: inPeriod.length },
  };
}

export function buildReport(key, { loans, payments, now = new Date(), period }) {
  switch (key) {
    case "outstanding-loans":
      return outstandingLoansReport(loans, now);
    case "completed-requirements":
      return completedRepaymentsReport(loans, payments, now, period);
    case "overdue-debts":
      return overdueDebtsReport(loans, now);
    case "total-collections":
      return totalCollectionsReport(payments, now, period);
    default:
      return null;
  }
}

// What shows under each card's title.
export function cardSubtitle(card, { loans, now = new Date(), period }) {
  if (card.key === "outstanding-loans") {
    const active = loans.filter((l) => (l.status === "active" || l.status === "defaulted") && l.remainingBalance > 0).length;
    return plural(active, "active loan");
  }
  if (card.key === "overdue-debts") return plural(loans.filter((l) => isOverdue(l, now)).length, "account");
  return period.chip;
}
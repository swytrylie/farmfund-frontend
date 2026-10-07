import { authedRequest } from "../api";

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

// Alerts are computed live, every time, from real Budget and Loan data —
// never stored. Each alert's id is a STABLE, deterministic string built
// from the underlying record, so a dismissal can be matched back to the
// same real condition on a future load (see DismissedAlert on the
// backend). Weather, Season, and Expenses alert types from the original
// mock aren't included — there's no real data source for the first two,
// and no honest, non-arbitrary rule for the third.
export async function computeAlerts() {
  try {
    const farms = await authedRequest("/api/farms");
    if (farms.length === 0) return [];
    const farmId = farms[0]._id;

    const [budgets, loans, dismissed] = await Promise.all([
      authedRequest(`/api/budgets?farm=${farmId}`),
      authedRequest("/api/loans?limit=100"),
      authedRequest("/api/dismissed-alerts"),
    ]);

    const alerts = [];

    // --- Budget alerts: any category genuinely over its allocation ---
    for (const budget of budgets) {
      if (!budget.categories) continue;
      for (const item of budget.categories) {
        const categoryId = item.category?._id || item.category;
        const categoryName = item.category?.name || "This category";

        const records = await authedRequest(
          `/api/financial-records?farm=${farmId}&type=expense&startDate=${budget.periodStart}&endDate=${budget.periodEnd}&limit=100`
        );
        const spent = records.filter((r) => (r.category?._id || r.category) === categoryId).reduce((s, r) => s + r.amount, 0);

        if (spent > item.allocatedAmount) {
          const overBy = spent - item.allocatedAmount;
          const overPercent = ((overBy / item.allocatedAmount) * 100).toFixed(1);
          alerts.push({
            id: `budget:${budget._id}:${categoryId}`,
            iconKey: "budget",
            title: `${categoryName} budget exceeded`,
            body: `You've spent ${peso(spent)} against a ${peso(item.allocatedAmount)} ${categoryName.toLowerCase()} budget — ${overPercent}% over. Review spending.`,
            time: timeAgo(budget.updatedAt || budget.createdAt),
            categories: ["Budget"],
          });
        }
      }
    }

    // --- Loan alerts: active loans due within 14 days, or already overdue ---
    const now = new Date();
    for (const loan of loans) {
      if (loan.status !== "active" || !loan.dueDate) continue;
      const due = new Date(loan.dueDate);
      const daysUntilDue = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      if (daysUntilDue > 14) continue;

      const coopName = loan.cooperative?.name || "your cooperative";
      const dueLabel = due.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      alerts.push({
        id: `loan:${loan._id}:due`,
        iconKey: "loan",
        title: daysUntilDue < 0 ? "Loan payment overdue" : `Loan payment due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`,
        body:
          daysUntilDue < 0
            ? `${coopName} loan ${peso(loan.principalAmount)} was due on ${dueLabel} and is now overdue.`
            : `${coopName} loan ${peso(loan.principalAmount)} due on ${dueLabel}. Ensure funds are ready.`,
        time: timeAgo(loan.updatedAt || loan.createdAt),
        categories: ["Loans"],
      });
    }

    return alerts.filter((a) => !dismissed.includes(a.id));
  } catch (err) {
    console.error("Failed to compute alerts:", err);
    return [];
  }
}

export async function dismissAlertById(alertId) {
  await authedRequest("/api/dismissed-alerts", { method: "POST", body: { alertKey: alertId } });
}

export const FILTERS = ["All", "Loans", "Budget"];
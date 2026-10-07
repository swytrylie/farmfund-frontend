import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { authedRequest } from "../../api";
import { peso, round2, fetchAllPages } from "../../lib/repaymentData";
import { daysOverdue } from "../../lib/reminderData";

const DISBURSED = ["active", "paid_off", "defaulted"];
const sum = (items, pick) => round2(items.reduce((s, x) => s + pick(x), 0));

// The six calendar months ending with the current one, oldest first.
function lastSixMonths(now) {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
      fullLabel: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      amount: 0,
      count: 0,
    });
  }
  return months;
}

const bucketFor = (months, date) => {
  const d = new Date(date);
  return months.find((m) => m.year === d.getFullYear() && m.monthIndex === d.getMonth());
};

// Everything here is worked out from the cooperative's real loans and
// payments (the server attaches each loan's amount paid and remaining
// balance).
//   "Lent"       = money actually disbursed: active, paid_off, or defaulted.
//   "Outstanding" = what active and defaulted loans still owe, interest included.
//   "Repayment rate" = money collected ÷ money that has come due. A loan
//                  counts as "come due" once its due date has passed, or once
//                  it has been repaid in full — so a loan that's still within
//                  its term can't pull the rate down.
//   "Approval"   = of loans that have been decided on (anything not still
//                  pending), how many were approved rather than rejected.
export function computeAnalytics(loans, payments, now = new Date()) {
  const disbursed = loans.filter((l) => DISBURSED.includes(l.status));

  const totalLent = sum(disbursed, (l) => l.principalAmount);
  const totalCollected = sum(disbursed, (l) => l.amountPaid);
  const outstanding = sum(
    loans.filter((l) => l.status === "active" || l.status === "defaulted"),
    (l) => l.remainingBalance
  );

  const cameDue = disbursed.filter((l) => l.status === "paid_off" || (l.dueDate && daysOverdue(l.dueDate, now) > 0));
  const owedOnDue = sum(cameDue, (l) => l.totalPayable);
  const repaymentRate = owedOnDue > 0 ? Math.round((sum(cameDue, (l) => l.amountPaid) / owedOnDue) * 1000) / 10 : null;

  const decided = loans.filter((l) => l.status !== "pending");
  const approved = decided.filter((l) => l.status !== "rejected");
  const approvalRate = decided.length > 0 ? Math.round((approved.length / decided.length) * 1000) / 10 : null;
  const pendingCount = loans.filter((l) => l.status === "pending").length;

  const requestsByMonth = lastSixMonths(now);
  for (const loan of loans) {
    const bucket = bucketFor(requestsByMonth, loan.createdAt);
    if (bucket) {
      bucket.amount = round2(bucket.amount + loan.principalAmount);
      bucket.count += 1;
    }
  }

  const collectionsByMonth = lastSixMonths(now);
  for (const payment of payments) {
    const bucket = bucketFor(collectionsByMonth, payment.paymentDate);
    if (bucket) {
      bucket.amount = round2(bucket.amount + payment.amount);
      bucket.count += 1;
    }
  }

  return { totalLent, totalCollected, outstanding, repaymentRate, approvalRate, pendingCount, requestsByMonth, collectionsByMonth };
}

function KPICard({ label, value, valueColor, hint }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-w-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-extrabold truncate ${valueColor}`} title={String(value)}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function makeTooltip(noun) {
  return function CustomTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null;
    const row = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs font-semibold text-gray-900">
        {row.fullLabel}: {peso(row.amount)} across {row.count} {noun}
        {row.count === 1 ? "" : "s"}
      </div>
    );
  };
}
const RequestsTooltip = makeTooltip("request");
const CollectionsTooltip = makeTooltip("payment");

function MonthlyChart({ title, rows, color, Tip, emptyMessage }) {
  const hasAny = rows.some((m) => m.count > 0);
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-w-0">
      <h3 className="text-base font-medium text-gray-700 mb-6">{title}</h3>
      {hasAny ? (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={rows}>
              <CartesianGrid vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip content={<Tip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar
                dataKey="amount"
                fill={color}
                radius={[8, 8, 0, 0]}
                maxBarSize={56}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-10">{emptyMessage}</p>
      )}
    </div>
  );
}

export default function FinancialAnalytics({ user }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        let cooperativeId = user?.cooperativeId;
        if (!cooperativeId) {
          const me = await authedRequest("/api/auth/me");
          cooperativeId = me.cooperativeId;
        }
        if (!cooperativeId) throw new Error("No cooperative membership found on this account.");

        const [loans, payments] = await Promise.all([
          fetchAllPages("/api/loans"),
          fetchAllPages(`/api/loan-payments?cooperative=${cooperativeId}`),
        ]);
        if (!cancelled) setAnalytics(computeAnalytics(loans, payments));
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load your data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Analytics</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading analytics…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Analytics</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Financial Analytics</h2>
      <p className="mt-1 text-gray-500">Lending, collections and approval performance, from your cooperative's real loans and payments</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KPICard label="TOTAL MONEY LENT" value={peso(analytics.totalLent)} valueColor="text-gray-900" hint="Principal disbursed" />
        <KPICard label="TOTAL COLLECTED" value={peso(analytics.totalCollected)} valueColor="text-[#4f7331]" hint="All payments recorded" />
        <KPICard label="OUTSTANDING BALANCE" value={peso(analytics.outstanding)} valueColor="text-[#a0522d]" hint="Still owed, interest included" />
        <KPICard
          label="REPAYMENT RATE"
          value={analytics.repaymentRate === null ? "N/A" : `${analytics.repaymentRate}%`}
          valueColor="text-[#4f7331]"
          hint="Collected, of what has come due"
        />
        <KPICard
          label="APPROVAL RATE"
          value={analytics.approvalRate === null ? "N/A" : `${analytics.approvalRate}%`}
          valueColor="text-[#4f7331]"
          hint="Approved, of loans decided on"
        />
        <KPICard label="PENDING REVIEW" value={analytics.pendingCount} valueColor="text-[#b8860b]" hint="Awaiting a decision" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart
          title="Collections - Last 6 Months"
          rows={analytics.collectionsByMonth}
          color="#4f7331"
          Tip={CollectionsTooltip}
          emptyMessage="No payments recorded in the last 6 months yet."
        />
        <MonthlyChart
          title="Loan Requests - Last 6 Months"
          rows={analytics.requestsByMonth}
          color="#3f5d27"
          Tip={RequestsTooltip}
          emptyMessage="No loan requests in the last 6 months yet."
        />
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Repayment rate is the money collected divided by the money that has come due. A loan counts as due once its due date
        has passed, or once it has been repaid in full, so loans still within their term don't lower the rate.
      </p>
    </div>
  );
}
import { useState, useEffect } from "react";
import { authedRequest } from "../../api";
import { peso, round2, personName, fetchAllPages } from "../../lib/repaymentData";
import { isOverdue, daysOverdue, canRemind } from "../../lib/reminderData";

const DISBURSED = ["active", "paid_off", "defaulted"];
const DUE_SOON_DAYS = 7;
const MAX_ATTENTION_ITEMS = 5;
const sum = (items, pick) => round2(items.reduce((s, x) => s + pick(x), 0));
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function lastSixMonths(now) {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
      fullLabel: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      collected: 0,
      count: 0,
    });
  }
  return months;
}

// Picks a chart scale that fits the real data — four equal steps with a
// round step size (1, 2, 2.5, 5 × a power of ten) — instead of a fixed
// ceiling, so a small cooperative's bars aren't a few pixels tall and a
// large one's don't run off the top.
export function niceScale(max) {
  if (!(max > 0)) return { step: 0, top: 0 };
  const raw = max / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((c) => c * magnitude).find((s) => s >= raw - 1e-9);
  const clean = (n) => Math.round(n * 1e6) / 1e6;
  return { step: clean(step), top: clean(step * 4) };
}

const trim = (n) => String(Number(n.toFixed(1)));
export function axisLabel(n) {
  if (n === 0) return "₱0";
  if (n >= 1e6) return `₱${trim(n / 1e6)}M`;
  if (n >= 1e3) return `₱${trim(n / 1e3)}k`;
  return `₱${trim(n)}`;
}

// Everything on the home page, worked out from the cooperative's real loans
// and payments — the same definitions Financial Analytics, Debt Reports and
// Overdue Debt Monitoring use, so the pages can never show different totals.
export function computeOverview(loans, payments, now = new Date()) {
  const disbursed = loans.filter((l) => DISBURSED.includes(l.status));
  const stillOut = loans.filter((l) => canRemind(l));
  const overdue = loans.filter((l) => isOverdue(l, now));

  // Counted the way Borrower Management counts them: every distinct farmer
  // with any loan on record with this cooperative.
  const borrowers = new Set(loans.map((l) => String(l.farmer?._id || l.farmer || "")).filter(Boolean)).size;

  const trend = lastSixMonths(now);
  let collectedThisMonth = 0;
  for (const p of payments) {
    const when = new Date(p.paymentDate);
    const bucket = trend.find((m) => m.year === when.getFullYear() && m.monthIndex === when.getMonth());
    if (bucket) {
      bucket.collected = round2(bucket.collected + p.amount);
      bucket.count += 1;
    }
    if (when.getFullYear() === now.getFullYear() && when.getMonth() === now.getMonth()) {
      collectedThisMonth = round2(collectedThisMonth + p.amount);
    }
  }

  const overdueItems = overdue
    .map((l) => {
      const days = daysOverdue(l.dueDate, now);
      return { id: l._id, name: personName(l.farmer), days, tag: "Overdue", note: `${plural(days, "day")} overdue` };
    })
    .sort((a, b) => b.days - a.days || a.name.localeCompare(b.name));

  // "Due soon" = still within its term, due within the next week (or today).
  const dueSoonItems = loans
    .filter((l) => canRemind(l) && l.dueDate)
    .map((l) => ({ loan: l, days: daysOverdue(l.dueDate, now) }))
    .filter(({ days }) => days <= 0 && days >= -DUE_SOON_DAYS)
    .map(({ loan, days }) => ({
      id: loan._id,
      name: personName(loan.farmer),
      days,
      tag: "Due soon",
      note: days === 0 ? "Due today" : `Due in ${plural(-days, "day")}`,
    }))
    .sort((a, b) => b.days - a.days || a.name.localeCompare(b.name));

  const attentionAll = [...overdueItems, ...dueSoonItems];
  const first = trend[0];
  const last = trend[trend.length - 1];

  return {
    borrowers,
    outstanding: sum(stillOut, (l) => l.remainingBalance),
    activeLoans: stillOut.length,
    totalCollected: sum(disbursed, (l) => l.amountPaid),
    collectedThisMonth,
    overdueCount: overdue.length,
    atRisk: sum(overdue, (l) => l.remainingBalance),
    attention: attentionAll.slice(0, MAX_ATTENTION_ITEMS),
    attentionMore: Math.max(0, attentionAll.length - MAX_ATTENTION_ITEMS),
    trend,
    scale: niceScale(Math.max(...trend.map((m) => m.collected))),
    trendRange: first.year === last.year ? `${first.month} - ${last.month} ${last.year}` : `${first.month} ${first.year} - ${last.month} ${last.year}`,
  };
}

function KPICard({ label, value, subtext, subtextColor, borderColor }) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-l-4 min-w-0 ${borderColor}`}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900 truncate" title={String(value)}>
        {value}
      </p>
      <p className={`mt-1 text-xs font-semibold ${subtextColor}`}>{subtext}</p>
    </div>
  );
}

function CollectionsTrendChart({ trend, scale, range }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);

  // Bars grow from 0 on mount, same technique as the other dashboards' bar
  // charts: start at 0, flip to true one frame later so the browser
  // registers the 0-height state before the CSS transition animates it.
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setGrown(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  const hasData = scale.top > 0;
  const yLabels = [4, 3, 2, 1, 0].map((i) => axisLabel(i * scale.step));

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Collections Trend</h3>
        <span className="text-xs text-gray-400">{range}</span>
      </div>

      {!hasData ? (
        <p className="mt-6 text-sm text-gray-400 text-center py-16">No payments recorded in the last 6 months yet.</p>
      ) : (
        <div className="mt-6 flex gap-3">
          <div className="flex flex-col justify-between text-[11px] text-gray-400 h-52 pb-6">
            {yLabels.map((label, i) => (
              <span key={`${label}-${i}`}>{label}</span>
            ))}
          </div>

          <div className="flex-1 flex items-end justify-between gap-3 h-52 border-l border-gray-100 pl-4 relative">
            {trend.map((d, i) => {
              const isHovered = hoveredMonth === d.month;
              return (
                <div
                  key={`${d.year}-${d.month}`}
                  data-testid="trend-bar-col"
                  className="relative flex flex-col items-center flex-1 h-full justify-end"
                  onMouseEnter={() => setHoveredMonth(d.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-md p-2.5 text-[11px] font-semibold space-y-1 whitespace-nowrap z-10">
                      <p className="text-gray-900">Collected: {peso(d.collected)}</p>
                      <p className="text-gray-500">{plural(d.count, "payment")}</p>
                    </div>
                  )}
                  <div
                    data-testid="trend-bar"
                    className={`w-6 rounded-t transition-all duration-700 ease-out ${isHovered ? "bg-[#c9922a]" : "bg-[#d9a736]"}`}
                    style={{
                      height: `${grown ? Math.min(100, (d.collected / scale.top) * 100) : 0}%`,
                      transitionDelay: `${i * 60}ms`,
                    }}
                  />
                  <span className="mt-2 text-[11px] text-gray-400">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NeedsAttentionCard({ item }) {
  const isOverdueTag = item.tag === "Overdue";
  return (
    <div className="flex items-center justify-between border border-gray-100 rounded-lg p-3.5">
      <div>
        <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
        <p className="text-xs text-gray-400">{item.note}</p>
      </div>
      <span
        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
          isOverdueTag ? "border-red-300 text-red-600" : "border-amber-300 text-amber-600"
        }`}
      >
        {item.tag}
      </span>
    </div>
  );
}

export default function OrgDashboardHome({ user, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [overview, setOverview] = useState(null);
  const [now] = useState(() => new Date());

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
        if (!cancelled) setOverview(computeOverview(loans, payments, now));
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load your dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mt-3">
        <h2 className="text-3xl font-bold text-gray-900">Hello, {user?.firstName}!</h2>
        <p className="mt-1 text-gray-500">
          {user?.orgName || "Your cooperative"} · {monthYear} overview
        </p>
      </div>

      {loading ? (
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading dashboard…</div>
      ) : loadError ? (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="TOTAL BORROWERS"
              value={overview.borrowers}
              subtext="Farmers with a loan"
              subtextColor="text-green-600"
              borderColor="border-green-600"
            />
            <KPICard
              label="OUTSTANDING DEBT"
              value={peso(overview.outstanding)}
              subtext={plural(overview.activeLoans, "active loan")}
              subtextColor="text-amber-600"
              borderColor="border-amber-500"
            />
            <KPICard
              label="TOTAL COLLECTED"
              value={peso(overview.totalCollected)}
              subtext={`${peso(overview.collectedThisMonth)} this month`}
              subtextColor="text-blue-600"
              borderColor="border-blue-500"
            />
            <KPICard
              label="OVERDUE LOANS"
              value={overview.overdueCount}
              subtext={overview.overdueCount > 0 ? `${peso(overview.atRisk)} at risk` : "Nothing overdue"}
              subtextColor={overview.overdueCount > 0 ? "text-red-600" : "text-green-600"}
              borderColor={overview.overdueCount > 0 ? "border-red-500" : "border-green-600"}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CollectionsTrendChart trend={overview.trend} scale={overview.scale} range={overview.trendRange} />

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Needs Attention</h3>
                <button
                  onClick={() => onNavigate?.("Borrower & Debt Management")}
                  className="text-sm font-semibold text-green-600 hover:underline"
                >
                  Manage &gt;
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {overview.attention.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nothing needs attention right now.</p>
                ) : (
                  overview.attention.map((item) => <NeedsAttentionCard key={item.id} item={item} />)
                )}
                {overview.attentionMore > 0 && (
                  <p className="text-xs text-gray-400 text-center">+ {overview.attentionMore} more</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
import {useState, useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  PieChart,
  Sprout,
  Landmark,
  FileBarChart,
  LineChart,
  Lightbulb,
  Sparkles,
  Receipt,
  Bell,
  User,
  LogOut,
  Clock,
} from "lucide-react";
import NotificationBell from "../shared/NotificationBell";
import AIAdvisorWidget from "../shared/AIAdvisorWidget";
import TrendsComparisons from "./TrendsComparisons";
import IncomeExpenses from "./IncomeExpenses";
import BudgetManagement from "./BudgetManagement";
import CropLivestock from "./CropLivestock";
import LoansDebt from "./LoansDebt";
import FinancialReports from "./FinancialReports";
import Forecasting from "./Forecasting"; 
import AIAdvisor from "./AIAdvisor";
import AISummary from "./AISummary";
import DigitalReceipts from "./DigitalReceipts";
import Alerts from "./Alerts";
import FarmProfile from "./FarmProfile";
import { authedRequest } from "../../api";
import { computeAlerts, dismissAlertById } from "../../lib/alertEngine";

// ---- Sidebar nav data ----
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard" },
      { icon: TrendingUp, label: "Trends & Comparisons" },
    ],
  },
  {
    label: "Finance",
    items: [
      { icon: Wallet, label: "Income & Expenses" },
      { icon: PieChart, label: "Budget Management" },
      { icon: Sprout, label: "Crop / Livestock" },
      { icon: Landmark, label: "Loans & Debt" },
    ],
  },
  {
    label: "Insights",
    items: [
      { icon: FileBarChart, label: "Financial Reports" },
      { icon: LineChart, label: "Forecasting" },
      { icon: Lightbulb, label: "AI Advisor" },
      { icon: Sparkles, label: "AI Summary" },
    ],
  },
  {
    label: "Records",
    items: [
      { icon: Receipt, label: "Digital Receipts" },
      { icon: Bell, label: "Alerts" },
    ],
  },
  {
    label: "Account",
    items: [{ icon: User, label: "Farm Profile" }],
  },
];

// Minimum floor so the chart doesn't look absurdly tall for a brand new
// account with only small amounts logged so far.
const CHART_FLOOR = 20000;


function SidebarNavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm transition-colors ${
        active
          ? "bg-[#4d6b41] text-white font-semibold"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={18} className="shrink-0" />
      {label}
    </button>
  );
}

function KPICard({ label, value, change, changeColor }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className={`mt-1 text-xs font-medium ${changeColor}`}>{change}</p>
    </div>
  );
}

function MonthlyOverviewChart({ data }) {
  // Scale is computed from the real data, with a floor so a brand-new
  // account with only small amounts logged doesn't get an absurdly tall
  // empty-looking chart.
  const maxValue = Math.max(CHART_FLOOR, ...data.flatMap((d) => [d.income, d.expenses]));
  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => `₱${Math.round((maxValue * (1 - f)) / 1000)}k`);

  // Bars grow from 0 on mount: starts at 0, flips to true one frame later so
  // the browser registers the 0-height state first, then the CSS transition
  // animates to the real height. Two rAFs (not one) because a single frame
  // can land in the same paint as the initial render in some browsers.
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setGrown(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Monthly Overview</h3>
        <span className="text-xs text-gray-400">Mar - Aug 2026</span>
      </div>

      <div className="mt-6 flex gap-3">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-52 pb-6">
          {yAxisLabels.map((label, idx) => (
            <span key={idx}>{label}</span>
          ))}
        </div>

        {/* Bars */}
        <div className="flex-1 flex items-end justify-between gap-3 h-52 border-l border-gray-100 pl-4">
          {data.map(({ month, income, expenses }, i) => (
            <div key={month} className="flex flex-col items-center flex-1">
              <div className="flex items-end gap-1 h-44">
                <div
                  className="w-3.5 rounded-t bg-green-500 transition-[height] duration-700 ease-out"
                  style={{
                    height: `${grown ? (income / maxValue) * 100 : 0}%`,
                    transitionDelay: `${i * 60}ms`,
                  }}
                  title={`Income: ₱${income.toLocaleString()}`}
                />
                <div
                  className="w-3.5 rounded-t bg-[#d9a736] transition-[height] duration-700 ease-out"
                  style={{
                    height: `${grown ? (expenses / maxValue) * 100 : 0}%`,
                    transitionDelay: `${i * 60 + 60}ms`,
                  }}
                  title={`Expenses: ₱${expenses.toLocaleString()}`}
                />
              </div>
              <span className="mt-2 text-[11px] text-gray-400">{month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Income
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#d9a736]" /> Expenses
        </span>
      </div>
    </div>
  );
}

const LOAN_STATUS_STYLE = {
  pending: { label: "Pending review", className: "text-amber-700 bg-amber-100" },
  approved: { label: "Approved", className: "text-blue-700 bg-blue-100" },
  active: { label: "Active", className: "text-green-700 bg-green-100" },
  paid_off: { label: "Paid off", className: "text-emerald-700 bg-emerald-100" },
  defaulted: { label: "Defaulted", className: "text-red-700 bg-red-100" },
  rejected: { label: "Rejected", className: "text-gray-500 bg-gray-100" },
};

// Shows real principal, status, and due date — no fabricated "progress"
// bar, since there's no real payment-recording flow yet to compute a
// genuine repayment percentage from.
function ActiveLoansPanel({ loans, onManage }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Loans</h3>
        <button
          onClick={onManage}
          className="text-sm font-semibold text-green-600 hover:underline"
        >
          Manage &gt;
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {loans.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No loans yet.</p>
        ) : (
          loans.map((loan) => {
            const style = LOAN_STATUS_STYLE[loan.status] || LOAN_STATUS_STYLE.pending;
            return (
              <div key={loan._id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {loan.cooperative?.name || "Cooperative"}
                    </p>
                    <p className="text-xs text-gray-400">
                      ₱{loan.principalAmount.toLocaleString()} · {loan.interestRatePercent}% p.a.
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${style.className}`}>
                    {style.label}
                  </span>
                </div>

                {loan.dueDate && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                    <Clock size={12} />
                    Due {new Date(loan.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RecentTransactionsTable({ transactions }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900">Recent Transactions</h3>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="pb-2 font-semibold">Date</th>
              <th className="pb-2 font-semibold">Description</th>
              <th className="pb-2 font-semibold">Category</th>
              <th className="pb-2 font-semibold">Method</th>
              <th className="pb-2 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={i} className="border-t border-gray-50">
                <td className="py-3 text-gray-500">{t.date}</td>
                <td className="py-3 text-gray-900 font-medium">
                  {t.description}
                </td>
                <td className="py-3">
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">
                    {t.category}
                  </span>
                </td>
                <td className="py-3 text-gray-500">{t.method}</td>
                <td
                  className={`py-3 text-right font-bold ${
                    t.positive ? "text-green-600" : "text-gray-700"
                  }`}
                >
                  {t.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FarmSetupPrompt() {
  return (
    <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center max-w-md mx-auto">
      <h3 className="font-bold text-gray-900 text-lg">No farm set up yet</h3>
      <p className="mt-2 text-sm text-gray-500">
        Set one up from Income & Expenses to see your real dashboard here.
      </p>
    </div>
  );
}

function DashboardHome({ user, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hasFarm, setHasFarm] = useState(true);
  const [records, setRecords] = useState([]);
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const farms = await authedRequest("/api/farms");
        if (cancelled) return;
        if (farms.length === 0) {
          setHasFarm(false);
          setLoading(false);
          return;
        }
        const farmId = farms[0]._id;

        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [recordsData, loansData] = await Promise.all([
          authedRequest(
            `/api/financial-records?farm=${farmId}&startDate=${sixMonthsAgo.toISOString()}&endDate=${now.toISOString()}&limit=100`
          ),
          authedRequest("/api/loans?limit=100"),
        ]);
        if (cancelled) return;
        setRecords(recordsData);
        setLoans(loansData.filter((l) => l.status === "active" || l.status === "approved"));
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
      <div className="mt-6 text-center text-gray-400 text-sm py-10">
        Loading dashboard…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
        {loadError}
      </div>
    );
  }

  if (!hasFarm) {
    return (
      <>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-3">
          <h2 className="text-3xl font-bold text-gray-900">Hello, {user?.firstName}!</h2>
        </div>
        <FarmSetupPrompt />
      </>
    );
  }

  // This month's totals, computed live from the same real records fetched
  // for the chart below — never a separately-stored number that could
  // drift out of sync.
  const now = new Date();
  const thisMonthRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const totalIncome = thisMonthRecords.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const totalExpenses = thisMonthRecords.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const net = totalIncome - totalExpenses;

  const kpis = [
    { label: "Income This Month", value: `₱${totalIncome.toLocaleString()}`, change: "", changeColor: "text-green-600" },
    { label: "Expenses This Month", value: `₱${totalExpenses.toLocaleString()}`, change: "", changeColor: "text-red-600" },
    { label: "Net This Month", value: `₱${net.toLocaleString()}`, change: "", changeColor: net >= 0 ? "text-green-600" : "text-red-600" },
    { label: "Active Loans", value: loans.length, change: "", changeColor: "text-gray-500" },
  ];

  // Last 6 real calendar months, bucketed from the same fetched records —
  // same technique as Financial Reports' Cash Flow chart.
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-US", { month: "short" }) });
  }
  const monthlyOverview = months.map(({ year, month, label }) => {
    let income = 0, expenses = 0;
    for (const r of records) {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (r.type === "income") income += r.amount;
        else expenses += r.amount;
      }
    }
    return { month: label, income, expenses };
  });

  const recentTransactions = [...records]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)
    .map((r) => ({
      date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      description: r.description || "—",
      category: r.category?.name || "Uncategorized",
      method: r.paymentMethod || "—",
      amount: `${r.type === "income" ? "+" : "-"}₱${r.amount.toLocaleString()}`,
      positive: r.type === "income",
    }));

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mt-3">
        <h2 className="text-3xl font-bold text-gray-900">
          Hello, {user?.firstName}!
        </h2>
        <p className="mt-1 text-gray-500">
          {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })} overview
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyOverviewChart data={monthlyOverview} />
        <ActiveLoansPanel
          loans={loans}
          onManage={() => onNavigate?.("Loans & Debt")}
        />
      </div>

      <div className="mt-6">
        <RecentTransactionsTable transactions={recentTransactions} />
      </div>
    </>
  );
}

// Placeholder for sidebar sections that don't have real content built yet
function ComingSoonPlaceholder({ sectionName }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">{sectionName}</h2>
      <div className="mt-6 bg-white rounded-xl p-10 shadow-sm border border-gray-100 text-center">
        <p className="text-gray-400 text-sm">
          {sectionName} isn't built yet — coming soon.
        </p>
      </div>
    </div>
  );
}

export default function Dashboard({ user, onSignOut }) {
  const [activeItem, setActiveItem] = useState("Dashboard");

  // Alerts now live here, once, shared by BOTH the bell popup and the full
  // Alerts page — dismissing in either place updates this one state, so
  // both are always showing the exact same thing. Computed live from real
  // budget/loan data every time, not stored — "unread" doesn't apply to a
  // live condition that either currently exists or doesn't, so every
  // alert shown here is simply one that hasn't been dismissed yet.
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    computeAlerts().then((data) => {
      if (!cancelled) setAlerts(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Optimistic: removed from view immediately, with the real dismissal
  // saved to the backend right alongside — if that save fails, the alert
  // would simply reappear on the next real page load, which is an honest
  // (if mildly inconvenient) outcome, not a silent data-loss risk.
  async function handleDismissAlert(id) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      await dismissAlertById(id);
    } catch (err) {
      console.error("Failed to save dismissal:", err);
    }
  }

  async function handleMarkAllAlertsRead() {
    const idsToDismiss = alerts.map((a) => a.id);
    setAlerts([]);
    try {
      await Promise.all(idsToDismiss.map((id) => dismissAlertById(id)));
    } catch (err) {
      console.error("Failed to save one or more dismissals:", err);
    }
  }

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  // Single source of truth mapping each sidebar label to its page component.
  // Every section renders through the exact same wrapper below, so their top
  // spacing can never drift out of sync from one another again.
  const SECTION_COMPONENTS = {
    Dashboard: DashboardHome,
    "Trends & Comparisons": TrendsComparisons,
    "Income & Expenses": IncomeExpenses,
    "Budget Management": BudgetManagement,
    "Crop / Livestock": CropLivestock,
    "Loans & Debt": LoansDebt,
   "Financial Reports": FinancialReports,
   "Forecasting": Forecasting,
   "AI Advisor": AIAdvisor,
   "AI Summary": AISummary,
   "Digital Receipts": DigitalReceipts,
   "Alerts": Alerts,
   "Farm Profile": FarmProfile,
  };
  const ActiveSectionComponent = SECTION_COMPONENTS[activeItem];

  // The AI Advisor page is a fixed-height chat screen: the whole layout is
  // locked to the viewport so the sidebar can't scroll away, and only the
  // chat's own message area scrolls. Every other page keeps its normal
  // scrolling behavior.
  const isAdvisorPage = activeItem === "AI Advisor";

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 min-w-[16rem] max-w-[16rem] h-screen shrink-0 bg-[#31422c] flex flex-col overflow-hidden px-4 py-4">
        <div className="px-2 mb-4">
          <p className="text-white font-bold text-lg">FarmFund</p>
        </div>

        <nav className="flex-1 min-h-0 space-y-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    active={item.label === activeItem}
                    onClick={() => setActiveItem(item.label)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User profile badge */}
        <div className="mt-3 bg-[#4d6b41] rounded-xl p-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">
              {fullName}
            </p>
            <p className="text-white/60 text-xs truncate">Farm Owner</p>
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      {/* Main content. On the AI Advisor page this is locked to the screen
          height as a non-scrolling flex column, so the chat page can scroll
          its own messages; every other page scrolls normally as before. */}
      <div
        className={`flex-1 min-w-0 h-screen ${
          isAdvisorPage ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
      <main
        className={`relative max-w-7xl mx-auto w-full px-8 pt-6 pb-8 ${
          isAdvisorPage ? "h-screen flex flex-col overflow-hidden" : "min-h-full"
        }`}
      >
        {/* Notification bell — floats independently via absolute positioning,
            taken out of the normal document flow entirely. Now reads/writes
            the same shared alerts state as the full Alerts page below.
            Position matches the Org Dashboard's bell exactly (top-6 right-8)
            instead of the old top-0 right-0, per request. */}
        <div className="absolute top-6 right-8 z-10">
          <NotificationBell
            alerts={alerts}
            onDismissAlert={handleDismissAlert}
            onMarkAllAlertsRead={handleMarkAllAlertsRead}
            onViewAllAlerts={() => setActiveItem("Alerts")}
          />
        </div>

        {/* Section content — every section, including Dashboard's own home
            page, now renders its own title as the true first element here.
            There is only one place controlling which component shows, so
            top alignment can't drift out of sync between sections again.
            Every section receives the shared alerts props too — only
            Alerts.jsx actually uses them, everything else just ignores
            the extra props, same as how `user` is already passed to all.
            onNavigate is the same idea: only DashboardHome currently uses
            it (for the Manage button), everything else ignores it. */}
        {ActiveSectionComponent ? (
          <ActiveSectionComponent
            user={user}
            alerts={alerts}
            onDismissAlert={handleDismissAlert}
            onMarkAllAlertsRead={handleMarkAllAlertsRead}
            onNavigate={setActiveItem}
          />
        ) : (
          <ComingSoonPlaceholder sectionName={activeItem} />
        )}

        {/* Floating AI Advisor widget (button + chat panel) — fixed to the
            viewport, so it stays in the same on-screen spot while scrolling
            regardless of which section is active. Hidden on the full-page AI
            Advisor view so it can't overlap that page's send button. */}
        {!isAdvisorPage && <AIAdvisorWidget />}
      </main>
      </div>
    </div>
  );
}
import { useState } from "react";
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
import NotificationBell from "./NotificationBell";
import AIAdvisorWidget from "./AIAdvisorWidget";
import TrendsComparisons from "./TrendsComparisons";
import IncomeExpenses from "./IncomeExpenses";
import BudgetManagement from "./BudgetManagement";
import CropLivestock from "./CropLivestock";
import LoansDebt from "./LoansDebt";

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

// ---- KPI cards data ----
const KPI_CARDS = [
  {
    label: "TOTAL INCOME",
    value: "₱58,200",
    change: "+8.3% vs last month",
    changeColor: "text-green-600",
  },
  {
    label: "TOTAL EXPENSES",
    value: "₱12,590",
    change: "-2.1% vs last month",
    changeColor: "text-red-500",
  },
  {
    label: "NET BALANCE",
    value: "₱45,610",
    change: "+18.4% vs last month",
    changeColor: "text-green-600",
  },
  {
    label: "ACTIVE LOANS",
    value: "₱151,500",
    change: "2 active loans",
    changeColor: "text-amber-600",
  },
];

// ---- Monthly chart mock data (Mar–Aug 2026), scaled against an ₱80k ceiling ----
const MONTHLY_DATA = [
  { month: "Mar", income: 38000, expenses: 15000 },
  { month: "Apr", income: 42000, expenses: 18000 },
  { month: "May", income: 51000, expenses: 20500 },
  { month: "Jun", income: 47000, expenses: 16800 },
  { month: "Jul", income: 55000, expenses: 19200 },
  { month: "Aug", income: 58200, expenses: 12590 },
];
const CHART_MAX = 80000;
const Y_AXIS_LABELS = ["₱80k", "₱60k", "₱40k", "₱20k", "₱0k"];

// ---- Active loans data ----
const ACTIVE_LOANS = [
  {
    name: "LANDBANK Agriculture",
    subtitle: "Farm Equipment",
    progress: 42,
    remaining: "₱87,500 remaining",
    due: "Due Sep 5, 2026",
  },
  {
    name: "Agrarian Reform Fund",
    subtitle: "Crop Production Capital",
    progress: 20,
    remaining: "₱64,000 remaining",
    due: "Due Sep 15, 2026",
  },
];

// ---- Recent transactions mock data (first row matches spec exactly) ----
const TRANSACTIONS = [
  {
    date: "Aug 20, 2026",
    description: "Corn Harvest",
    category: "Crop Sales",
    method: "GCash",
    amount: "+₱45,000.00",
    positive: true,
  },
  {
    date: "Aug 18, 2026",
    description: "Fertilizer Purchase",
    category: "Farm Supplies",
    method: "Cash",
    amount: "-₱6,200.00",
    positive: false,
  },
  {
    date: "Aug 15, 2026",
    description: "Loan Repayment",
    category: "Loan Payment",
    method: "Bank Transfer",
    amount: "-₱8,500.00",
    positive: false,
  },
  {
    date: "Aug 10, 2026",
    description: "Rice Harvest",
    category: "Crop Sales",
    method: "GCash",
    amount: "+₱21,000.00",
    positive: true,
  },
];

function SidebarNavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
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

function MonthlyOverviewChart() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Monthly Overview</h3>
        <span className="text-xs text-gray-400">Mar - Aug 2026</span>
      </div>

      <div className="mt-6 flex gap-3">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-52 pb-6">
          {Y_AXIS_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        {/* Bars */}
        <div className="flex-1 flex items-end justify-between gap-3 h-52 border-l border-gray-100 pl-4">
          {MONTHLY_DATA.map(({ month, income, expenses }) => (
            <div key={month} className="flex flex-col items-center flex-1">
              <div className="flex items-end gap-1 h-44">
                <div
                  className="w-3.5 rounded-t bg-green-500"
                  style={{ height: `${(income / CHART_MAX) * 100}%` }}
                  title={`Income: ₱${income.toLocaleString()}`}
                />
                <div
                  className="w-3.5 rounded-t bg-[#d9a736]"
                  style={{ height: `${(expenses / CHART_MAX) * 100}%` }}
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

function ActiveLoansPanel() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Active Loans</h3>
        <button className="text-sm font-semibold text-green-600 hover:underline">
          Manage &gt;
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {ACTIVE_LOANS.map((loan) => (
          <div
            key={loan.name}
            className="border border-gray-100 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {loan.name}
                </p>
                <p className="text-xs text-gray-400">{loan.subtitle}</p>
              </div>
              <span className="text-[11px] font-semibold text-green-700 bg-green-100 rounded-full px-2.5 py-1">
                Active
              </span>
            </div>

            <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${loan.progress}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">{loan.remaining}</span>
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Clock size={12} />
                {loan.due}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentTransactionsTable() {
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
            {TRANSACTIONS.map((t, i) => (
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

function DashboardHome() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Welcome banner */}
      <div className="mt-3">
        <h2 className="text-3xl font-bold text-gray-900">Hello, Nelmar!</h2>
        <p className="mt-1 text-gray-500">
          Lauron Family Farm · August 2026 overview
        </p>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts + Active Loans */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyOverviewChart />
        <ActiveLoansPanel />
      </div>

      {/* Recent Transactions */}
      <div className="mt-6">
        <RecentTransactionsTable />
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

export default function Dashboard({ onSignOut }) {
  const [activeItem, setActiveItem] = useState("Dashboard");

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
  };
  const ActiveSectionComponent = SECTION_COMPONENTS[activeItem];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#31422c] flex flex-col px-4 py-6">
        <div className="px-2 mb-8">
          <p className="text-white font-bold text-lg">FarmFund</p>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-1">
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
        <div className="mt-6 bg-[#4d6b41] rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
            NL
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">
              Nelmar Lauron
            </p>
            <p className="text-white/60 text-xs truncate">Farm Owner</p>
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-8 pt-6 pb-8 overflow-y-auto relative max-w-7xl mx-auto w-full">
        {/* Notification bell — floats independently via absolute positioning,
            taken out of the normal document flow entirely. This is what lets
            every section's title be the literal first element in the content
            area (matching how "FarmFund" is the first element in the sidebar)
            instead of being pushed down by a row the bell used to occupy. */}
        <div className="absolute top-0 right-0 z-10">
          <NotificationBell onViewAllAlerts={() => setActiveItem("Alerts")} />
        </div>

        {/* Section content — every section, including Dashboard's own home
            page, now renders its own title as the true first element here.
            There is only one place controlling which component shows, so
            top alignment can't drift out of sync between sections again. */}
        {ActiveSectionComponent ? (
          <ActiveSectionComponent />
        ) : (
          <ComingSoonPlaceholder sectionName={activeItem} />
        )}

        {/* Floating AI Advisor widget (button + chat panel) — fixed to the
            viewport, so it stays in the same on-screen spot while scrolling
            regardless of which section is active. */}
        <AIAdvisorWidget />
      </main>
    </div>
  );
}
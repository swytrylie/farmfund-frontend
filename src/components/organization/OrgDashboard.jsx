import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  RefreshCw,
  History,
  AlertOctagon,
  BellRing,
  BarChart3,
  TrendingUp,
  Building2,
  UserPlus,
  UserCog,
  LogOut,
} from "lucide-react";
import { getOrgDashboardOverview } from "../../mocks/organization/orgDashboard.mock";
import { getPaymentReminders, sendReminder } from "../../mocks/organization/orgPaymentReminders.mock";
import BorrowerManagement from "./BorrowerManagement";
import LoanRecords from "./LoanRecords";
import RepaymentTracking from "./RepaymentTracking";
import PaymentHistory from "./PaymentHistory";
import OverdueDebtMonitoring from "./OverdueDebtMonitoring";
import PaymentReminders from "./PaymentReminders";
import ReminderBell from "./ReminderBell";
 import DebtReports from "./DebtReports";
 import FinancialAnalytics from "./FinancialAnalytics";
 import CooperativeProfile from "./CooperativeProfile";
 import TeamInvitations from "./TeamInvitations";
 import MyAccount from "./MyAccount";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "Borrowers",
    items: [{ icon: Users, label: "Borrower & Debt Management" }],
  },
  {
    label: "Loans",
    items: [
      { icon: FileText, label: "Loan Records" },
      { icon: RefreshCw, label: "Repayment Tracking" },
      { icon: History, label: "Payment History" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { icon: AlertOctagon, label: "Overdue Debt Monitoring" },
      { icon: BellRing, label: "Payment Reminders" },
    ],
  },
  {
    label: "Insights",
    items: [
      { icon: BarChart3, label: "Debt Reports" },
      { icon: TrendingUp, label: "Financial Analytics" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: Building2, label: "Cooperative Profile" },
      { icon: UserPlus, label: "Team & Invitations" },
      { icon: UserCog, label: "My Account" },
    ],
  },
];

const CHART_MAX = 700000;
const Y_AXIS_LABELS = ["₱700k", "₱525k", "₱350k", "₱175k", "₱0"];

function SidebarNavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm text-left transition-colors ${
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

function KPICard({ label, value, subtext, subtextColor, borderColor }) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${borderColor}`}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className={`mt-1 text-xs font-semibold ${subtextColor}`}>{subtext}</p>
    </div>
  );
}

function CollectionsTrendChart({ data }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Collections Trend</h3>
        <span className="text-xs text-gray-400">Mar - Aug 2026</span>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-52 pb-6">
          {Y_AXIS_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="flex-1 flex items-end justify-between gap-3 h-52 border-l border-gray-100 pl-4 relative">
          {data.map((d) => {
            const isHovered = hoveredMonth === d.month;
            return (
              <div
                key={d.month}
                className="relative flex flex-col items-center flex-1 h-full justify-end"
                onMouseEnter={() => setHoveredMonth(d.month)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                {isHovered && (
                  <div className="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-xl shadow-md p-2.5 text-[11px] font-semibold space-y-1 whitespace-nowrap z-10">
                    <p className="text-gray-900">
                      Collected: ₱{d.collected.toLocaleString()}
                    </p>
                    <p className="text-gray-500">
                      Target: ₱{d.target.toLocaleString()}
                    </p>
                  </div>
                )}
                <div
                  className={`w-6 rounded-t transition-colors ${
                    isHovered ? "bg-[#c9922a]" : "bg-[#d9a736]"
                  }`}
                  style={{ height: `${(d.collected / CHART_MAX) * 100}%` }}
                />
                <span className="mt-2 text-[11px] text-gray-400">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NeedsAttentionCard({ item }) {
  const isOverdue = item.tag === "Overdue";
  return (
    <div className="flex items-center justify-between border border-gray-100 rounded-lg p-3.5">
      <div>
        <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
        <p className="text-xs text-gray-400">{item.note}</p>
      </div>
      <span
        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
          isOverdue
            ? "border-red-300 text-red-600"
            : "border-amber-300 text-amber-600"
        }`}
      >
        {item.tag}
      </span>
    </div>
  );
}

function OrgDashboardHome({ user, onNavigate }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getOrgDashboardOverview().then((data) => {
      if (!cancelled) {
        setOverview(data);
        setLoading(false);
      }
    });
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

  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mt-3">
        <h2 className="text-3xl font-bold text-gray-900">
          Hello, {user?.firstName}!
        </h2>
        <p className="mt-1 text-gray-500">
          {user?.orgName || "Your cooperative"} · August 2026 overview
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overview.kpis.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CollectionsTrendChart data={overview.collectionsTrend} />

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
            {overview.needsAttention.map((item) => (
              <NeedsAttentionCard key={item.name} item={item} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

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

export default function OrgDashboard({ user, onSignOut }) {
  const [activeItem, setActiveItem] = useState("Dashboard");

  // Reminders now live here, once, shared by BOTH the bell popup and the
  // full Payment Reminders page — sending a reminder from either place
  // updates this one state, so both are always showing the exact same
  // thing. Same pattern already used for alerts on the individual side.
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getPaymentReminders().then((result) => {
      if (!cancelled) setReminders(result.reminders);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSendReminder(payload) {
    await sendReminder();
    // New reminders default to "pending" until real delivery confirmation
    // exists on a backend — not marked "delivered" immediately, since that
    // would be claiming something that hasn't actually happened yet.
    const newReminder = {
      id: `rem-${Date.now()}`,
      borrower: payload.borrower,
      type: payload.reminderType,
      channel: payload.sendVia,
      sent: new Date().toISOString().slice(0, 10),
      status: "pending",
      unread: true,
    };
    setReminders((prev) => [newReminder, ...prev]);
  }

  function handleMarkAllRemindersRead() {
    setReminders((prev) => prev.map((r) => ({ ...r, unread: false })));
  }

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  // Single source of truth mapping each sidebar label to its page component
  // — same pattern used on the individual Dashboard, so every section's
  // top alignment stays in sync and this list is the one place to update
  // when a new section gets built.
  const SECTION_COMPONENTS = {
    Dashboard: OrgDashboardHome,
    "Borrower & Debt Management": BorrowerManagement,
    "Loan Records": LoanRecords,
    "Repayment Tracking": RepaymentTracking,
    "Payment History": PaymentHistory,
    "Overdue Debt Monitoring": OverdueDebtMonitoring,
    "Payment Reminders": PaymentReminders,
    "Debt Reports": DebtReports,
    "Financial Analytics": FinancialAnalytics,
     "Cooperative Profile": CooperativeProfile,
     "Team & Invitations": TeamInvitations,
     "My Account": MyAccount,
  };
  const ActiveSectionComponent = SECTION_COMPONENTS[activeItem];

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-gray-50">
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

        <div className="mt-3 bg-[#4d6b41] rounded-xl p-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{fullName}</p>
            <p className="text-white/60 text-xs truncate">Owner</p>
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

      <div className="flex-1 min-w-0 h-screen overflow-y-auto">
      <main className="relative max-w-7xl mx-auto w-full px-8 pt-6 pb-8 min-h-full">
        {/* Reminder bell — sits in this ONE shared wrapper, so it appears
            in the top-right of every section's header without needing to
            be added to each page individually. Now a real popup (matching
            the individual dashboard's NotificationBell pattern) instead of
            a plain link — clicking the bell itself opens/closes the list,
            and only "View all reminders" inside it navigates away. */}
        <div className="absolute top-6 right-8 z-10">
          <ReminderBell
            reminders={reminders}
            onMarkAllRead={handleMarkAllRemindersRead}
            onViewAll={() => setActiveItem("Payment Reminders")}
          />
        </div>

        {ActiveSectionComponent ? (
          <ActiveSectionComponent
            user={user}
            onNavigate={setActiveItem}
            reminders={reminders}
            onSendReminder={handleSendReminder}
          />
        ) : (
          <ComingSoonPlaceholder sectionName={activeItem} />
        )}
      </main>
      </div>
    </div>
  );
}
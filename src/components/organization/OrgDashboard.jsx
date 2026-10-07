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
import { authedRequest } from "../../api";
import { fetchAllPages } from "../../lib/repaymentData";
import BorrowerManagement from "./BorrowerManagement";
import LoanRecords from "./LoanRecords";
import RepaymentTracking from "./RepaymentTracking";
import PaymentHistory from "./PaymentHistory";
import OverdueDebtMonitoring from "./OverdueDebtMonitoring";
import PaymentReminders from "./PaymentReminders";
import ReminderBell from "./ReminderBell";
import OrgDashboardHome from "./OrgDashboardHome";
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

  // The signed-in person's own details. Held here, not just read from the
  // `user` prop, so saving a new name in My Account updates the sidebar and
  // the greeting straight away instead of only after a page refresh.
  const [profile, setProfile] = useState(user);
  function handleProfileUpdated(updated) {
    setProfile((prev) => ({ ...prev, ...updated }));
  }

  // Who this account is within its cooperative. A fresh login or a restored
  // session already carries both, but a session opened before those fields
  // existed doesn't — in that case the server is asked once.
  const [orgInfo, setOrgInfo] = useState({
    cooperativeId: user?.cooperativeId || null,
    orgRole: user?.orgRole || null,
  });

  // Reminders live here, once, shared by the bell popup, Overdue Debt
  // Monitoring and the full Payment Reminders page — so sending one from
  // anywhere updates the single list all three read from.
  const [reminders, setReminders] = useState([]);
  const [remindersError, setRemindersError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let info = orgInfo;
        if (!info.cooperativeId || !info.orgRole) {
          const me = await authedRequest("/api/auth/me");
          info = { cooperativeId: me.cooperativeId || null, orgRole: me.orgRole || null };
          if (!cancelled) setOrgInfo(info);
        }
        if (info.cooperativeId) {
          const list = await fetchAllPages(`/api/loan-reminders?cooperative=${info.cooperativeId}`);
          if (!cancelled) setReminders(list);
        }
      } catch (err) {
        if (!cancelled) setRemindersError(err.message || "Failed to load reminders.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshReminders() {
    if (!orgInfo.cooperativeId) return;
    setReminders(await fetchAllPages(`/api/loan-reminders?cooperative=${orgInfo.cooperativeId}`));
    setRemindersError("");
  }

  // The one place a reminder is actually sent. The server emails the
  // borrower and records the attempt either way — a failed send is saved
  // as "failed", not lost — so the list is refreshed first. A refresh that
  // itself fails must not make a successful send look like a failed one.
  async function handleSendReminder({ loan, type, message }) {
    const reminder = await authedRequest("/api/loan-reminders", {
      method: "POST",
      body: { loan, type, message },
    });
    try {
      await refreshReminders();
    } catch (err) {
      setRemindersError(err.message || "The reminder was sent, but the list couldn't be refreshed.");
    }
    if (reminder.status === "failed") {
      throw new Error("The email couldn't be sent. It was logged as failed — you can try again.");
    }
    return reminder;
  }

  // Only a cooperative's owner or finance managers can send reminders; the
  // server enforces it too, this just hides buttons that would be refused.
  const canSendReminders = ["owner", "finance_manager"].includes(orgInfo.orgRole);

  const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  const initials = `${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`.toUpperCase();

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
            onViewAll={() => setActiveItem("Payment Reminders")}
          />
        </div>

        {ActiveSectionComponent ? (
          <ActiveSectionComponent
            user={profile}
            onProfileUpdated={handleProfileUpdated}
            onNavigate={setActiveItem}
            reminders={reminders}
            onSendReminder={handleSendReminder}
            canSendReminders={canSendReminders}
            remindersError={remindersError}
          />
        ) : (
          <ComingSoonPlaceholder sectionName={activeItem} />
        )}
      </main>
      </div>
    </div>
  );
}
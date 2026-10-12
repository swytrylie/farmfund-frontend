import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  UserCheck,
  ClipboardList,
  BarChart3,
  Megaphone,
  FileClock,
  DatabaseBackup,
  Wrench,
  LogOut,
  Bell,
  Info,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { authedRequest } from "../../api";
import UserManagement from "./UserManagement";
import FarmManagement from "./FarmManagement";
import UserActivityMonitoring from "./UserActivityMonitoring";
import AccountStatusManagement from "./AccountStatusManagement";
import FinancialRecordMonitoring from "./FinancialRecordMonitoring";
import ReportsAnalytics from "./ReportsAnalytics";
import NotificationManagement from "./NotificationManagement";
import AuditLogs from "./AuditLogs";
import BackupRecovery from "./BackupRecovery";
import SystemMonitoring from "./SystemMonitoring";
import { getAnnouncements, sendAnnouncement } from "../../mocks/admin/adminNotifications.mock";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "Users",
    items: [
      { icon: Users, label: "User Management" },
      { icon: Shield, label: "Farm Management" },
      { icon: Activity, label: "User Activity" },
      { icon: UserCheck, label: "Account Status" },
    ],
  },
  {
    label: "Monitoring",
    items: [{ icon: ClipboardList, label: "Financial Record Monitoring" }],
  },
  {
    label: "Insights",
    items: [{ icon: BarChart3, label: "Reports & Analytics" }],
  },
  {
    label: "Communications",
    items: [{ icon: Megaphone, label: "Notification Management" }],
  },
  {
    label: "System",
    items: [
      { icon: FileClock, label: "Audit Logs" },
      { icon: DatabaseBackup, label: "Backup & Recovery" },
      { icon: Wrench, label: "System Monitoring & Maintenance" },
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

function messageFrom(err, fallback) {
  return err && err.message ? err.message : fallback;
}

function formatCount(n) {
  return Number(n || 0).toLocaleString("en-US");
}

// "12m ago", "3h ago", "2d ago" — and a plain date once it is over a week old.
function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// The server sends plain numbers; the wording under each number is made here.
function buildKpiCards(k) {
  const green = "text-[#4d6b41]";
  const grey = "text-gray-500";
  const orange = "text-[#b85d19]";
  const pctActive = k.totalUsers > 0 ? Math.round((k.activeToday / k.totalUsers) * 100) : 0;
  return {
    totalUsers: {
      value: formatCount(k.totalUsers),
      tag: k.newThisWeek > 0 ? `↑ ${formatCount(k.newThisWeek)} this week` : "No new users this week",
      tagColor: k.newThisWeek > 0 ? green : grey,
    },
    cooperatives: {
      value: formatCount(k.activeCooperatives),
      tag: k.pendingCooperatives > 0 ? `${formatCount(k.pendingCooperatives)} awaiting approval` : "No applications waiting",
      tagColor: k.pendingCooperatives > 0 ? orange : grey,
    },
    activeToday: {
      value: formatCount(k.activeToday),
      tag: k.totalUsers > 0 ? `${pctActive}% of total users` : "No users yet",
      tagColor: k.activeToday > 0 ? green : grey,
    },
    suspendedAccounts: {
      value: formatCount(k.suspendedAccounts),
      tag: k.suspendedAccounts > 0 ? "Needs review" : "None right now",
      tagColor: k.suspendedAccounts > 0 ? orange : grey,
    },
  };
}

function KPICard({ label, value, tag, tagColor, borderColor }) {
  return (
    <div className={`border-l-4 ${borderColor} bg-white rounded-2xl p-5 shadow-sm border border-gray-100`}>
      <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-gray-900">{value}</p>
      <p className={`mt-1 text-xs font-semibold ${tagColor}`}>{tag}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs font-semibold text-gray-900">
      {label}: {payload[0].value} new {payload[0].value === 1 ? "account" : "accounts"}
    </div>
  );
}

function AccountGrowthChart({ data }) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-base font-bold text-gray-800 mb-4">
        Account Growth - Last 6 Months
      </h3>
      <p className="-mt-3 mb-3 text-xs text-gray-400">New accounts created each month</p>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, (max) => Math.max(5, max)]} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="value" fill="#d9a736" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive animationDuration={700} animationEasing="ease-out" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RecentActivityFeed({ activity, onNavigate }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800">Recent Activity</h3>
        <button
          onClick={() => onNavigate?.("User Activity")}
          className="text-xs font-semibold text-[#4d6b41] hover:underline cursor-pointer"
        >
          View all &gt;
        </button>
      </div>

      {activity.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No activity yet.</p>
      ) : (
        <div className="space-y-4">
          {activity.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <span
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  item.type === "cooperative" ? "bg-[#4d6b41]" : "bg-[#4a7fc9]"
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm text-gray-700">{item.text}</p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingApprovals({ approvals, busyId, onApprove, onDecline }) {
  // Which row is showing "Are you sure?" for Decline. Declining is the one
  // action here that tells an applicant "no", so it asks first.
  const [confirmingId, setConfirmingId] = useState(null);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-bold text-gray-900">Pending approvals</h3>
        <span className="bg-[#ffecc8] text-[#8c4a00] text-xs font-bold px-2.5 py-0.5 rounded-full">
          {approvals.length}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Cooperative applications awaiting administrator review
      </p>

      {approvals.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No pending approvals right now.
        </p>
      ) : (
        <div className="space-y-3">
          {approvals.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl p-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{a.org}</p>
                <p className="text-xs text-gray-500">
                  {a.role} • {a.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {a.email} • applied {timeAgo(a.submittedAt)}
                </p>
              </div>
              {confirmingId === a.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-600">Decline this application?</span>
                  <button
                    onClick={() => setConfirmingId(null)}
                    disabled={busyId === a.id}
                    className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await onDecline(a);
                      setConfirmingId(null);
                    }}
                    disabled={busyId === a.id}
                    className="bg-[#c24141] hover:bg-[#a83535] text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {busyId === a.id ? "Declining…" : "Yes, decline"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setConfirmingId(a.id)}
                    disabled={busyId === a.id}
                    className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => onApprove(a)}
                    disabled={busyId === a.id}
                    className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {busyId === a.id ? "Approving…" : "Approve"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminBell({ announcements, onMarkAllRead, onDismiss, onViewAll }) {
  const [isOpen, setIsOpen] = useState(false);
  // Tracked separately from the real announcements data — dismissing a
  // card here only hides it from THIS popup. The actual sent-announcement
  // record is untouched and still shows correctly on the full Notification
  // Management page, since dismissing a popup card shouldn't delete real
  // history.
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.has(a.id));
  const recentAnnouncements = visibleAnnouncements.slice(0, 5);
  const hasUnread = visibleAnnouncements.some((a) => a.unread);

  function handleDismiss(id) {
    setDismissedIds((prev) => new Set(prev).add(id));
    onDismiss(id);
  }

  function handleViewAll() {
    setIsOpen(false);
    onViewAll();
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen((o) => !o)} className="relative" aria-label="Notifications">
        <Bell className="w-6 h-6 text-slate-800 cursor-pointer hover:text-emerald-700 transition-colors" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-9 right-0 z-50 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-[#2d4027] px-5 py-4">
            <p className="text-white font-bold text-lg">Notifications</p>
          </div>

          <div className="px-4 pt-3 text-right">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Mark all as read
            </button>
          </div>

          <div className="px-3 py-2 space-y-2 max-h-80 overflow-y-auto">
            {recentAnnouncements.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No announcements sent yet.
              </p>
            ) : (
              recentAnnouncements.map((a) => (
                <div
                  key={a.id}
                  className="relative bg-[#f4f8f3] rounded-xl p-3.5"
                >
                  {a.unread && (
                    <span className="absolute top-3.5 left-3 w-2 h-2 rounded-full bg-green-500" />
                  )}
                  <button
                    onClick={() => handleDismiss(a.id)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    aria-label="Dismiss"
                  >
                    <X size={14} />
                  </button>

                  <div className="flex items-start gap-3 pl-4 pr-4">
                    <span className="w-8 h-8 rounded-lg bg-[#e0ebda] flex items-center justify-center shrink-0">
                      <Megaphone size={16} className="text-[#2d4027]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900">{a.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400">{a.sent}</span>
                        <span className="text-xs font-medium text-[#2d4027] bg-[#dbe7d3] px-2 py-0.5 rounded-full">
                          {a.audience}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleViewAll}
            className="w-full text-center py-3 text-sm text-gray-700 font-semibold border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            View all announcements
          </button>
        </div>
      )}
    </div>
  );
}

function Toast({ message, tone = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, tone === "error" ? 6000 : 3000);
    return () => clearTimeout(timer);
  }, [onClose, tone]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${
        tone === "error" ? "bg-[#c24141]" : "bg-[#2d4027]"
      }`}
    >
      {tone === "error" ? <Info size={16} /> : <CheckCircle2 size={16} />}
      {message}
    </div>
  );
}

function AdminDashboardHome({ data, busyId, onApprove, onDecline, onNavigate }) {
  const cards = buildKpiCards(data.kpis);
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Platform Dashboard</h2>
      <p className="mt-1 text-gray-500">
        System-wide activity across all farmer and cooperative accounts
      </p>

      <div className="mt-4 bg-[#f4f8f3] border border-[#d2e3cd] text-[#2d4027] text-xs px-4 py-2.5 rounded-xl mb-6 flex items-start gap-2">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>
          This dashboard views system-wide aggregate activity and does not
          display individual borrower details, records, or ledger data. User
          data privacy is strictly protected.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Users" {...cards.totalUsers} borderColor="border-l-[#4d6b41]" />
        <KPICard label="Cooperatives" {...cards.cooperatives} borderColor="border-l-[#d9a736]" />
        <KPICard label="Active Today" {...cards.activeToday} borderColor="border-l-[#4a7fc9]" />
        <KPICard
          label="Suspended Accounts"
          {...cards.suspendedAccounts}
          borderColor="border-l-[#c24141]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <AccountGrowthChart data={data.accountGrowth} />
        <RecentActivityFeed activity={data.recentActivity} onNavigate={onNavigate} />
      </div>

      <PendingApprovals
        approvals={data.pendingApprovals}
        busyId={busyId}
        onApprove={onApprove}
        onDecline={onDecline}
      />
    </div>
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

export default function AdminDashboard({ user, onSignOut }) {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null); // { message, tone }
  const [busyId, setBusyId] = useState(null);
  const actingRef = useRef(false); // blocks a double-click from sending two requests

  // Announcements now live here, once, shared by BOTH the bell popup and
  // the full Notification Management page — sending an announcement from
  // either place updates this one state, so both always show the same
  // thing. Same pattern already used elsewhere in this app for alerts and
  // payment reminders.
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getAnnouncements().then((result) => {
      if (!cancelled) setAnnouncements(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSendAnnouncement({ title, message, audience }) {
    await sendAnnouncement();
    const newAnnouncement = {
      id: `ann-${Date.now()}`,
      title,
      audience,
      sent: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: "delivered",
      unread: true,
    };
    setAnnouncements((prev) => [newAnnouncement, ...prev]);
  }

  function handleMarkAllAnnouncementsRead() {
    setAnnouncements((prev) => prev.map((a) => ({ ...a, unread: false })));
  }

  function handleDismissAnnouncement(id) {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, unread: false } : a))
    );
  }

  // Loads the real numbers. Called when the page opens and each time the
  // admin comes back to the Dashboard tab, so the figures are never stale.
  // `quiet` refreshes without flashing the "Loading…" screen.
  const loadDashboard = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setLoadError("");
    try {
      const result = await authedRequest("/api/admin/dashboard");
      setData(result);
    } catch (err) {
      if (err.status === 401) {
        // The login ran out and could not be renewed — back to the login page.
        onSignOut?.();
        return;
      }
      if (!quiet) setLoadError(messageFrom(err, "Could not load the dashboard."));
    } finally {
      setLoading(false);
    }
  }, [onSignOut]);

  useEffect(() => {
    if (activeItem === "Dashboard") loadDashboard({ quiet: data !== null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem]);

  // Approve / decline a cooperative application. Uses the existing admin-only
  // endpoint, so the server — not this page — decides whether it is allowed.
  async function changeApplication(approval, status) {
    if (actingRef.current) return;
    actingRef.current = true;
    setBusyId(approval.id);
    try {
      const result = await authedRequest(`/api/cooperatives/${approval.id}/status`, {
        method: "PATCH",
        body: { status },
      });
      setData((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals.filter((a) => a.id !== approval.id),
        kpis: {
          ...prev.kpis,
          pendingCooperatives: Math.max(0, prev.kpis.pendingCooperatives - 1),
          activeCooperatives: prev.kpis.activeCooperatives + (status === "active" ? 1 : 0),
        },
      }));
      const done = status === "active" ? `${approval.org} approved` : `${approval.org} declined`;
      // The decision is saved either way; this only says whether the owner's
      // email went out.
      if (result && result.emailSent === false) {
        setToast({ message: `${done}, but the email to the owner couldn't be sent.`, tone: "error" });
      } else {
        setToast({ message: done, tone: "success" });
      }
    } catch (err) {
      if (err.status === 404) {
        // Someone already removed it — refresh so the list is truthful.
        setToast({ message: "That application no longer exists. Refreshing the list.", tone: "error" });
        loadDashboard({ quiet: true });
      } else {
        setToast({ message: messageFrom(err, "Could not update the application."), tone: "error" });
      }
    } finally {
      actingRef.current = false;
      setBusyId(null);
    }
  }

  const handleApprove = (approval) => changeApplication(approval, "active");
  const handleDecline = (approval) => changeApplication(approval, "rejected");

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-gray-50">
      <aside className="w-64 min-w-[16rem] max-w-[16rem] h-screen shrink-0 bg-[#31422c] flex flex-col overflow-hidden px-4 py-4">
        <div className="px-2 mb-4">
          <p className="text-white font-bold text-lg">FarmFund Admin</p>
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
            {initials || "A"}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">
              {fullName || "Admin User"}
            </p>
            <p className="text-white/60 text-xs truncate">{user?.role === "admin" ? "System Admin" : user?.role || "System Admin"}</p>
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
        <div className="absolute top-6 right-8 z-10">
          <AdminBell
            announcements={announcements}
            onMarkAllRead={handleMarkAllAnnouncementsRead}
            onDismiss={handleDismissAnnouncement}
            onViewAll={() => setActiveItem("Notification Management")}
          />
        </div>

        {activeItem === "Dashboard" && loading && !data ? (
          <div className="text-center text-gray-400 text-sm py-10">
            Loading dashboard…
          </div>
        ) : activeItem === "Dashboard" && (loadError || !data) ? (
          <div className="bg-white rounded-xl p-10 shadow-sm border border-gray-100 text-center">
            <p className="text-sm text-[#c24141] font-medium">{loadError || "Could not load the dashboard."}</p>
            <button
              onClick={() => loadDashboard()}
              className="mt-4 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        ) : activeItem === "Dashboard" ? (
          <AdminDashboardHome
            data={data}
            busyId={busyId}
            onApprove={handleApprove}
            onDecline={handleDecline}
            onNavigate={setActiveItem}
          />
        ) : activeItem === "User Management" ? (
          <UserManagement onSignOut={onSignOut} />
        ) : activeItem === "Farm Management" ? (
          <FarmManagement onSignOut={onSignOut} />
        ) : activeItem === "User Activity" ? (
          <UserActivityMonitoring onSignOut={onSignOut} />
        ) : activeItem === "Account Status" ? (
          <AccountStatusManagement onSignOut={onSignOut} />
        ) : activeItem === "Financial Record Monitoring" ? (
          <FinancialRecordMonitoring onSignOut={onSignOut} />
        ) : activeItem === "Reports & Analytics" ? (
          <ReportsAnalytics />
        ) : activeItem === "Notification Management" ? (
          <NotificationManagement
            announcements={announcements}
            onSendAnnouncement={handleSendAnnouncement}
          />
        ) : activeItem === "Audit Logs" ? (
          <AuditLogs onSignOut={onSignOut} />
        ) : activeItem === "Backup & Recovery" ? (
          <BackupRecovery />
        ) : activeItem === "System Monitoring & Maintenance" ? (
          <SystemMonitoring />
        ) : (
          <ComingSoonPlaceholder sectionName={activeItem} />
        )}
      </main>
      </div>

      {toast && (
        <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
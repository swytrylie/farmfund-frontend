import { useState, useEffect } from "react";
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
import {
  getAdminDashboard,
  approveAccount,
  declineAccount,
} from "../../mocks/admin/adminDashboard.mock";
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
      {label}: {payload[0].value}%
    </div>
  );
}

function AccountGrowthChart({ data }) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-base font-bold text-gray-800 mb-4">
        Account Growth - Last 6 Months
      </h3>
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
            <YAxis hide domain={[0, 100]} />
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
          onClick={() => onNavigate?.("Platform Record Monitoring")}
          className="text-xs font-semibold text-[#4d6b41] hover:underline cursor-pointer"
        >
          View all &gt;
        </button>
      </div>

      <div className="space-y-4">
        {activity.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.color}`} />
            <div className="min-w-0">
              <p className="text-sm text-gray-700">{item.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingApprovals({ approvals, onApprove, onDecline }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-bold text-gray-900">Pending approvals</h3>
        <span className="bg-[#ffecc8] text-[#8c4a00] text-xs font-bold px-2.5 py-0.5 rounded-full">
          {approvals.length}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        New accounts awaiting administrator review
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
              className="flex items-center justify-between border border-gray-100 rounded-xl p-4"
            >
              <div>
                <p className="font-semibold text-gray-900">{a.name}</p>
                <p className="text-xs text-gray-500">
                  {a.role} • {a.org}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDecline(a)}
                  className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => onApprove(a)}
                  className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                >
                  Approve
                </button>
              </div>
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

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2d4027] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

function AdminDashboardHome({ data, onApprove, onDecline, onNavigate }) {
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
        <KPICard label="Total Users" {...data.kpis.totalUsers} borderColor="border-l-[#4d6b41]" />
        <KPICard label="Cooperatives" {...data.kpis.cooperatives} borderColor="border-l-[#d9a736]" />
        <KPICard label="Active Today" {...data.kpis.activeToday} borderColor="border-l-[#4a7fc9]" />
        <KPICard
          label="Suspended Accounts"
          {...data.kpis.suspendedAccounts}
          borderColor="border-l-[#c24141]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <AccountGrowthChart data={data.accountGrowth} />
        <RecentActivityFeed activity={data.recentActivity} onNavigate={onNavigate} />
      </div>

      <PendingApprovals
        approvals={data.pendingApprovals}
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
  const [toastMessage, setToastMessage] = useState("");

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

  useEffect(() => {
    let cancelled = false;
    getAdminDashboard().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleApprove(approval) {
    await approveAccount();
    setData((prev) => ({
      ...prev,
      pendingApprovals: prev.pendingApprovals.filter((a) => a.id !== approval.id),
    }));
    setToastMessage(`${approval.name} approved`);
  }

  async function handleDecline(approval) {
    await declineAccount();
    setData((prev) => ({
      ...prev,
      pendingApprovals: prev.pendingApprovals.filter((a) => a.id !== approval.id),
    }));
    setToastMessage(`${approval.name} declined`);
  }

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
            <p className="text-white/60 text-xs truncate">{user?.role || "System Admin"}</p>
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

        {loading ? (
          <div className="text-center text-gray-400 text-sm py-10">
            Loading dashboard…
          </div>
        ) : activeItem === "Dashboard" ? (
          <AdminDashboardHome
            data={data}
            onApprove={handleApprove}
            onDecline={handleDecline}
            onNavigate={setActiveItem}
          />
        ) : activeItem === "User Management" ? (
          <UserManagement />
        ) : activeItem === "Farm Management" ? (
          <FarmManagement />
        ) : activeItem === "User Activity" ? (
          <UserActivityMonitoring />
        ) : activeItem === "Account Status" ? (
          <AccountStatusManagement />
        ) : activeItem === "Financial Record Monitoring" ? (
          <FinancialRecordMonitoring />
        ) : activeItem === "Reports & Analytics" ? (
          <ReportsAnalytics />
        ) : activeItem === "Notification Management" ? (
          <NotificationManagement
            announcements={announcements}
            onSendAnnouncement={handleSendAnnouncement}
          />
        ) : activeItem === "Audit Logs" ? (
          <AuditLogs />
        ) : activeItem === "Backup & Recovery" ? (
          <BackupRecovery />
        ) : activeItem === "System Monitoring & Maintenance" ? (
          <SystemMonitoring />
        ) : (
          <ComingSoonPlaceholder sectionName={activeItem} />
        )}
      </main>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}
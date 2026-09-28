// Mock data for the Admin Platform Dashboard.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

const DASHBOARD_DATA = {
  kpis: {
    totalUsers: { value: "1,248", tag: "↑ 32 this week", tagColor: "text-[#4d6b41]" },
    cooperatives: { value: "46", tag: "Operating in 8 regions", tagColor: "text-gray-500" },
    activeToday: { value: "612", tag: "49% of total users", tagColor: "text-[#4d6b41]" },
    suspendedAccounts: { value: "7", tag: "Needs review", tagColor: "text-[#b85d19]" },
  },
  accountGrowth: [
    { month: "Mar", value: 45 },
    { month: "Apr", value: 65 },
    { month: "May", value: 40 },
    { month: "Jun", value: 75 },
    { month: "Jul", value: 68 },
    { month: "Aug", value: 88 },
  ],
  recentActivity: [
    {
      id: "act-1",
      text: "New cooperative registered: Dagupan Farmers Cooperative",
      time: "12m ago",
      color: "bg-[#4d6b41]",
    },
    {
      id: "act-2",
      text: "Account suspended: User ID #8843 suspended due to inactivity",
      time: "2h ago",
      color: "bg-[#e5883f]",
    },
    {
      id: "act-3",
      text: "Staff invited: 2 new staff accounts added to San Fabian Coop",
      time: "4h ago",
      color: "bg-[#4a7fc9]",
    },
    {
      id: "act-4",
      text: "Nightly backup completed: System database backup verified",
      time: "8h ago",
      color: "bg-gray-400",
    },
  ],
  pendingApprovals: [
    {
      id: "approval-1",
      name: "Max Verstappen",
      role: "Cooperative Manager",
      org: "Dagupan Farmers Coop",
    },
    {
      id: "approval-2",
      name: "Jane Doe",
      role: "Staff Member",
      org: "Central Pangasinan Coop",
    },
  ],
};

export async function getAdminDashboard() {
  return delay(DASHBOARD_DATA);
}

export async function approveAccount() {
  return delay({ success: true });
}

export async function declineAccount() {
  return delay({ success: true });
}
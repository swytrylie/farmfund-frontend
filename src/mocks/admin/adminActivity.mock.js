// Mock data for Admin User Activity Monitoring.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const FILTER_TABS = ["All", "Logins", "Failed Attempts"];

const ACTIVITY_LOG = [
  {
    id: "log-1",
    user: "Nelmar Lauron",
    action: "Login",
    deviceIp: "Chrome, iPhone • 122.55.xxx.12",
    timestamp: "Aug 31, 2026 8:14 AM",
    status: "success",
    category: "login",
  },
  {
    id: "log-2",
    user: "Ahshagaah Shagh",
    action: "Login",
    deviceIp: "Edge, Windows • 203.177.xxx.44",
    timestamp: "Aug 31, 2026 7:50 AM",
    status: "success",
    category: "login",
  },
  {
    id: "log-3",
    user: "unknown@gmail.com",
    action: "Login Attempt",
    deviceIp: "Chrome, Android • 45.90.xxx.201",
    timestamp: "Aug 30, 2026 11:42 PM",
    status: "failed-3x",
    category: "failed",
  },
  {
    id: "log-4",
    user: "Kiko Barzaga",
    action: "First login (invite accepted)",
    deviceIp: "Safari, iMac • 112.203.xxx.9",
    timestamp: "Aug 30, 2026 3:12 PM",
    status: "success",
    category: "login",
  },
];

export async function getUserActivity() {
  return delay(ACTIVITY_LOG);
}
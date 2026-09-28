// Mock data for Admin System Monitoring & Maintenance.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

const STATUS_SUMMARY = {
  serverStatus: "Operational",
  databaseStatus: "Healthy",
  cpuMemoryLoad: "34% / 61%",
  activeDbConnections: "128 / 500",
};

const MAINTENANCE = {
  enabled: false,
  windowStart: "2026-09-05T00:00",
  windowEnd: "2026-09-05T02:00",
  windowLabel: "Sep 5, 2026, 12:00 AM – 2:00 AM (auto-enable/disable)",
};

const SYSTEM_INFO = {
  platformVersion: "v2.4.1",
  lastDeployed: "Aug 28, 2026, 11:15 PM",
};

export async function getSystemStatus() {
  return delay({
    summary: STATUS_SUMMARY,
    maintenance: MAINTENANCE,
    systemInfo: SYSTEM_INFO,
  });
}

export async function toggleMaintenanceMode() {
  return delay({ success: true });
}

export async function updateMaintenanceWindow() {
  return delay({ success: true });
}

export async function clearCache() {
  return delay({ success: true });
}
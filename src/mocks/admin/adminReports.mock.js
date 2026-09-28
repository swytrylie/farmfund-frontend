// Mock data for Admin Reports & Analytics.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

const ACCOUNT_GROWTH = [
  { month: "Mar", value: 120 },
  { month: "Apr", value: 165 },
  { month: "May", value: 110 },
  { month: "Jun", value: 185 },
  { month: "Jul", value: 155 },
  { month: "Aug", value: 210 },
];

const SYSTEM_PERFORMANCE = [
  { label: "Uptime (30 days)", value: "99.94%", color: "text-[#2e7d32]" },
  { label: "Avg. Response Time", value: "218 ms", color: "text-gray-900" },
  { label: "Error Rate", value: "0.03%", color: "text-[#2e7d32]" },
];

const REGIONAL_DISTRIBUTION = [
  { region: "Region I — Ilocos", cooperatives: 18, farmers: 512 },
  { region: "Region III — Central Luzon", cooperatives: 14, farmers: 398 },
  { region: "Others", cooperatives: 9, farmers: 241 },
];

export async function getReportsAnalytics() {
  const totalCooperatives = REGIONAL_DISTRIBUTION.reduce((sum, r) => sum + r.cooperatives, 0);
  const totalFarmers = REGIONAL_DISTRIBUTION.reduce((sum, r) => sum + r.farmers, 0);

  return delay({
    accountGrowth: ACCOUNT_GROWTH,
    systemPerformance: SYSTEM_PERFORMANCE,
    regionalDistribution: REGIONAL_DISTRIBUTION,
    totals: { cooperatives: totalCooperatives, farmers: totalFarmers },
  });
}
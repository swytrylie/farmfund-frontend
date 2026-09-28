// Mock data for the Dashboard home page, shaped like a real API response.
// Swap the body of this function for a real `authedRequest("/api/dashboard")`
// call once that endpoint exists — every component calling it stays the same.

const MOCK_DELAY_MS = 300; // simulates real network latency during development

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export async function getDashboardOverview() {
  return delay({
    kpis: [
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
    ],

    monthlyOverview: [
      { month: "Mar", income: 38000, expenses: 15000 },
      { month: "Apr", income: 42000, expenses: 18000 },
      { month: "May", income: 51000, expenses: 20500 },
      { month: "Jun", income: 47000, expenses: 16800 },
      { month: "Jul", income: 55000, expenses: 19200 },
      { month: "Aug", income: 58200, expenses: 12590 },
    ],

    activeLoans: [
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
    ],

    recentTransactions: [
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
    ],
  });
}
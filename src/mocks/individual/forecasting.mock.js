// Mock data for the Financial Forecasting page, shaped like a real API
// response. Swap this function's body for a real `authedRequest(...)` call
// once the backend endpoint exists — the component calling it doesn't change.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export async function getForecastData() {
  return delay({
    // Mar–Aug are actual/historical (solid line), Sep–Dec are projected
    // (dashed line). Only May and Dec were given exact figures in the
    // original spec — everything else is a filled-in placeholder built to
    // match the described trajectory (dip around May, steady rise to Dec).
    chart: [
      { month: "Mar", income: 150000, expenses: 88000 },
      { month: "Apr", income: 135000, expenses: 92000 },
      { month: "May", income: 104000, expenses: 104000 }, // both given — likely a copy-paste duplicate in the original spec
      { month: "Jun", income: 98000, expenses: 95000 },
      { month: "Jul", income: 140000, expenses: 98000 },
      { month: "Aug", income: 175000, expenses: 100000 },
      { month: "Sep", income: 210000, expenses: 108000 },
      { month: "Oct", income: 245000, expenses: 115000 },
      { month: "Nov", income: 280000, expenses: 122000 },
      { month: "Dec", income: 320000, expenses: 130000 }, // given
    ],
    projectedFromMonth: "Sep", // first month rendered as dashed/projected

    scenarios: [
      {
        key: "optimistic",
        label: "Optimistic",
        dotColor: "bg-green-600",
        income: "₱385,000",
        profit: "₱220,000",
        profitColor: "text-green-700",
        assumption: "Good rains, full market prices, expanded acreage",
      },
      {
        key: "base",
        label: "Base Case",
        dotColor: "bg-amber-500",
        income: "₱310,000",
        profit: "₱168,000",
        profitColor: "text-amber-600",
        assumption: "Normal season, current operations maintained",
      },
      {
        key: "pessimistic",
        label: "Pessimistic",
        dotColor: "bg-red-600",
        income: "₱220,000",
        profit: "₱72,000",
        profitColor: "text-red-600",
        assumption: "Drought risk, market price drop, pest pressure",
      },
    ],

    assumptions: [
      { label: "Corn yield per acre", value: "2.4 MT", source: "5-season average" },
      { label: "Tomato price/kg", value: "₱45", source: "Market Trend" },
      { label: "Input cost inflation", value: "+6%", source: "Supplier quotes" },
      { label: "Labor wage increase", value: "+8%", source: "Market Rate" },
    ],

    // Corrected from the original spec's "KES 1.95M" to ₱ for consistency
    // with every other figure in the app — see the note in chat.
    aiInsight:
      "Based on 18 months of your farm data, you are on track to earn ₱1.95M annually by December 2026. Expanding tomato production by 0.5 acres before the short rains could add ₱38,000 in incremental profit.",
  });
}
import { useState, useEffect } from "react";

// ---- Comparison bar chart data, per category ----
// Crop groups 1–3 match the Corn/Tomatoes/Beans cards below exactly; group 4
// (₱68k / ₱46k / ₱22k) has no matching named item in the spec, so it's
// labeled "Other" rather than guessing a crop name for it.
// Livestock groups match the sample livestock cards below.
const CHART_GROUPS = {
  crops: [
    { label: "Corn", revenue: 98000, costs: 61000, profit: 37000 },
    { label: "Tomatoes", revenue: 72000, costs: 38000, profit: 34000 },
    { label: "Beans", revenue: 45000, costs: 26000, profit: 19000 },
    { label: "Other", revenue: 68000, costs: 46000, profit: 22000 },
  ],
  livestock: [
    { label: "Broilers", revenue: 84000, costs: 52000, profit: 32000 },
    { label: "Hogs", revenue: 96000, costs: 71000, profit: 25000 },
    { label: "Goats", revenue: 38000, costs: 22000, profit: 16000 },
  ],
};
const CHART_MAX = 100000;
const Y_AXIS_LABELS = ["₱100k", "₱75k", "₱50k", "₱25k", "₱0"];

// ---- Item breakdown cards ----
const CROP_ITEMS = [
  {
    name: "Corn",
    season: "Long Rains 2026 · Yield: 2.4 MT",
    netProfit: "+ ₱37,000",
    revenue: "₱98,000",
    costs: "₱61,000",
    margin: "38%",
    profitNote: "₱10,571 profit/acre",
  },
  {
    name: "Tomatoes",
    season: "Long Rains 2026 · Yield: 1.8 MT",
    netProfit: "+ ₱34,000",
    revenue: "₱72,000",
    costs: "₱38,000",
    margin: "47%",
    profitNote: "₱22,667 profit/acre",
  },
  {
    name: "Beans",
    season: "Long Rains 2026 · Yield: 0.9 MT",
    netProfit: "+ ₱19,000",
    revenue: "₱45,000",
    costs: "₱26,000",
    margin: "42%",
    profitNote: "₱9,500 profit/acre",
  },
];

// SAMPLE figures — livestock data was never specified, so these are
// placeholder numbers (revenue − costs = net profit, margin = profit ÷
// revenue, all internally consistent). Replace with real data when ready.
const LIVESTOCK_ITEMS = [
  {
    name: "Broiler Chickens",
    season: "Batch 3, 2026 · 500 heads",
    netProfit: "+ ₱32,000",
    revenue: "₱84,000",
    costs: "₱52,000",
    margin: "38%",
    profitNote: "₱64 profit/head",
  },
  {
    name: "Hogs",
    season: "Fattening cycle 2026 · 12 heads",
    netProfit: "+ ₱25,000",
    revenue: "₱96,000",
    costs: "₱71,000",
    margin: "26%",
    profitNote: "₱2,083 profit/head",
  },
  {
    name: "Goats",
    season: "Breeding stock 2026 · 10 heads",
    netProfit: "+ ₱16,000",
    revenue: "₱38,000",
    costs: "₱22,000",
    margin: "42%",
    profitNote: "₱1,600 profit/head",
  },
];

function ComparisonChart({ groups }) {
  // Bars grow from 0 whenever `groups` changes — not just on first mount —
  // since switching the Crops/Livestock tab re-renders this same component
  // with new data rather than unmounting it. Re-running the grow-in on
  // every data change reinforces that the numbers actually switched.
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    setGrown(false);
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setGrown(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [groups]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-gray-900">
          Revenue vs Cost vs Profit Comparison
        </h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4f7331]" /> Revenue
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b83838]" /> Costs
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e5b352]" /> Profit
          </span>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {Y_AXIS_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="flex-1 flex items-end h-48 border-l border-gray-200 pl-6">
          {groups.map((g, i) => (
            <div key={g.label} className="flex flex-col items-center flex-1 px-1.5">
              <div className="w-full flex items-end justify-center gap-1 h-40">
                <div
                  className="w-1/3 rounded-t-sm bg-[#4f7331] transition-[height] duration-700 ease-out"
                  style={{
                    height: `${grown ? (g.revenue / CHART_MAX) * 100 : 0}%`,
                    transitionDelay: `${i * 80}ms`,
                  }}
                  title={`Revenue: ₱${g.revenue.toLocaleString()}`}
                />
                <div
                  className="w-1/3 rounded-t-sm bg-[#b83838] transition-[height] duration-700 ease-out"
                  style={{
                    height: `${grown ? (g.costs / CHART_MAX) * 100 : 0}%`,
                    transitionDelay: `${i * 80 + 60}ms`,
                  }}
                  title={`Costs: ₱${g.costs.toLocaleString()}`}
                />
                <div
                  className="w-1/3 rounded-t-sm bg-[#e5b352] transition-[height] duration-700 ease-out"
                  style={{
                    height: `${grown ? (g.profit / CHART_MAX) * 100 : 0}%`,
                    transitionDelay: `${i * 80 + 120}ms`,
                  }}
                  title={`Profit: ₱${g.profit.toLocaleString()}`}
                />
              </div>
              <span className="mt-2 text-xs text-gray-500">{g.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-gray-900">{item.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{item.season}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-green-700">{item.netProfit}</p>
          <p className="text-[11px] text-green-600">Net Profit</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[11px] text-gray-400">Revenue</p>
          <p className="text-sm font-bold text-green-700">{item.revenue}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">Costs</p>
          <p className="text-sm font-bold text-red-700">{item.costs}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">Margin</p>
          <p className="text-sm font-bold text-amber-700">{item.margin}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">{item.profitNote}</p>
    </div>
  );
}

export default function CropLivestock() {
  const [category, setCategory] = useState("crops");
  const items = category === "crops" ? CROP_ITEMS : LIVESTOCK_ITEMS;

  return (
    <div>
      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-900">
        Crop & Livestock Profitability
      </h2>
      <p className="mt-1 text-gray-500">
        Track costs, revenue, and profit per operation
      </p>

      {/* Comparison bar chart — follows the selected category */}
      <div className="mt-6">
        <ComparisonChart groups={CHART_GROUPS[category]} />
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setCategory("crops")}
          className={`rounded-full px-6 py-1.5 text-xs transition-colors ${
            category === "crops"
              ? "bg-[#7ca357] text-white font-semibold"
              : "bg-[#608044] text-white"
          }`}
        >
          Crops
        </button>
        <button
          onClick={() => setCategory("livestock")}
          className={`rounded-full px-6 py-1.5 text-xs transition-colors ${
            category === "livestock"
              ? "bg-[#7ca357] text-white font-semibold"
              : "bg-[#608044] text-white"
          }`}
        >
          Livestock
        </button>
      </div>

      {/* Item breakdown cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((item) => (
          <ItemCard key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
}
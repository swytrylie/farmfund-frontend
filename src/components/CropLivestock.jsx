import { useState } from "react";

// ---- Comparison bar chart data ----
// Groups 1–3 match the Corn/Tomatoes/Beans cards below exactly; group 4
// (₱68k / ₱46k / ₱22k) has no matching named item in the spec, so it's
// labeled "Other" rather than guessing a crop name for it.
const CHART_GROUPS = [
  { label: "Corn", revenue: 98000, costs: 61000, profit: 37000 },
  { label: "Tomatoes", revenue: 72000, costs: 38000, profit: 34000 },
  { label: "Beans", revenue: 45000, costs: 26000, profit: 19000 },
  { label: "Other", revenue: 68000, costs: 46000, profit: 22000 },
];
const CHART_MAX = 100000;
const Y_AXIS_LABELS = ["₱100k", "₱75k", "₱50k", "₱25k", "₱0"];

// ---- Item breakdown cards (Crops only — no Livestock data was specified) ----
const CROP_ITEMS = [
  {
    name: "Corn",
    season: "Long Rains 2026 · Yield: 2.4 MT",
    netProfit: "+ ₱37,000",
    revenue: "₱98,000",
    costs: "₱61,000",
    margin: "38%",
    profitPerAcre: "₱10,571 profit/acre",
  },
  {
    name: "Tomatoes",
    season: "Long Rains 2026 · Yield: 1.8 MT",
    netProfit: "+ ₱34,000",
    revenue: "₱72,000",
    costs: "₱38,000",
    margin: "47%",
    profitPerAcre: "₱22,667 profit/acre",
  },
  {
    name: "Beans",
    season: "Long Rains 2026 · Yield: 0.9 MT",
    netProfit: "+ ₱19,000",
    revenue: "₱45,000",
    costs: "₱26,000",
    margin: "42%",
    profitPerAcre: "₱9,500 profit/acre",
  },
];

function ComparisonChart() {
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
          {CHART_GROUPS.map((g) => (
            <div key={g.label} className="flex flex-col items-center flex-1 px-1.5">
              <div className="w-full flex items-end justify-center gap-1 h-40">
                <div
                  className="w-1/3 rounded-t-sm bg-[#4f7331]"
                  style={{ height: `${(g.revenue / CHART_MAX) * 100}%` }}
                  title={`Revenue: ₱${g.revenue.toLocaleString()}`}
                />
                <div
                  className="w-1/3 rounded-t-sm bg-[#b83838]"
                  style={{ height: `${(g.costs / CHART_MAX) * 100}%` }}
                  title={`Costs: ₱${g.costs.toLocaleString()}`}
                />
                <div
                  className="w-1/3 rounded-t-sm bg-[#e5b352]"
                  style={{ height: `${(g.profit / CHART_MAX) * 100}%` }}
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

      <p className="mt-4 text-xs text-gray-500">{item.profitPerAcre}</p>
    </div>
  );
}

export default function CropLivestock() {
  const [category, setCategory] = useState("crops");

  return (
    <div>
      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-900">
        Crop & Livestock Profitability
      </h2>
      <p className="mt-1 text-gray-500">
        Track costs, revenue, and profit per operation
      </p>

      {/* Comparison bar chart */}
      <div className="mt-6">
        <ComparisonChart />
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
      {category === "crops" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {CROP_ITEMS.map((item) => (
            <ItemCard key={item.name} item={item} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
          <p className="text-gray-400 text-sm">
            Livestock profitability data isn't available yet — coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
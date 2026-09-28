import { useState } from "react";

const PRIMARY_TABS = [
  { key: "season", label: "Season-on-Season" },
  { key: "yoy", label: "Year-on-Year (Monthly)" },
  { key: "crop", label: "Crop Revenue Trends" },
];

const METRIC_TABS = [
  { key: "income", label: "Income" },
  { key: "expenses", label: "Expenses" },
  { key: "profit", label: "Profit" },
];

// ---- Season-on-Season bar chart data (unchanged from before) ----
const CHART_CONFIG = {
  income: {
    title: "Income by Season",
    cardBg: "bg-[#f4fbe9]",
    cardBorder: "border-[#a3e635]/40",
    barColor: "bg-[#4d7328]",
    bars: [
      { label: "2026", value: 45000 },
      { label: "2025", value: 8000 },
      { label: "2026", value: 9000 },
    ],
  },
  expenses: {
    title: "Expenses by Season",
    cardBg: "bg-[#fde8e8]",
    cardBorder: "border-red-200",
    barColor: "bg-[#7a2828]",
    bars: [
      { label: "2026", value: 12000 },
      { label: "2026", value: 18000 },
      { label: "2026", value: 5000 },
      { label: "2025", value: 14000 },
      { label: "2025", value: 14000 },
    ],
  },
  profit: {
    title: "Profit by Season",
    cardBg: "bg-[#fffbeb]",
    cardBorder: "border-amber-200/80",
    barColor: "bg-[#c28e46]",
    bars: [
      { label: "2026", value: 42000 },
      { label: "2026", value: 8000 },
      { label: "2026", value: 4000 },
      { label: "2025", value: 7000 },
      { label: "2025", value: 7000 },
    ],
  },
};
const CHART_MAX = 50000;
const Y_AXIS_LABELS = ["₱50k", "₱40k", "₱30k", "₱20k", "₱10k"];

const TABLE_ROWS = [
  {
    season: "Wet Season 2026",
    income: "+₱45,000.00",
    expense: "-₱2,800.00",
    profit: "₱42,000",
    profitNegative: false,
    margin: "93.78%",
  },
  {
    season: "Dry Season 2025",
    income: "+₱8,200.00",
    expense: "-₱4,200.00",
    profit: "₱4,000",
    profitNegative: false,
    margin: "48.78%",
  },
  {
    season: "Wet Season 2026",
    income: "+₱5,000.00",
    expense: "-₱1,200.00",
    profit: "₱3,800",
    profitNegative: false,
    margin: "76.00%",
  },
  {
    season: "Dry Season 2025",
    income: "-",
    expense: "-₱2,280.00",
    profit: "-₱2,280",
    profitNegative: true,
    margin: "N/A",
  },
  {
    season: "Wet Season 2025",
    income: "-",
    expense: "-₱2,110.00",
    profit: "-₱2,110",
    profitNegative: true,
    margin: "N/A",
  },
];

// ---- Year-on-Year monthly line chart data ----
// 2025 figures aren't specified in the spec beyond "last year's curve", so
// they're derived to land on the stated +21.4% average YoY growth figure.
const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const INCOME_2026 = [23000, 38000, 42000, 37000, 36000, 50000];
const INCOME_2025 = [19000, 31000, 35000, 30000, 29000, 42000];
const YOY_CHART_MAX = 60000;
const Y_AXIS_YOY = ["₱60k", "₱50k", "₱40k", "₱30k", "₱20k", "₱10k", "₱0"];

// Converts a set of points into a smooth SVG path using a Catmull-Rom-to-
// Bezier spline, instead of straight polyline segments between data points.
function smoothPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 === points.length ? i + 1 : i + 2];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

const CHART_W = 600;
const CHART_H = 200;

function toPoints(values) {
  return values.map((v, i) => ({
    x: (i / (values.length - 1)) * CHART_W,
    y: CHART_H - (v / YOY_CHART_MAX) * CHART_H,
  }));
}

// ---- Crop & Livestock Revenue Trends data ----
// The spec's season labels came through garbled/duplicated in transcription
// (e.g. "W6 2025" repeated out of order), so this uses a clean chronological
// reconstruction instead of copying that text literally.
const CROP_SEASONS = ["WS 2024", "DS 2024", "WS 2025", "DS 2025", "WS 2026", "DS 2026"];
const CROP_CHART_MAX = 600000;
const Y_AXIS_CROP = ["₱600k", "₱450k", "₱300k", "₱150k", "₱0"];

const CROP_SERIES = [
  {
    key: "corn",
    label: "Corn",
    color: "#b8863b",
    values: [150000, 200000, 280000, 340000, 400000, 390000],
  },
  {
    key: "beans",
    label: "Beans",
    color: "#7f9450",
    values: [190000, 210000, 195000, 205000, 200000, 210000],
  },
  {
    key: "tomatoes",
    label: "Tomatoes",
    color: "#dc2626",
    values: [120000, 90000, 250000, 150000, 180000, 250000],
  },
  {
    key: "dairy",
    label: "Dairy",
    color: "#2f6b2f",
    values: [60000, 70000, 55000, 90000, 75000, 85000],
  },
];

function CropRevenueChart() {
  const toChartPoints = (values) =>
    values.map((v, i) => ({
      x: (i / (values.length - 1)) * CHART_W,
      y: CHART_H - (v / CROP_CHART_MAX) * CHART_H,
    }));

  return (
    <div className="mt-6 bg-[#f4fbe9] border border-[#a3e635]/40 rounded-2xl p-6 shadow-sm mb-6">
      <h3 className="font-bold text-gray-900">
        Crop & Livestock Revenue Trends
      </h3>

      <div className="mt-6 flex gap-3">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {Y_AXIS_CROP.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        {/* Multi-series line chart */}
        <div className="flex-1 border-l border-gray-200 pl-4">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-48"
            preserveAspectRatio="none"
          >
            {CROP_SERIES.map((series) => {
              const points = toChartPoints(series.values);
              const path = smoothPath(points);
              return (
                <g key={series.key}>
                  <path
                    d={path}
                    fill="none"
                    stroke={series.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="3.5"
                      fill={series.color}
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          {/* X-axis season labels */}
          <div className="flex justify-between mt-2 px-1">
            {CROP_SEASONS.map((s) => (
              <span key={s} className="text-[11px] text-gray-500">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center flex-wrap gap-x-6 gap-y-2">
        {CROP_SERIES.map((series) => (
          <span
            key={series.key}
            className="flex items-center gap-1.5 text-xs text-gray-600"
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function MonthlyYoYChart() {
  const points2026 = toPoints(INCOME_2026);
  const points2025 = toPoints(INCOME_2025);
  const path2026 = smoothPath(points2026);
  const path2025 = smoothPath(points2025);

  return (
    <div className="mt-6 bg-[#f4fbe9] border border-[#a3e635]/40 rounded-2xl p-6 shadow-sm mb-6">
      <h3 className="font-bold text-gray-900">
        Monthly Income: 2026 vs 2025
      </h3>
      <p className="text-xs text-gray-500 mt-0.5">Mar - Aug comparison</p>

      <div className="mt-6 flex gap-3">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {Y_AXIS_YOY.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        {/* Line chart */}
        <div className="flex-1 border-l border-gray-200 pl-4">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-48"
            preserveAspectRatio="none"
          >
            {/* Thin decorative baseline glow underneath the main 2026 line */}
            <path
              d={path2026}
              fill="none"
              stroke="#2d4027"
              strokeOpacity="0.15"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* 2025 dashed comparison line */}
            <path
              d={path2025}
              fill="none"
              stroke="#4b5563"
              strokeWidth="2"
              strokeDasharray="6 5"
              strokeLinecap="round"
            />

            {/* 2026 solid line, on top */}
            <path
              d={path2026}
              fill="none"
              stroke="#2d4027"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* 2026 data point markers */}
            {points2026.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2d4027" />
            ))}
          </svg>

          {/* X-axis month labels */}
          <div className="flex justify-between mt-2 px-1">
            {MONTHS.map((m) => (
              <span key={m} className="text-xs text-gray-500">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-6">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-0.5 bg-[#2d4027] inline-block rounded" />
          2026
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="w-3 h-0.5 bg-gray-500 inline-block rounded"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #6b7280 0, #6b7280 3px, transparent 3px, transparent 6px)",
            }}
          />
          2025
        </span>
      </div>

      {/* Summary callout banner */}
      <div className="mt-4 bg-[#e2f7e2] border border-emerald-300 rounded-xl p-3 text-center">
        <p className="text-emerald-800 font-medium text-sm">
          Average YoY Growth: +21.4% — Positive growth compared to last year
        </p>
      </div>
    </div>
  );
}

export default function TrendsComparisons() {
  const [primaryTab, setPrimaryTab] = useState("season");
  const [metricTab, setMetricTab] = useState("income");
  const activeChart = CHART_CONFIG[metricTab];

  return (
    <div>
      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-900">
        Financial Trends & Comparisons
      </h2>
      <p className="mt-1 text-gray-500">
        Compare performance across seasons and periods
      </p>

      {/* Primary view mode pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        {PRIMARY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPrimaryTab(tab.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors ${
              primaryTab === tab.key ? "bg-[#7ca357]" : "bg-[#608044]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Secondary metric pills — only shown for the Season-on-Season view */}
      {primaryTab === "season" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {METRIC_TABS.map((tab) => {
            const isActive = metricTab === tab.key;
            let pillClass = "bg-[#dcfce7] text-emerald-800 font-semibold";
            if (isActive && tab.key === "expenses") {
              pillClass =
                "bg-[#fce8e8] text-red-600 border border-red-300 font-semibold";
            } else if (isActive && tab.key === "profit") {
              pillClass =
                "bg-[#fff7ed] text-amber-700 border border-amber-300 font-semibold";
            }
            return (
              <button
                key={tab.key}
                onClick={() => setMetricTab(tab.key)}
                className={`rounded-full px-4 py-1 text-xs transition-colors ${pillClass}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Season-on-Season: bar chart + breakdown table */}
      {primaryTab === "season" && (
        <>
          <div
            className={`mt-6 border rounded-2xl p-6 shadow-sm mb-6 transition-colors ${activeChart.cardBg} ${activeChart.cardBorder}`}
          >
            <h3 className="font-bold text-gray-900">{activeChart.title}</h3>

            <div className="mt-6 flex gap-3">
              <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
                {Y_AXIS_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="flex-1 flex items-end h-48 border-l border-gray-200 pl-6">
                {activeChart.bars.map((bar, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center flex-1 px-2"
                  >
                    <div className="w-full flex items-end h-40">
                      <div
                        className={`w-full rounded-t transition-colors ${activeChart.barColor}`}
                        style={{
                          height: `${(bar.value / CHART_MAX) * 100}%`,
                        }}
                        title={`₱${bar.value.toLocaleString()}`}
                      />
                    </div>
                    <span className="mt-2 text-xs text-gray-500">
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Season</th>
                  <th className="pb-2 font-semibold">Income</th>
                  <th className="pb-2 font-semibold">Expense</th>
                  <th className="pb-2 font-semibold">Profit</th>
                  <th className="pb-2 font-semibold">Margin</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="py-3 text-gray-900 font-medium">
                      {row.season}
                    </td>
                    <td
                      className={`py-3 font-semibold ${
                        row.income === "-"
                          ? "text-gray-400"
                          : "text-green-600"
                      }`}
                    >
                      {row.income}
                    </td>
                    <td className="py-3 font-semibold text-red-500">
                      {row.expense}
                    </td>
                    <td
                      className={`py-3 font-semibold ${
                        row.profitNegative ? "text-red-500" : "text-amber-700"
                      }`}
                    >
                      {row.profit}
                    </td>
                    <td className="py-3 font-semibold text-green-600">
                      {row.margin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Year-on-Year: line chart + callout, no secondary pills, no table */}
      {primaryTab === "yoy" && <MonthlyYoYChart />}

      {/* Crop Revenue Trends: multi-series line chart, no secondary pills, no table */}
      {primaryTab === "crop" && <CropRevenueChart />}
    </div>
  );
}
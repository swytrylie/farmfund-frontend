import { useState, useEffect } from "react";
import { authedRequest } from "../../api";

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const PRIMARY_TABS = [
  { key: "season", label: "Season-on-Season" },
  { key: "yoy", label: "Year-on-Year (Monthly)" },
  // "Crop Revenue Trends" isn't included — same reason as elsewhere in this
  // app: there's no link between FinancialRecord and FarmingCycle, so
  // there's no honest way to know how much revenue came from which
  // specific crop.
];

const METRIC_TABS = [
  { key: "income", label: "Income" },
  { key: "expenses", label: "Expenses" },
  { key: "profit", label: "Profit" },
];

const METRIC_STYLE = {
  income: { cardBg: "bg-[#f4fbe9]", cardBorder: "border-[#a3e635]/40", barColor: "bg-[#4d7328]" },
  expenses: { cardBg: "bg-[#fde8e8]", cardBorder: "border-red-200", barColor: "bg-[#7a2828]" },
  profit: { cardBg: "bg-[#fffbeb]", cardBorder: "border-amber-200/80", barColor: "bg-[#c28e46]" },
};

// Philippine agricultural convention: wet season June-November, dry season
// December-May (spanning into the next calendar year). Computed from real
// transaction dates, not invented.
function seasonLabelFor(date) {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();
  if (month >= 5 && month <= 10) return `Wet Season ${year}`;
  // Dec-May dry season: Dec belongs to the dry season that continues into
  // next year; Jan-May belongs to the dry season that started last Dec.
  return month === 11 ? `Dry Season ${year + 1}` : `Dry Season ${year}`;
}

function buildSeasons(records) {
  const buckets = {};
  for (const r of records) {
    const label = seasonLabelFor(new Date(r.date));
    if (!buckets[label]) buckets[label] = { season: label, income: 0, expense: 0 };
    if (r.type === "income") buckets[label].income += r.amount;
    else buckets[label].expense += r.amount;
  }
  // Sort seasons chronologically (by the year + wet/dry ordering embedded in the label)
  return Object.values(buckets).sort((a, b) => {
    const yearA = parseInt(a.season.match(/\d+/)[0], 10);
    const yearB = parseInt(b.season.match(/\d+/)[0], 10);
    if (yearA !== yearB) return yearA - yearB;
    return a.season.startsWith("Dry") ? -1 : 1;
  });
}

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

function SeasonChart({ metricTab, seasons }) {
  const style = METRIC_STYLE[metricTab];
  const bars = seasons.map((s) => ({
    label: s.season,
    value: metricTab === "income" ? s.income : metricTab === "expenses" ? s.expense : s.income - s.expense,
  }));
  const maxValue = Math.max(10000, ...bars.map((b) => Math.abs(b.value)));
  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => `₱${Math.round((maxValue * (1 - f)) / 1000)}k`);

  const [grown, setGrown] = useState(false);
  useEffect(() => {
    setGrown(false);
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setGrown(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [metricTab, seasons]);

  return (
    <div className={`mt-6 border rounded-2xl p-6 shadow-sm mb-6 transition-colors ${style.cardBg} ${style.cardBorder}`}>
      <h3 className="font-bold text-gray-900">
        {metricTab === "income" ? "Income" : metricTab === "expenses" ? "Expenses" : "Profit"} by Season
      </h3>

      {bars.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400 text-center py-10">No transactions recorded yet.</p>
      ) : (
        <div className="mt-6 flex gap-3">
          <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
            {yAxisLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>

          <div className="flex-1 flex items-end h-48 border-l border-gray-200 pl-6">
            {bars.map((bar, i) => (
              <div key={bar.label} className="flex flex-col items-center flex-1 px-2">
                <div className="w-full flex items-end h-40">
                  <div
                    className={`w-full rounded-t transition-all duration-700 ease-out ${style.barColor}`}
                    style={{
                      height: `${grown ? (Math.abs(bar.value) / maxValue) * 100 : 0}%`,
                      transitionDelay: `${i * 70}ms`,
                    }}
                    title={peso(bar.value)}
                  />
                </div>
                <span className="mt-2 text-[11px] text-gray-500 text-center">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SeasonTable({ seasons }) {
  return (
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
          {seasons.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-400">No seasons with recorded data yet.</td>
            </tr>
          ) : (
            seasons.map((s) => {
              const profit = s.income - s.expense;
              const margin = s.income > 0 ? `${((profit / s.income) * 100).toFixed(2)}%` : "N/A";
              return (
                <tr key={s.season} className="border-t border-gray-50">
                  <td className="py-3 text-gray-900 font-medium">{s.season}</td>
                  <td className={`py-3 font-semibold ${s.income > 0 ? "text-green-600" : "text-gray-400"}`}>
                    {s.income > 0 ? `+${peso(s.income)}` : "-"}
                  </td>
                  <td className="py-3 font-semibold text-red-500">{s.expense > 0 ? `-${peso(s.expense)}` : "-"}</td>
                  <td className={`py-3 font-semibold ${profit < 0 ? "text-red-500" : "text-amber-700"}`}>{peso(profit)}</td>
                  <td className="py-3 font-semibold text-green-600">{margin}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// Compares real income over this year's last 6 months against the SAME
// 6 calendar months one year earlier — needs real data from both years to
// be meaningful. For a brand-new account, last year's line will honestly
// show ₱0 across the board, since there's genuinely nothing there yet.
function MonthlyYoYChart({ records }) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-US", { month: "short" }) });
  }

  function incomeFor(year, month) {
    return records
      .filter((r) => r.type === "income" && new Date(r.date).getFullYear() === year && new Date(r.date).getMonth() === month)
      .reduce((s, r) => s + r.amount, 0);
  }

  const thisYearValues = months.map((m) => incomeFor(m.year, m.month));
  const lastYearValues = months.map((m) => incomeFor(m.year - 1, m.month));

  const maxValue = Math.max(10000, ...thisYearValues, ...lastYearValues);
  const toPoints = (values) => values.map((v, i) => ({ x: (i / (values.length - 1)) * CHART_W, y: CHART_H - (v / maxValue) * CHART_H }));
  const pointsThisYear = toPoints(thisYearValues);
  const pointsLastYear = toPoints(lastYearValues);
  const pathThisYear = smoothPath(pointsThisYear);
  const pathLastYear = smoothPath(pointsLastYear);

  const totalThisYear = thisYearValues.reduce((s, v) => s + v, 0);
  const totalLastYear = lastYearValues.reduce((s, v) => s + v, 0);
  const growthPercent = totalLastYear > 0 ? Math.round(((totalThisYear - totalLastYear) / totalLastYear) * 100) : null;

  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => `₱${Math.round((maxValue * (1 - f)) / 1000)}k`);

  return (
    <div className="mt-6 bg-[#f4fbe9] border border-[#a3e635]/40 rounded-2xl p-6 shadow-sm mb-6">
      <h3 className="font-bold text-gray-900">
        Monthly Income: {now.getFullYear()} vs {now.getFullYear() - 1}
      </h3>
      <p className="text-xs text-gray-500 mt-0.5">Last 6 months</p>

      <div className="mt-6 flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {yAxisLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>

        <div className="flex-1 border-l border-gray-200 pl-4">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-48" preserveAspectRatio="none">
            <path d={pathThisYear} fill="none" stroke="#2d4027" strokeOpacity="0.15" strokeWidth="6" strokeLinecap="round" />
            <path d={pathLastYear} fill="none" stroke="#4b5563" strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" />
            <path d={pathThisYear} fill="none" stroke="#2d4027" strokeWidth="2.5" strokeLinecap="round" />
            {pointsThisYear.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2d4027" />
            ))}
          </svg>

          <div className="flex justify-between mt-2 px-1">
            {months.map((m, i) => (
              <span key={i} className="text-xs text-gray-500">{m.label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-6">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-0.5 bg-[#2d4027] inline-block rounded" />
          {now.getFullYear()}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="w-3 h-0.5 bg-gray-500 inline-block rounded"
            style={{ backgroundImage: "repeating-linear-gradient(to right, #6b7280 0, #6b7280 3px, transparent 3px, transparent 6px)" }}
          />
          {now.getFullYear() - 1}
        </span>
      </div>

      <div className={`mt-4 border rounded-xl p-3 text-center ${growthPercent === null ? "bg-gray-50 border-gray-200" : growthPercent >= 0 ? "bg-[#e2f7e2] border-emerald-300" : "bg-red-50 border-red-200"}`}>
        <p className={`font-medium text-sm ${growthPercent === null ? "text-gray-500" : growthPercent >= 0 ? "text-emerald-800" : "text-red-700"}`}>
          {growthPercent === null
            ? "No data from last year yet to compare against."
            : `YoY Growth: ${growthPercent >= 0 ? "+" : ""}${growthPercent}% ${growthPercent >= 0 ? "— Positive growth compared to last year" : "— Down compared to last year"}`}
        </p>
      </div>
    </div>
  );
}

function FarmSetupPrompt() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center max-w-md mx-auto">
      <h3 className="font-bold text-gray-900 text-lg">No farm set up yet</h3>
      <p className="mt-2 text-sm text-gray-500">
        Trends are built from your real transactions, which need a farm first. Set one up from Income & Expenses to get started.
      </p>
    </div>
  );
}

export default function TrendsComparisons() {
  const [primaryTab, setPrimaryTab] = useState("season");
  const [metricTab, setMetricTab] = useState("income");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hasFarm, setHasFarm] = useState(true);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const farms = await authedRequest("/api/farms");
        if (cancelled) return;
        if (farms.length === 0) {
          setHasFarm(false);
          setLoading(false);
          return;
        }
        // Fetches the last 2 years, so Year-on-Year has real history from
        // both sides to compare, not just the current year.
        const now = new Date();
        const twoYearsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        const data = await authedRequest(
          `/api/financial-records?farm=${farms[0]._id}&startDate=${twoYearsAgo.toISOString()}&endDate=${now.toISOString()}&limit=100`
        );
        if (cancelled) return;
        setRecords(data);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load your data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Trends & Comparisons</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Trends & Comparisons</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  if (!hasFarm) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Trends & Comparisons</h2>
        <FarmSetupPrompt />
      </div>
    );
  }

  const seasons = buildSeasons(records);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Financial Trends & Comparisons</h2>
      <p className="mt-1 text-gray-500">Compare performance across seasons and periods</p>

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

      {primaryTab === "season" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {METRIC_TABS.map((tab) => {
            const isActive = metricTab === tab.key;
            let pillClass = "bg-[#dcfce7] text-emerald-800 font-semibold";
            if (isActive && tab.key === "expenses") pillClass = "bg-[#fce8e8] text-red-600 border border-red-300 font-semibold";
            else if (isActive && tab.key === "profit") pillClass = "bg-[#fff7ed] text-amber-700 border border-amber-300 font-semibold";
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

      {primaryTab === "season" && (
        <>
          <SeasonChart metricTab={metricTab} seasons={seasons} />
          <SeasonTable seasons={seasons} />
        </>
      )}

      {primaryTab === "yoy" && <MonthlyYoYChart records={records} />}
    </div>
  );
}
import { useState, useEffect } from "react";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { authedRequest } from "../../api";

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const CHART_W = 760;
const CHART_H = 200;

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

function ForecastChart({ pastMonths, projectedMonths, maxValue }) {
  const allMonths = [...pastMonths, ...projectedMonths];
  const toPoints = (values) => values.map((v, i) => ({ x: (i / (allMonths.length - 1)) * CHART_W, y: CHART_H - (v / maxValue) * CHART_H }));

  const incomeValues = [...pastMonths.map((m) => m.income), ...projectedMonths.map((m) => m.income)];
  const expenseValues = [...pastMonths.map((m) => m.expenses), ...projectedMonths.map((m) => m.expenses)];
  const incomePoints = toPoints(incomeValues);
  const expensePoints = toPoints(expenseValues);

  const splitIndex = pastMonths.length - 1;
  const solidIncome = smoothPath(incomePoints.slice(0, splitIndex + 1));
  const dashedIncome = smoothPath(incomePoints.slice(splitIndex));
  const solidExpenses = smoothPath(expensePoints.slice(0, splitIndex + 1));
  const dashedExpenses = smoothPath(expensePoints.slice(splitIndex));

  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => `₱${Math.round((maxValue * (1 - f)) / 1000)}k`);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
      <h3 className="font-bold text-gray-900">6-Month Outlook — Income &amp; Expenses</h3>
      <p className="text-xs text-gray-500 mt-0.5">
        Dashed section is a simple projection — your last 3 real months' average, carried forward. Not AI, just an average.
      </p>

      <div className="mt-8 flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {yAxisLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>

        <div className="flex-1 border-l border-gray-200 pl-4">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-48" preserveAspectRatio="none">
            <path d={solidIncome} fill="none" stroke="#4f7331" strokeWidth="2.5" />
            <path d={dashedIncome} fill="none" stroke="#4f7331" strokeWidth="2.5" strokeDasharray="6 5" />
            <path d={solidExpenses} fill="none" stroke="#b83838" strokeWidth="2.5" />
            <path d={dashedExpenses} fill="none" stroke="#b83838" strokeWidth="2.5" strokeDasharray="6 5" />
          </svg>

          <div className="flex justify-between mt-2 px-1">
            {allMonths.map((m, i) => (
              <span key={i} className={`text-[10px] ${i > splitIndex ? "text-gray-400" : "text-gray-500"}`}>
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-0.5 bg-[#4f7331] inline-block rounded" />
          Income
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-0.5 bg-[#b83838] inline-block rounded" />
          Expenses
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-3 h-0.5 bg-gray-400 inline-block rounded" style={{ backgroundImage: "repeating-linear-gradient(to right, #9ca3af 0, #9ca3af 3px, transparent 3px, transparent 6px)" }} />
          Projected
        </span>
      </div>
    </div>
  );
}

function ScenarioCard({ label, dotColor, income, profit, profitColor, assumption }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        <span className="font-bold text-gray-900 text-sm">{label}</span>
      </div>
      <p className="mt-3 text-xs text-gray-400">Projected Monthly Income</p>
      <p className="text-sm font-bold text-gray-900">{peso(income)}</p>
      <p className="mt-3 text-xs text-gray-400">Projected Monthly Profit</p>
      <p className={`text-2xl font-bold ${profitColor}`}>{peso(profit)}</p>
      <p className="mt-3 text-xs text-gray-500">{assumption}</p>
    </div>
  );
}

function ForecastAssumptions({ avgIncome, avgExpenses, monthsUsed }) {
  const rows = [
    { label: "Average Monthly Income", value: peso(avgIncome), source: `Your last ${monthsUsed} months` },
    { label: "Average Monthly Expenses", value: peso(avgExpenses), source: `Your last ${monthsUsed} months` },
  ];
  return (
    <div className="bg-[#f8f8f3] border border-gray-200 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex items-center gap-2">
        <Info size={18} className="text-amber-600" />
        <h3 className="font-bold text-gray-900">How this is calculated</h3>
      </div>
      <div className="mt-3 space-y-2.5">
        {rows.map((a) => (
          <div key={a.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{a.label}</span>
            <span className="text-right">
              <span className="font-bold text-gray-900">{a.value}</span>
              <span className="block text-[11px] text-gray-400">{a.source}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-gray-400">
        This is a simple average-based projection, not AI or machine learning — it assumes your recent pattern continues.
      </p>
    </div>
  );
}

// Compares the average of the most recent 3 months against the 3 months
// before that — a plain, honest trend observation computed directly from
// real numbers, not an AI-generated insight.
function TrendObservation({ records }) {
  const now = new Date();
  function sumIncomeInRange(monthsBack, monthsSpan) {
    const start = new Date(now.getFullYear(), now.getMonth() - monthsBack - monthsSpan + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0, 23, 59, 59);
    return records
      .filter((r) => r.type === "income" && new Date(r.date) >= start && new Date(r.date) <= end)
      .reduce((s, r) => s + r.amount, 0);
  }
  const recent3 = sumIncomeInRange(0, 3);
  const prior3 = sumIncomeInRange(3, 3);

  if (prior3 === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <Info size={20} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-500">Not enough history yet to compare recent trends.</p>
      </div>
    );
  }

  const changePercent = Math.round(((recent3 - prior3) / prior3) * 100);
  const Icon = changePercent > 5 ? TrendingUp : changePercent < -5 ? TrendingDown : Minus;
  const color = changePercent > 5 ? "text-green-700 bg-green-50 border-green-200" : changePercent < -5 ? "text-red-700 bg-red-50 border-red-200" : "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <div className={`border rounded-2xl p-4 flex items-start gap-3 shadow-sm ${color}`}>
      <Icon size={20} className="shrink-0 mt-0.5" />
      <div>
        <p className="font-bold">Income trend</p>
        <p className="text-sm mt-0.5">
          Your income over the last 3 months is {changePercent >= 0 ? "up" : "down"} {Math.abs(changePercent)}% compared to the 3 months before that.
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
        A forecast needs real transaction history. Set up your farm from Income & Expenses to get started.
      </p>
    </div>
  );
}

function NotEnoughDataPrompt() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center max-w-md mx-auto">
      <h3 className="font-bold text-gray-900 text-lg">Not enough history yet</h3>
      <p className="mt-2 text-sm text-gray-500">
        A projection needs at least one real month of transactions to work from. Log some income and expenses in Income & Expenses, then check back here.
      </p>
    </div>
  );
}

export default function Forecasting() {
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
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const data = await authedRequest(
          `/api/financial-records?farm=${farms[0]._id}&startDate=${sixMonthsAgo.toISOString()}&endDate=${now.toISOString()}&limit=100`
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
        <h2 className="text-3xl font-bold text-gray-900">Financial Forecasting</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Forecasting</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  if (!hasFarm) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Forecasting</h2>
        <FarmSetupPrompt />
      </div>
    );
  }

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-US", { month: "short" }) });
  }
  const pastMonths = months.map(({ year, month, label }) => {
    let income = 0, expenses = 0;
    for (const r of records) {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (r.type === "income") income += r.amount;
        else expenses += r.amount;
      }
    }
    return { label, income, expenses };
  });

  const monthsWithData = pastMonths.filter((m) => m.income > 0 || m.expenses > 0).length;
  if (monthsWithData === 0) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Forecasting</h2>
        <NotEnoughDataPrompt />
      </div>
    );
  }

  // Simple moving average of the last 3 real months (or fewer, if that's
  // all that exists) — carried forward as the projection. Plain
  // arithmetic, not AI.
  const recentMonths = pastMonths.slice(-3).filter((m) => m.income > 0 || m.expenses > 0);
  const divisor = Math.max(1, recentMonths.length);
  const avgIncome = recentMonths.reduce((s, m) => s + m.income, 0) / divisor;
  const avgExpenses = recentMonths.reduce((s, m) => s + m.expenses, 0) / divisor;

  const projectedMonths = [1, 2, 3].map((i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { label: d.toLocaleDateString("en-US", { month: "short" }), income: avgIncome, expenses: avgExpenses };
  });

  const maxValue = Math.max(10000, ...pastMonths.map((m) => Math.max(m.income, m.expenses)), avgIncome, avgExpenses);

  const scenarios = [
    { key: "optimistic", label: "Optimistic", dotColor: "bg-green-600", income: avgIncome * 1.15, profit: avgIncome * 1.15 - avgExpenses * 0.95, profitColor: "text-green-700", assumption: "15% above your recent average income" },
    { key: "base", label: "Base Case", dotColor: "bg-amber-500", income: avgIncome, profit: avgIncome - avgExpenses, profitColor: "text-amber-600", assumption: "Your recent average continues unchanged" },
    { key: "pessimistic", label: "Pessimistic", dotColor: "bg-red-600", income: avgIncome * 0.85, profit: avgIncome * 0.85 - avgExpenses * 1.05, profitColor: "text-red-600", assumption: "15% below your recent average income" },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Financial Forecasting</h2>
      <p className="mt-1 text-gray-500">A simple projection based on your own recent transaction history</p>

      <div className="mt-6">
        <ForecastChart pastMonths={pastMonths} projectedMonths={projectedMonths} maxValue={maxValue} />
      </div>

      <h3 className="font-bold text-gray-900 mb-3">Scenario Comparison</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {scenarios.map(({ key, ...s }) => (
          <ScenarioCard key={key} {...s} />
        ))}
      </div>

      <ForecastAssumptions avgIncome={avgIncome} avgExpenses={avgExpenses} monthsUsed={recentMonths.length} />

      <TrendObservation records={records} />
    </div>
  );
}
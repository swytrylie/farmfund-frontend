import { useState, useEffect } from "react";
import { Lightbulb, TrendingUp } from "lucide-react";
import { getForecastData } from "../../mocks/individual/forecasting.mock";

const CHART_MAX = 340000;
const Y_AXIS_LABELS = ["₱340k", "₱255k", "₱170k", "₱85k", "₱0"];
const CHART_W = 760;
const CHART_H = 200;

// Converts a set of points into a smooth SVG path using a Catmull-Rom-to-
// Bezier spline, same technique used on the Trends & Comparisons charts.
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

function toPoints(values) {
  return values.map((v, i) => ({
    x: (i / (values.length - 1)) * CHART_W,
    y: CHART_H - (v / CHART_MAX) * CHART_H,
  }));
}

function ForecastChart({ data, projectedFromMonth }) {
  const months = data.map((d) => d.month);
  const incomePoints = toPoints(data.map((d) => d.income));
  const expensePoints = toPoints(data.map((d) => d.expenses));

  // Last actual month = the one right before the first projected month
  const splitIndex = months.indexOf(projectedFromMonth) - 1;
  const mayIndex = months.indexOf("May");

  const solidIncome = smoothPath(incomePoints.slice(0, splitIndex + 1));
  const dashedIncome = smoothPath(incomePoints.slice(splitIndex));
  const solidExpenses = smoothPath(expensePoints.slice(0, splitIndex + 1));
  const dashedExpenses = smoothPath(expensePoints.slice(splitIndex));

  const mayX = incomePoints[mayIndex]?.x;
  const mayData = data[mayIndex];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
      <h3 className="font-bold text-gray-900">
        6-Month Forecast — Income &amp; Expenses
      </h3>
      <p className="text-xs text-gray-500 mt-0.5">
        Dashed area shows projected September–December 2026
      </p>

      <div className="mt-8 flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {Y_AXIS_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="flex-1 border-l border-gray-200 pl-4 relative">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-48"
            preserveAspectRatio="none"
          >
            {/* May vertical marker */}
            {mayX !== undefined && (
              <line
                x1={mayX}
                y1={0}
                x2={mayX}
                y2={CHART_H}
                stroke="#93c5fd"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Income line — solid (actual) then dashed (projected) */}
            <path d={solidIncome} fill="none" stroke="#4f7331" strokeWidth="2.5" />
            <path
              d={dashedIncome}
              fill="none"
              stroke="#4f7331"
              strokeWidth="2.5"
              strokeDasharray="6 5"
            />

            {/* Expenses line — solid (actual) then dashed (projected) */}
            <path d={solidExpenses} fill="none" stroke="#b83838" strokeWidth="2.5" />
            <path
              d={dashedExpenses}
              fill="none"
              stroke="#b83838"
              strokeWidth="2.5"
              strokeDasharray="6 5"
            />
          </svg>

          {/* May tooltip, positioned above the marker */}
          {mayX !== undefined && mayData && (
            <div
              className="absolute -top-4 -translate-y-full -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-md p-2.5 text-[11px] font-semibold space-y-1 whitespace-nowrap z-10"
              style={{ left: `${(mayX / CHART_W) * 100}%` }}
            >
              <span className="inline-block bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-[10px] font-bold">
                May
              </span>
              <p className="text-red-600">
                Expenses: ₱{mayData.expenses.toLocaleString()}
              </p>
              <p className="text-green-700">
                Income: ₱{mayData.income.toLocaleString()}
              </p>
            </div>
          )}

          {/* X-axis month labels */}
          <div className="flex justify-between mt-2 px-1">
            {months.map((m) => (
              <span key={m} className="text-[10px] text-gray-500">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-0.5 bg-[#4f7331] inline-block rounded" />
          Income
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-0.5 bg-[#b83838] inline-block rounded" />
          Expenses
        </span>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${scenario.dotColor}`} />
        <span className="font-bold text-gray-900 text-sm">
          {scenario.label}
        </span>
      </div>

      <p className="mt-3 text-xs text-gray-400">Projected Income</p>
      <p className="text-sm font-bold text-gray-900">{scenario.income}</p>

      <p className="mt-3 text-xs text-gray-400">Projected Profit</p>
      <p className={`text-2xl font-bold ${scenario.profitColor}`}>
        {scenario.profit}
      </p>

      <p className="mt-3 text-xs text-gray-500">{scenario.assumption}</p>
    </div>
  );
}

function ForecastAssumptions({ assumptions }) {
  return (
    <div className="bg-[#f8f8f3] border border-gray-200 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex items-center gap-2">
        <Lightbulb size={18} className="text-amber-600" />
        <h3 className="font-bold text-gray-900">Forecast Assumptions</h3>
      </div>

      <div className="mt-3 space-y-2.5">
        {assumptions.map((a) => (
          <div
            key={a.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-700">{a.label}</span>
            <span className="text-right">
              <span className="font-bold text-gray-900">{a.value}</span>
              <span className="block text-[11px] text-gray-400">
                {a.source}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Forecasting() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getForecastData().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Financial Forecasting
        </h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading forecast…
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">
        Financial Forecasting
      </h2>
      <p className="mt-1 text-gray-500">
        AI-powered projections based on your farm history
      </p>

      <div className="mt-6">
        <ForecastChart
          data={data.chart}
          projectedFromMonth={data.projectedFromMonth}
        />
      </div>

      <h3 className="font-bold text-gray-900 mb-3">
        Scenario Analysis - Dec 2026
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {data.scenarios.map((s) => (
          <ScenarioCard key={s.key} scenario={s} />
        ))}
      </div>

      <ForecastAssumptions assumptions={data.assumptions} />

      <div className="bg-[#fefce8] border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
        <TrendingUp size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800">AI Forecast Insight</p>
          <p className="text-sm text-amber-900 mt-0.5">{data.aiInsight}</p>
        </div>
      </div>
    </div>
  );
}
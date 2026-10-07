import { useState, useEffect, useRef } from "react";
import { Download, TrendingUp, RefreshCw, FileText } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { authedRequest } from "../../api";

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const REPORT_TYPES = [
  {
    key: "profit-loss",
    icon: TrendingUp,
    iconColor: "text-red-500",
    title: "Profit & Loss",
    caption: "Income, expenses, and net profile summary",
  },
  {
    key: "cash-flow",
    icon: RefreshCw,
    iconColor: "text-gray-500",
    title: "Cash Flow",
    caption: "Money in and out, last 6 months",
  },
  {
    key: "expense-breakdown",
    icon: FileText,
    iconColor: "text-gray-500",
    title: "Expense Breakdown",
    caption: "Detailed expense categories",
  },
  // "Crop Report" (profitability per crop) isn't included — there's no
  // link between FinancialRecord and FarmingCycle anywhere in the backend,
  // so there's no honest way to know which transactions belong to which
  // specific crop. Rather than fake that connection, it's left out.
];

// Periods are computed relative to today, not hardcoded month names —
// those would quietly go stale the moment the calendar moves on.
function getPeriods() {
  const now = new Date();
  const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = startOfMonth(lastMonthDate);
  const lastMonthEnd = endOfMonth(lastMonthDate);

  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);

  const ytdStart = new Date(now.getFullYear(), 0, 1);

  return [
    { key: "this-month", label: "This Month", startDate: thisMonthStart, endDate: thisMonthEnd },
    { key: "last-month", label: "Last Month", startDate: lastMonthStart, endDate: lastMonthEnd },
    { key: "this-quarter", label: "This Quarter", startDate: quarterStart, endDate: now },
    { key: "ytd", label: "Year to Date", startDate: ytdStart, endDate: now },
  ];
}

function ProfitLossStatement({ periodLabel, records }) {
  const incomeByCategory = {};
  const expenseByCategory = {};
  for (const r of records) {
    const catName = r.category?.name || "Uncategorized";
    const bucket = r.type === "income" ? incomeByCategory : expenseByCategory;
    bucket[catName] = (bucket[catName] || 0) + r.amount;
  }
  const incomeRows = Object.entries(incomeByCategory).map(([label, amount]) => ({ label, value: peso(amount) }));
  const expenseRows = Object.entries(expenseByCategory).map(([label, amount]) => ({ label, value: peso(amount) }));
  const grossIncome = Object.values(incomeByCategory).reduce((s, v) => s + v, 0);
  const totalExpenses = Object.values(expenseByCategory).reduce((s, v) => s + v, 0);
  const netProfit = grossIncome - totalExpenses;

  return (
    <div className="bg-[#f7f7f2] border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-800">Profit & Loss Statement - {periodLabel}</h3>

      <p className="mt-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Income</p>
      <div className="mt-2 space-y-2">
        {incomeRows.length === 0 ? (
          <p className="text-sm text-gray-400">No income recorded this period.</p>
        ) : (
          incomeRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm text-gray-700">
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))
        )}
        <div className="flex items-center justify-between font-bold text-[#4f7331] pt-2 border-t border-gray-200">
          <span>Gross Income</span>
          <span>{peso(grossIncome)}</span>
        </div>
      </div>

      <p className="mt-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Expenses</p>
      <div className="mt-2 space-y-2">
        {expenseRows.length === 0 ? (
          <p className="text-sm text-gray-400">No expenses recorded this period.</p>
        ) : (
          expenseRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-sm text-gray-700">
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))
        )}
        <div className="flex items-center justify-between font-bold text-[#b83838] pt-2 border-t border-gray-200">
          <span>Total Expenses</span>
          <span>{peso(totalExpenses)}</span>
        </div>
      </div>

      <div className="mt-4 border-t-4 border-[#4f7331] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">NET PROFIT</span>
          <span className="text-lg font-bold text-[#be8238]">{peso(netProfit)}</span>
        </div>
      </div>
    </div>
  );
}

const CASH_FLOW_Y_AXIS = ["₱Max", "", "", "", "₱0"];

// Always the last 6 real calendar months, independent of the period
// picker above — a "money over time" chart needs multiple time buckets to
// mean anything, so it isn't scoped to a single-month selection.
function CashFlowChart({ records }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-US", { month: "short" }) });
  }

  const data = months.map(({ year, month, label }) => {
    let income = 0, expenses = 0;
    for (const r of records) {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (r.type === "income") income += r.amount;
        else expenses += r.amount;
      }
    }
    return { month: label, income, expenses, profit: income - expenses };
  });

  const maxValue = Math.max(1000, ...data.flatMap((d) => [d.income, d.expenses]));
  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => `₱${Math.round((maxValue * (1 - f)) / 1000)}k`);

  const [grown, setGrown] = useState(false);
  useEffect(() => {
    setGrown(false);
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setGrown(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [records]);

  return (
    <div className="bg-[#f7f7f2] border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-800">Cash Flow - Last 6 Months</h3>

      <div className="mt-8 flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {yAxisLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>

        <div className="flex-1 flex items-end h-48 border-l border-gray-200 pl-6">
          {data.map((d, i) => {
            const isHovered = hoveredMonth === d.month;
            return (
              <div
                key={d.month + i}
                className="relative flex flex-col items-center flex-1 px-1"
                onMouseEnter={() => setHoveredMonth(d.month)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                {isHovered && (
                  <div className="absolute -top-2 -translate-y-full bg-[#f0f7ec] border border-green-200 rounded-xl p-2.5 shadow-md text-[11px] font-semibold space-y-1 whitespace-nowrap z-10">
                    <p className="text-red-600">Expenses: {peso(d.expenses)}</p>
                    <p className="text-green-700">Income: {peso(d.income)}</p>
                    <p className="text-amber-700">Net: {peso(d.profit)}</p>
                  </div>
                )}

                <div
                  className={`w-full flex items-end justify-center gap-1 h-40 rounded-2xl p-2 transition-colors ${isHovered ? "bg-[#f0f7ec]" : ""}`}
                >
                  <div
                    className="w-1/2 rounded-t-sm bg-[#4f7331] transition-[height] duration-700 ease-out"
                    style={{ height: `${grown ? (d.income / maxValue) * 100 : 0}%`, transitionDelay: `${i * 60}ms` }}
                  />
                  <div
                    className="w-1/2 rounded-t-sm bg-[#b83838] transition-[height] duration-700 ease-out"
                    style={{ height: `${grown ? (d.expenses / maxValue) * 100 : 0}%`, transitionDelay: `${i * 60 + 40}ms` }}
                  />
                </div>
                <span className="mt-2 text-xs text-gray-500">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExpenseBreakdownReport({ periodLabel, records }) {
  const byCategory = {};
  for (const r of records) {
    if (r.type !== "expense") continue;
    const catName = r.category?.name || "Uncategorized";
    byCategory[catName] = (byCategory[catName] || 0) + r.amount;
  }
  const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
  const rows = Object.entries(byCategory)
    .map(([label, amount]) => ({ label, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-[#f7f7f2] border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-800">Expense Breakdown - {periodLabel}</h3>

      <div className="mt-6 space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400">No expenses recorded this period.</p>
        ) : (
          rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">{row.label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-gray-500">{row.percent}%</span>
                  <span className="font-bold text-[#b83838]">{peso(row.amount)}</span>
                </span>
              </div>
              <div className="mt-1.5 w-full h-2.5 bg-[#e8f2e3] rounded-full overflow-hidden">
                <div className="h-full bg-[#4f7331] rounded-full" style={{ width: `${row.percent}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FarmSetupPrompt() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center max-w-md mx-auto">
      <h3 className="font-bold text-gray-900 text-lg">No farm set up yet</h3>
      <p className="mt-2 text-sm text-gray-500">
        Reports are generated from your transactions, which need a farm first. Set one up from Income & Expenses to get started.
      </p>
    </div>
  );
}

export default function FinancialReports() {
  const [reportType, setReportType] = useState("profit-loss");
  const periods = getPeriods();
  const [periodKey, setPeriodKey] = useState(periods[0].key);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hasFarm, setHasFarm] = useState(true);
  const [periodRecords, setPeriodRecords] = useState([]);
  const [sixMonthRecords, setSixMonthRecords] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  const activeReport = REPORT_TYPES.find((r) => r.key === reportType);
  const activePeriod = periods.find((p) => p.key === periodKey);

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
        const farmId = farms[0]._id;

        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [forPeriod, forSixMonths] = await Promise.all([
          authedRequest(
            `/api/financial-records?farm=${farmId}&startDate=${activePeriod.startDate.toISOString()}&endDate=${activePeriod.endDate.toISOString()}&limit=100`
          ),
          authedRequest(
            `/api/financial-records?farm=${farmId}&startDate=${sixMonthsAgo.toISOString()}&endDate=${now.toISOString()}&limit=100`
          ),
        ]);
        if (cancelled) return;
        setPeriodRecords(forPeriod);
        setSixMonthRecords(forSixMonths);
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
  }, [periodKey]);

  async function handleDownloadPdf() {
    if (!reportRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imageData = canvas.toDataURL("image/png");
      const pdfWidth = canvas.width / 2;
      const pdfHeight = canvas.height / 2;
      const pdf = new jsPDF({ orientation: pdfWidth > pdfHeight ? "landscape" : "portrait", unit: "pt", format: [pdfWidth, pdfHeight] });
      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`financial-report-${reportType}-${periodKey}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Reports</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Reports</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  if (!hasFarm) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Reports</h2>
        <FarmSetupPrompt />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Financial Reports</h2>
          <p className="mt-1 text-gray-500">Generated financial summaries for your farm</p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={isExporting}
          className="mt-12 bg-[#3f6238] hover:bg-[#34512e] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          {isExporting ? "Generating…" : "Download PDF"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {REPORT_TYPES.map((r) => {
          const isActive = reportType === r.key;
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              onClick={() => setReportType(r.key)}
              className={
                isActive
                  ? "bg-[#f0f7ec] border-2 border-[#4f7331] rounded-2xl p-4 shadow-sm text-left"
                  : "bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-left hover:border-gray-300 transition-colors"
              }
            >
              <Icon size={20} className={r.iconColor} />
              <p className="mt-2 font-bold text-gray-900 text-sm">{r.title}</p>
              <p className={`mt-0.5 text-xs ${isActive ? "text-[#4f7331]" : "text-gray-400"}`}>{r.caption}</p>
            </button>
          );
        })}
      </div>

      {reportType !== "cash-flow" && (
        <div className="mt-5 flex flex-wrap gap-2 mb-4">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodKey(p.key)}
              className={`rounded-full px-5 py-1.5 text-xs transition-colors ${
                periodKey === p.key ? "bg-[#7ca357] text-white font-semibold" : "bg-[#608044] text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {reportType === "cash-flow" && <div className="mt-5 mb-4" />}

      <div ref={reportRef}>
        {reportType === "profit-loss" && <ProfitLossStatement periodLabel={activePeriod.label} records={periodRecords} />}
        {reportType === "cash-flow" && <CashFlowChart records={sixMonthRecords} />}
        {reportType === "expense-breakdown" && <ExpenseBreakdownReport periodLabel={activePeriod.label} records={periodRecords} />}
      </div>
    </div>
  );
}
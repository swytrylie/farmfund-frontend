import { useState, useEffect, useRef } from "react";
import { Download, TrendingUp, RefreshCw, FileText, Wheat } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import {
  getProfitLossStatement,
  getCashFlowData,
  getExpenseBreakdown,
  getCropReport,
} from "../../mocks/individual/financialReports.mock";

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
    caption: "Money in and out over time",
  },
  {
    key: "expense-breakdown",
    icon: FileText,
    iconColor: "text-gray-500",
    title: "Expense Breakdown",
    caption: "Detailed expense categories",
  },
  {
    key: "crop-report",
    icon: Wheat,
    iconColor: "text-gray-500",
    title: "Crop Report",
    caption: "Profitability per crop / livestock",
  },
];

const PERIODS = ["Aug 2026", "Jul 2026", "Q2 2026", "2026 YTD"];
const CASH_FLOW_MAX = 260000;
const CASH_FLOW_Y_AXIS = ["₱260k", "₱195k", "₱130k", "₱65k", "₱0"];
const CROP_CHART_MAX = 200000;
const CROP_Y_AXIS = ["₱200k", "₱150k", "₱100k", "₱50k", "₱0"];

function ProfitLossStatement({ period, data }) {
  return (
    <div className="bg-[#f7f7f2] border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-800">
        Profit & Loss Statement - {period}
      </h3>

      <p className="mt-5 text-xs font-bold text-gray-500 uppercase tracking-wider">
        Income
      </p>
      <div className="mt-2 space-y-2">
        {data.incomeRows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-sm text-gray-700"
          >
            <span>{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between font-bold text-[#4f7331] pt-2 border-t border-gray-200">
          <span>Gross Income</span>
          <span>{data.grossIncome}</span>
        </div>
      </div>

      <p className="mt-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
        Expenses
      </p>
      <div className="mt-2 space-y-2">
        {data.expenseRows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-sm text-gray-700"
          >
            <span>{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between font-bold text-[#b83838] pt-2 border-t border-gray-200">
          <span>Total Expenses</span>
          <span>{data.totalExpenses}</span>
        </div>
      </div>

      <div className="mt-4 border-t-4 border-[#4f7331] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">NET PROFIT</span>
          <span className="text-lg font-bold text-[#be8238]">
            {data.netProfit}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlaceholderReport({ title, period }) {
  return (
    <div className="bg-[#f7f7f2] border border-gray-200 rounded-2xl p-10 shadow-sm text-center">
      <p className="text-gray-400 text-sm">
        {title} for {period} isn't available yet — coming soon.
      </p>
    </div>
  );
}

function CashFlowChart({ period, data }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);

  return (
    <div className="bg-[#f7f7f2] border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-800">Cash Flow - {period}</h3>

      <div className="mt-8 flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {CASH_FLOW_Y_AXIS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="flex-1 flex items-end h-48 border-l border-gray-200 pl-6">
          {data.map((d) => {
            const isHovered = hoveredMonth === d.month;
            return (
              <div
                key={d.month}
                className="relative flex flex-col items-center flex-1 px-1"
                onMouseEnter={() => setHoveredMonth(d.month)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                {isHovered && (
                  <div className="absolute -top-2 -translate-y-full bg-[#f0f7ec] border border-green-200 rounded-xl p-2.5 shadow-md text-[11px] font-semibold space-y-1 whitespace-nowrap z-10">
                    <p className="text-red-600">
                      Expenses: ₱{d.expenses.toLocaleString()}
                    </p>
                    <p className="text-green-700">
                      Income: ₱{d.income.toLocaleString()}
                    </p>
                    <p className="text-amber-700">
                      Profit: ₱{d.profit.toLocaleString()}
                    </p>
                  </div>
                )}

                <div
                  className={`w-full flex items-end justify-center gap-1 h-40 rounded-2xl p-2 transition-colors ${
                    isHovered ? "bg-[#f0f7ec]" : ""
                  }`}
                >
                  <div
                    className="w-1/3 rounded-t-sm bg-[#4f7331]"
                    style={{ height: `${(d.income / CASH_FLOW_MAX) * 100}%` }}
                  />
                  <div
                    className="w-1/3 rounded-t-sm bg-[#b83838]"
                    style={{ height: `${(d.expenses / CASH_FLOW_MAX) * 100}%` }}
                  />
                  <div
                    className="w-1/3 rounded-t-sm bg-[#e5b352]"
                    style={{ height: `${(d.profit / CASH_FLOW_MAX) * 100}%` }}
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

function ExpenseBreakdownReport({ period, data }) {
  return (
    <div className="bg-[#f7f7f2] border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-800">
        Expense Breakdown - {period}
      </h3>

      <div className="mt-6 space-y-4">
        {data.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">{row.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-gray-500">{row.percent}%</span>
                <span className="font-bold text-[#b83838]">
                  {row.amount}
                </span>
              </span>
            </div>
            <div className="mt-1.5 w-full h-2.5 bg-[#e8f2e3] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4f7331] rounded-full"
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CropReport({ data }) {
  const [hoveredMonth, setHoveredMonth] = useState(null);

  return (
    <div className="bg-[#f7f7f2] border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-800">Crop Performance - August 2026</h3>

      <div className="mt-8 flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {CROP_Y_AXIS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="flex-1 flex items-end h-48 border-l border-gray-200 pl-6">
          {data.map((d) => {
            const isHovered = hoveredMonth === d.month;
            return (
              <div
                key={d.month}
                className="relative flex flex-col items-center flex-1 px-1"
                onMouseEnter={() => setHoveredMonth(d.month)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                {isHovered && (
                  <div className="absolute -top-2 -translate-y-full bg-[#f0f7ec] border border-green-200 rounded-xl p-2.5 shadow-md text-[11px] font-semibold space-y-1 whitespace-nowrap z-10">
                    <p className="text-red-600">
                      Expenses: ₱{d.expenses.toLocaleString()}
                    </p>
                    <p className="text-green-700">
                      Income: ₱{d.income.toLocaleString()}
                    </p>
                    <p className="text-amber-700">
                      Profit: ₱{d.profit.toLocaleString()}
                    </p>
                  </div>
                )}

                <div
                  className={`w-full flex items-end justify-center gap-1 h-40 rounded-2xl p-2 transition-colors ${
                    isHovered ? "bg-[#f0f7ec]" : ""
                  }`}
                >
                  <div
                    className="w-1/3 rounded-t-sm bg-[#4f7331]"
                    style={{ height: `${(d.income / CROP_CHART_MAX) * 100}%` }}
                  />
                  <div
                    className="w-1/3 rounded-t-sm bg-[#b83838]"
                    style={{ height: `${(d.expenses / CROP_CHART_MAX) * 100}%` }}
                  />
                  <div
                    className="w-1/3 rounded-t-sm bg-[#e5b352]"
                    style={{ height: `${(d.profit / CROP_CHART_MAX) * 100}%` }}
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

export default function FinancialReports() {
  const [reportType, setReportType] = useState("profit-loss");
  const [period, setPeriod] = useState("Aug 2026");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  const activeReport = REPORT_TYPES.find((r) => r.key === reportType);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setReportData(null);

    const fetcher =
      reportType === "profit-loss"
        ? getProfitLossStatement(period)
        : reportType === "cash-flow"
        ? getCashFlowData(period)
        : reportType === "expense-breakdown"
        ? getExpenseBreakdown(period)
        : reportType === "crop-report"
        ? getCropReport(period)
        : Promise.resolve(null);

    fetcher.then((data) => {
      if (!cancelled) {
        setReportData(data);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reportType, period]);

  // Captures whatever report is currently on screen via reportRef — same
  // real html2canvas-pro + jsPDF technique already used by Digital Receipts
  // and the Org Dashboard's Debt Reports page.
  async function handleDownloadPdf() {
    if (!reportRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imageData = canvas.toDataURL("image/png");
      const pdfWidth = canvas.width / 2;
      const pdfHeight = canvas.height / 2;
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
        unit: "pt",
        format: [pdfWidth, pdfHeight],
      });
      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`financial-report-${reportType}-${period.replace(/\s/g, "-")}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Financial Reports
          </h2>
          <p className="mt-1 text-gray-500">
            Generated financial summaries for your farm
          </p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={isExporting || !reportData}
          className="mt-12 bg-[#3f6238] hover:bg-[#34512e] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          {isExporting ? "Generating…" : "Download PDF"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {REPORT_TYPES.map((r) => {
          const isActive = reportType === r.key;
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              onClick={() => {
                setReportType(r.key);
                setReportData(null);
              }}
              className={
                isActive
                  ? "bg-[#f0f7ec] border-2 border-[#4f7331] rounded-2xl p-4 shadow-sm text-left"
                  : "bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-left hover:border-gray-300 transition-colors"
              }
            >
              <Icon size={20} className={r.iconColor} />
              <p className="mt-2 font-bold text-gray-900 text-sm">{r.title}</p>
              <p
                className={`mt-0.5 text-xs ${
                  isActive ? "text-[#4f7331]" : "text-gray-400"
                }`}
              >
                {r.caption}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-5 py-1.5 text-xs transition-colors ${
              period === p
                ? "bg-[#7ca357] text-white font-semibold"
                : "bg-[#608044] text-white"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-[#f7f7f2] border border-gray-200 rounded-2xl p-10 shadow-sm text-center text-gray-400 text-sm">
          Loading report…
        </div>
      ) : reportData ? (
        <div ref={reportRef}>
          {reportType === "profit-loss" ? (
            <ProfitLossStatement period={period} data={reportData} />
          ) : reportType === "cash-flow" ? (
            <CashFlowChart period={period} data={reportData} />
          ) : reportType === "expense-breakdown" ? (
            <ExpenseBreakdownReport period={period} data={reportData} />
          ) : (
            <CropReport data={reportData} />
          )}
        </div>
      ) : (
        <PlaceholderReport title={activeReport.title} period={period} />
      )}
    </div>
  );
}
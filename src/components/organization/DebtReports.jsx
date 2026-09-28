import { useState, useEffect, useRef } from "react";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { getDebtReport, REPORT_CARDS, PERIODS } from "../../mocks/organization/orgDebtReports.mock";

const CARD_ICONS = {
  "outstanding-loans": FileText,
  "completed-requirements": CheckCircle2,
  "overdue-debts": AlertTriangle,
  "total-collections": () => <span className="text-lg font-bold">₱</span>,
};

function ReportSelectorCard({ card, isActive, onSelect }) {
  const Icon = CARD_ICONS[card.key];
  return (
    <button
      onClick={onSelect}
      className={
        isActive
          ? "bg-[#eef5ea] border-2 border-[#4f7331] rounded-2xl p-4 text-left cursor-pointer"
          : "bg-white border border-gray-200 rounded-2xl p-4 text-left cursor-pointer hover:border-gray-300 transition-colors"
      }
    >
      <span className={isActive ? "text-[#4f7331]" : "text-gray-500"}>
        <Icon size={20} />
      </span>
      <p className="mt-2 font-bold text-gray-900 text-sm">{card.title}</p>
      <p className={`mt-0.5 text-xs ${isActive ? "text-[#4f7331]" : "text-gray-400"}`}>
        {card.subtitle}
      </p>
    </button>
  );
}

function ReportPanel({ report, period, reportRef }) {
  if (!report) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm text-center">
        <p className="text-gray-400 text-sm">
          No report generated for {period} yet — coming soon.
        </p>
      </div>
    );
  }

  return (
    <div ref={reportRef} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">{report.cardTitle}</h3>

      <div className="space-y-5">
        {report.sections.map((section) => (
          <div key={section.heading}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {section.heading}
            </p>
            <div className="space-y-2">
              {section.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">{row.label}</span>
                  <span className={row.color || "text-gray-900"}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t-2 border-gray-100 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">{report.totalLabel}</span>
        <span className="text-2xl font-bold text-gray-900">{report.totalValue}</span>
      </div>
    </div>
  );
}

export default function DebtReports() {
  const [activeCardKey, setActiveCardKey] = useState(REPORT_CARDS[0].key);
  const [period, setPeriod] = useState("Aug 2026");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDebtReport(activeCardKey, period).then((data) => {
      if (!cancelled) {
        setReport(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeCardKey, period]);

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
      pdf.save(`debt-report-${activeCardKey}-${period.replace(/\s/g, "-")}.pdf`);
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
          <h2 className="text-3xl font-bold text-gray-900">Debt reports</h2>
          <p className="mt-1 text-gray-500">
            Reports of outstanding loans, completed repayments, overdue
            debts, and total collections
          </p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={isExporting || !report}
          className="mt-12 bg-[#38512f] hover:bg-[#2b3e24] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          {isExporting ? "Generating…" : "Download PDF"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {REPORT_CARDS.map((card) => (
          <ReportSelectorCard
            key={card.key}
            card={card}
            isActive={activeCardKey === card.key}
            onSelect={() => setActiveCardKey(card.key)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={
              period === p
                ? "bg-[#4f7331] text-white px-5 py-2 rounded-full font-medium text-sm"
                : "bg-[#e2ebd8] text-[#334b22] px-5 py-2 rounded-full font-medium text-sm hover:bg-[#d5e2c7] transition-colors"
            }
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm text-center text-gray-400 text-sm">
          Loading report…
        </div>
      ) : (
        <ReportPanel report={report} period={period} reportRef={reportRef} />
      )}
    </div>
  );
}
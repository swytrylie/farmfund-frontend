import { useState, useEffect, useRef } from "react";
import { FileText, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { authedRequest } from "../../api";
import { fetchAllPages } from "../../lib/repaymentData";
import { REPORT_CARDS, PERIOD_OPTIONS, resolvePeriod, buildReport, cardSubtitle } from "../../lib/debtReports";

const CARD_ICONS = {
  "outstanding-loans": FileText,
  "completed-requirements": CheckCircle2,
  "overdue-debts": AlertTriangle,
  "total-collections": () => <span className="text-lg font-bold">₱</span>,
};

const longDate = (d) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function ReportSelectorCard({ card, subtitle, isActive, onSelect }) {
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
      <p className={`mt-0.5 text-xs ${isActive ? "text-[#4f7331]" : "text-gray-400"}`}>{subtitle}</p>
    </button>
  );
}

// Everything inside this panel is what gets captured into the PDF, so the
// "generated on" line and the cooperative's name are part of it.
function ReportPanel({ report, now, orgName, reportRef }) {
  return (
    <div ref={reportRef} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900">{report.cardTitle}</h3>
      {orgName && <p className="text-sm text-gray-500 mt-0.5">{orgName}</p>}

      <div className="mt-4 space-y-5">
        {report.sections.map((section) => (
          <div key={section.heading}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{section.heading}</p>
            <div className="space-y-2">
              {section.rows.map((row, i) => (
                <div key={`${row.label}-${i}`} className="flex items-center justify-between text-sm gap-4">
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

      <p className="mt-4 text-[11px] text-gray-400">Generated {longDate(now)}</p>
    </div>
  );
}

export default function DebtReports({ user }) {
  const [activeCardKey, setActiveCardKey] = useState(REPORT_CARDS[0].key);
  const [periodKey, setPeriodKey] = useState("this-month");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [data, setData] = useState({ loans: [], payments: [], loadedAt: new Date() });
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const reportRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        let cooperativeId = user?.cooperativeId;
        if (!cooperativeId) {
          const me = await authedRequest("/api/auth/me");
          cooperativeId = me.cooperativeId;
        }
        if (!cooperativeId) throw new Error("No cooperative membership found on this account.");

        const [loans, payments] = await Promise.all([
          fetchAllPages("/api/loans"),
          fetchAllPages(`/api/loan-payments?cooperative=${cooperativeId}`),
        ]);
        if (!cancelled) setData({ loans, payments, loadedAt: new Date() });
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

  const activeCard = REPORT_CARDS.find((c) => c.key === activeCardKey);
  const now = data.loadedAt;
  const period = resolvePeriod(periodKey, now);
  const ctx = { loans: data.loans, payments: data.payments, now, period };
  const report = loading || loadError ? null : buildReport(activeCardKey, ctx);

  async function handleDownloadPdf() {
    if (!reportRef.current || isExporting) return;
    setIsExporting(true);
    setExportError("");

    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imageData = canvas.toDataURL("image/png");
      const pdfWidth = canvas.width / 2;
      const pdfHeight = canvas.height / 2;
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
        unit: "pt",
        format: [pdfWidth, pdfHeight],
      });
      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
      // A snapshot is named for the day it describes; a period report for its period.
      const stamp = activeCard.snapshot ? `as-of-${isoDate(now)}` : period.label.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
      pdf.save(`debt-report-${activeCardKey}-${stamp}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      setExportError("The PDF couldn't be generated. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Debt reports</h2>
          <p className="mt-1 text-gray-500">Reports of outstanding loans, completed repayments, overdue debts, and total collections</p>
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

      {exportError && <p className="mt-3 text-sm text-red-600">{exportError}</p>}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {REPORT_CARDS.map((card) => (
          <ReportSelectorCard
            key={card.key}
            card={card}
            subtitle={loading || loadError ? "" : cardSubtitle(card, ctx)}
            isActive={activeCardKey === card.key}
            onSelect={() => setActiveCardKey(card.key)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriodKey(p.key)}
            disabled={activeCard.snapshot}
            title={activeCard.snapshot ? "This report is a snapshot of right now, so the period doesn't apply" : undefined}
            className={
              periodKey === p.key && !activeCard.snapshot
                ? "bg-[#4f7331] text-white px-5 py-2 rounded-full font-medium text-sm"
                : "bg-[#e2ebd8] text-[#334b22] px-5 py-2 rounded-full font-medium text-sm hover:bg-[#d5e2c7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#e2ebd8]"
            }
          >
            {p.chip}
          </button>
        ))}
        {/* On screen only — it explains why the buttons above are greyed out,
            which means nothing on a printed page, so it sits outside the
            report that gets captured into the PDF. */}
        {activeCard.snapshot && (
          <p className="w-full text-xs text-gray-400">
            This report is a snapshot of right now. It can't be recalculated for a past period, so the period buttons don't apply.
          </p>
        )}
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm text-center text-gray-400 text-sm">Loading report…</div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      ) : (
        <ReportPanel report={report} now={now} orgName={user?.orgName} reportRef={reportRef} />
      )}
    </div>
  );
}
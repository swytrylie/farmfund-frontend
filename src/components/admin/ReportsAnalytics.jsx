import { useState, useEffect, useRef, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { authedRequest } from "../../api";
import { formatDateTime, messageFrom } from "../../lib/adminUsers";

const peso = (n) =>
  typeof n === "number" && Number.isFinite(n)
    ? `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";
const count = (n) => (typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-US") : "—");

const getReports = () => authedRequest("/api/admin/reports");

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs font-semibold text-gray-900">
      {label}: {v} {v === 1 ? "account" : "accounts"}
    </div>
  );
}

function AccountGrowthChart({ data }) {
  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-1">New Accounts - Last 6 Months</h3>
      <p className="text-xs text-gray-400 mb-4">Accounts created each month (admins not counted)</p>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar
              dataKey="value"
              fill="#33462b"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PlatformActivityPanel({ activity }) {
  const rows = [
    { label: "Total accounts", value: count(activity.totalAccounts), color: "text-gray-900" },
    { label: "New accounts this month", value: count(activity.newThisMonth), color: "text-gray-900" },
    { label: "Logins, last 7 days", value: count(activity.loginsLast7Days), color: "text-[#2e7d32]" },
    {
      label: "Failed logins, last 7 days",
      value: count(activity.failedLast7Days),
      color: activity.failedLast7Days > 0 ? "text-red-600" : "text-gray-900",
    },
    {
      label: "Suspended accounts",
      value: count(activity.suspendedAccounts),
      color: activity.suspendedAccounts > 0 ? "text-red-600" : "text-gray-900",
    },
    {
      label: "Cooperatives awaiting approval",
      value: count(activity.pendingCooperatives),
      color: activity.pendingCooperatives > 0 ? "text-[#b26a00]" : "text-gray-900",
    },
  ];
  return (
    <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm border-l-4 border-l-[#4d6b41]">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Platform Activity</h3>
      <div className="space-y-3">
        {rows.map((m, i) => (
          <div
            key={m.label}
            className={`flex items-center justify-between py-2 ${i < rows.length - 1 ? "border-b border-gray-100" : ""}`}
          >
            <span className="text-sm text-gray-600">{m.label}</span>
            <span className={`font-bold text-sm ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CooperativeTable({ cooperatives, totals }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-1">Cooperatives Overview</h3>
      <p className="text-xs text-gray-400 mb-6">
        Active members, farmers who borrowed, and the total amount lent by each cooperative
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
            <th className="pb-2 font-semibold">Cooperative</th>
            <th className="pb-2 font-semibold">Status</th>
            <th className="pb-2 font-semibold">Active Members</th>
            <th className="pb-2 font-semibold">Farmers with Loans</th>
            <th className="pb-2 font-semibold text-right">Loan Volume</th>
          </tr>
        </thead>
        <tbody>
          {cooperatives.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-400">
                No cooperatives yet.
              </td>
            </tr>
          )}
          {cooperatives.map((c) => (
            <tr key={c.id} className="border-t border-gray-50">
              <td className="py-3 pr-4 font-medium text-gray-900">{c.name}</td>
              <td className="py-3 pr-4">
                {c.status === "pending" ? (
                  <span className="bg-[#fff3e0] text-[#b26a00] px-3 py-1 rounded-full text-xs font-semibold">Pending</span>
                ) : (
                  <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-xs font-semibold">Active</span>
                )}
              </td>
              <td className="py-3 pr-4 text-gray-700">{count(c.members)}</td>
              <td className="py-3 pr-4 text-gray-700">{count(c.farmers)}</td>
              <td className="py-3 text-gray-700 text-right whitespace-nowrap">{peso(c.loanVolume)}</td>
            </tr>
          ))}
        </tbody>
        {cooperatives.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <td className="py-3 pr-4 font-bold text-gray-900">Total ({count(totals.cooperatives)})</td>
              <td className="py-3 pr-4" />
              <td className="py-3 pr-4 font-bold text-gray-900">{count(totals.members)}</td>
              <td className="py-3 pr-4 font-bold text-gray-900">{count(totals.farmers)}</td>
              <td className="py-3 font-bold text-gray-900 text-right whitespace-nowrap">{peso(totals.loanVolume)}</td>
            </tr>
          </tfoot>
        )}
      </table>
      {cooperatives.length > 0 && (
        <p className="text-xs text-gray-400 mt-3">
          A farmer who borrowed from more than one cooperative is counted once in the total.
        </p>
      )}
    </div>
  );
}

export default function ReportsAnalytics({ onSignOut }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const exportingRef = useRef(false);
  const reportRef = useRef(null);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const id = ++latest.current;
    setLoading(true);
    setError("");
    try {
      const result = await getReports();
      if (id !== latest.current) return;
      setData(result);
    } catch (err) {
      if (id !== latest.current) return;
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setError(messageFrom(err, "Could not load the reports."));
    } finally {
      if (id === latest.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Captures the whole reports container (chart + activity panel + cooperative
  // table) as one PDF, the same html2canvas-pro + jsPDF technique used by
  // Digital Receipts, Debt Reports and Financial Reports.
  async function handleDownloadPdf() {
    if (!reportRef.current || exportingRef.current) return;
    exportingRef.current = true;
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
      pdf.save("reports-and-analytics.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
      setExportError("Could not create the PDF. Please try again.");
    } finally {
      exportingRef.current = false;
      setIsExporting(false);
    }
  }

  const header = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">Platform-wide growth, engagement, and cooperative activity</p>
      </div>
      <div className="mt-12 flex items-center gap-2 shrink-0">
        <button
          onClick={load}
          disabled={loading}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={isExporting || !data}
          className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-60"
        >
          <Download size={16} />
          {isExporting ? "Generating PDF report…" : "Download PDF"}
        </button>
      </div>
    </div>
  );

  if (!data) {
    return (
      <div>
        {header}
        {error ? (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-sm text-red-600">
            {error}{" "}
            <button onClick={load} className="font-semibold underline">
              Try again
            </button>
          </div>
        ) : (
          <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
        )}
      </div>
    );
  }

  return (
    <div>
      {header}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-3 text-center text-sm text-red-600">
          {error} Showing the last numbers that loaded.
        </div>
      )}
      {exportError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-3 text-center text-sm text-red-600">
          {exportError}
        </div>
      )}

      <div ref={reportRef} className="bg-gray-50">
        <p className="mt-4 text-xs text-gray-400">Data as of {formatDateTime(data.generatedAt)}</p>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <AccountGrowthChart data={data.accountGrowth} />
          <PlatformActivityPanel activity={data.platformActivity} />
        </div>

        <CooperativeTable cooperatives={data.cooperatives} totals={data.totals} />
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { getReportsAnalytics } from "../../mocks/admin/adminReports.mock";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs font-semibold text-gray-900">
      {label}: {payload[0].value} accounts
    </div>
  );
}

function AccountGrowthChart({ data }) {
  return (
    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4">
        Account Growth - Last 6 Months
      </h3>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="value" fill="#33462b" radius={[6, 6, 0, 0]} maxBarSize={56} isAnimationActive animationDuration={700} animationEasing="ease-out" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SystemPerformancePanel({ metrics }) {
  return (
    <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm border-l-4 border-l-[#4d6b41]">
      <h3 className="text-base font-semibold text-gray-800 mb-4">System Performance</h3>
      <div className="space-y-3">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`flex items-center justify-between py-2 ${
              i < metrics.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <span className="text-sm text-gray-600">{m.label}</span>
            <span className={`font-bold text-sm ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegionalDistributionTable({ regions, totals }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Cooperative Distribution by Region
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
            <th className="pb-2 font-semibold">Region</th>
            <th className="pb-2 font-semibold">Cooperatives</th>
            <th className="pb-2 font-semibold">Registered Farmers</th>
          </tr>
        </thead>
        <tbody>
          {regions.map((r) => (
            <tr key={r.region} className="border-t border-gray-50">
              <td className="py-3 pr-4 font-medium text-gray-900">{r.region}</td>
              <td className="py-3 pr-4 text-gray-700">{r.cooperatives}</td>
              <td className="py-3 text-gray-700">{r.farmers.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200">
            <td className="py-3 pr-4 font-bold text-gray-900">Total</td>
            <td className="py-3 pr-4 font-bold text-gray-900">{totals.cooperatives}</td>
            <td className="py-3 font-bold text-gray-900">{totals.farmers.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function ReportsAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getReportsAnalytics().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Captures the whole reports container (chart + performance panel +
  // regional table) as one PDF — same real html2canvas-pro + jsPDF
  // technique already used elsewhere in this app (Digital Receipts, Debt
  // Reports, Financial Reports), not a placeholder.
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
      pdf.save("reports-and-analytics.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Platform-wide growth, engagement, and system performance
          </p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={isExporting}
          className="mt-12 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-60"
        >
          <Download size={16} />
          {isExporting ? "Generating PDF report…" : "Download PDF"}
        </button>
      </div>

      <div ref={reportRef} className="bg-gray-50">
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <AccountGrowthChart data={data.accountGrowth} />
          <SystemPerformancePanel metrics={data.systemPerformance} />
        </div>

        <RegionalDistributionTable
          regions={data.regionalDistribution}
          totals={data.totals}
        />
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getFinancialAnalytics } from "../../mocks/organization/orgFinancialAnalytics.mock";

const MONTH_FULL_NAMES = {
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
};

function KPICard({ label, value, valueColor }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className={`text-3xl font-extrabold ${valueColor}`}>{value}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const monthName = MONTH_FULL_NAMES[label] || label;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs font-semibold text-gray-900">
      {monthName} 2026: {payload[0].value}%
    </div>
  );
}

export default function FinancialAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFinancialAnalytics().then((result) => {
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
        <h2 className="text-3xl font-bold text-gray-900">Financial Analytics</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading analytics…
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Financial Analytics</h2>
      <p className="mt-1 text-gray-500">
        Total money lent, total collected, outstanding debt, and repayment
        performance
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="TOTAL MONEY LENT"
          value={data.kpis.totalLent}
          valueColor="text-gray-900"
        />
        <KPICard
          label="TOTAL COLLECTED"
          value={data.kpis.totalCollected}
          valueColor="text-[#b8860b]"
        />
        <KPICard
          label="OUTSTANDING"
          value={data.kpis.outstanding}
          valueColor="text-[#a0522d]"
        />
        <KPICard
          label="REPAYMENT RATE"
          value={data.kpis.repaymentRate}
          valueColor="text-[#4f7331]"
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-medium text-gray-700 mb-6">
          Repayment Performance - Last 6 Months
        </h3>

        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data.monthlyPerformance}>
              <CartesianGrid vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar
                dataKey="rate"
                fill="#3f5d27"
                radius={[8, 8, 0, 0]}
                maxBarSize={56}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
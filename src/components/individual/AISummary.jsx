import { useState, useEffect } from "react";
import { DollarSign, Wheat, CreditCard } from "lucide-react";
import { getAISummary } from "../../mocks/individual/aiSummary.mock";

// Spec calls for the same "Credit card icon" on both the Loans/Debt and
// Budget Management driver cards, even though a budget-specific icon might
// read more clearly — kept exactly as specified.
const DRIVER_ICONS = {
  "income-expenses": DollarSign,
  "crop-profitability": Wheat,
  "loans-debt": CreditCard,
  "budget-management": CreditCard,
};

function HeroBanner({ period, narrative, metrics }) {
  return (
    <div className="bg-[#2d4027] text-white rounded-2xl p-6 shadow-sm mb-8">
      <p className="text-xs font-semibold text-[#c9d9b8] uppercase tracking-wider">
        AI Financial Summary — {period}
      </p>

      <h2 className="mt-3 text-2xl font-bold leading-snug">
        {narrative.map((segment, i) =>
          segment.isHighlight ? (
            <span key={i} className="text-amber-300">
              {segment.text}
            </span>
          ) : (
            <span key={i}>{segment.text}</span>
          )
        )}
      </h2>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="text-[11px] font-semibold text-white/60 tracking-wider">
              {m.label}
            </p>
            <p className="mt-1 text-xl font-bold">{m.value}</p>
            <p className={`mt-0.5 text-xs ${m.changeColor}`}>{m.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DriverCard({ driver }) {
  const Icon = DRIVER_ICONS[driver.key];
  return (
    <div
      className={`bg-white border-l-4 ${driver.borderColor} border-t border-r border-b border-gray-100 rounded-2xl p-5 shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`${driver.iconBg} ${driver.iconColor} p-2.5 rounded-xl shrink-0`}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <h4 className="font-bold text-gray-900">{driver.title}</h4>
          <p className="mt-1.5 text-sm text-gray-700 leading-relaxed">
            {driver.text}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {driver.tags.map((tag) => (
              <span
                key={tag.label}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${tag.color}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AISummary({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAISummary(user?.firstName, user?.lastName).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.firstName, user?.lastName]);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          AI Financial Summary
        </h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading summary…
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">
        AI Financial Summary
      </h2>
      <p className="mt-1 text-gray-500">
        Plain-language overview of your farm's financial health
      </p>

      <div className="mt-6">
        <HeroBanner
          period={data.period}
          narrative={data.narrative}
          metrics={data.metrics}
        />
      </div>

      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        What's Driving This
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {data.drivers.map((driver) => (
          <DriverCard key={driver.key} driver={driver} />
        ))}
      </div>

      <div className="bg-[#fffbeb] border border-amber-200 rounded-2xl p-5 shadow-sm">
        <p className="font-bold text-amber-900">
          Suggested focus for next cycle
        </p>
        <p className="mt-1.5 text-sm text-amber-900/90 leading-relaxed">
          {data.focusRecommendation}
        </p>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { DollarSign, Wheat, CreditCard, RefreshCw, Info } from "lucide-react";
import { fetchSummary } from "../../lib/aiAdvisor";
import AIGuideButton from "../shared/AIGuide";

// Spec calls for the same "Credit card icon" on both the Loans/Debt and
// Budget Management driver cards, even though a budget-specific icon might
// read more clearly — kept exactly as specified.
const DRIVER_ICONS = {
  "income-expenses": DollarSign,
  "crop-profitability": Wheat,
  "loans-debt": CreditCard,
  "budget-management": CreditCard,
};

// The backend says whether each number is good, bad or worth watching; these
// turn that into the page's colors. (The old mock data carried class names
// directly, which still works when VITE_AI_MOCK=true.)
const METRIC_TONE = { good: "text-green-300", bad: "text-red-300", warn: "text-amber-300", neutral: "text-white/60" };
const TAG_TONE = {
  good: "bg-green-100 text-green-800",
  bad: "bg-red-100 text-red-700",
  warn: "bg-amber-100 text-amber-800",
  neutral: "bg-gray-100 text-gray-700",
};
// Left edge only (border-l-*), so the gray outline on the other three sides stays gray.
const BORDER_TONE = { good: "border-l-green-400", bad: "border-l-red-400", warn: "border-l-amber-400", neutral: "border-l-gray-300" };

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
            <p className={`mt-0.5 text-xs ${m.changeColor || METRIC_TONE[m.tone] || METRIC_TONE.neutral}`}>{m.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DriverCard({ driver }) {
  const Icon = DRIVER_ICONS[driver.key];
  const isCrop = driver.key === "crop-profitability";
  const iconBg = driver.iconBg || (isCrop ? "bg-[#fef3c7]" : "bg-[#dcfce7]");
  const iconColor = driver.iconColor || (isCrop ? "text-amber-700" : "text-emerald-700");
  const border = driver.borderColor?.replace(/^border-/, "border-l-") || BORDER_TONE[driver.status] || BORDER_TONE.neutral;
  return (
    <div
      className={`bg-white border-l-4 ${border} border-t border-r border-b border-gray-100 rounded-2xl p-5 shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`${iconBg} ${iconColor} p-2.5 rounded-xl shrink-0`}
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
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${tag.color || TAG_TONE[tag.tone] || TAG_TONE.neutral}`}
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (refresh = false) => {
      setError(null);
      if (refresh) setRefreshing(true);
      try {
        setData(await fetchSummary({ refresh, user }));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.firstName, user?.lastName]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const title = (
    <h2 className="text-3xl font-bold text-gray-900">
      AI Financial Summary
    </h2>
  );

  if (loading || (error && !data)) {
    return (
      <div>
        {title}
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          {loading ? (
            "Writing your summary…"
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600">Couldn't load your summary. {error.message}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  load(false);
                }}
                className="bg-[#3f6238] hover:bg-[#2d4027] text-white text-sm font-semibold px-4 py-2 rounded-full cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {title}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-gray-500">
          Plain-language overview of your farm's financial health
        </p>
        <div className="flex items-center gap-3">
          <AIGuideButton tab="summary" label="How to read this" />
          {data.generatedAt && (
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3f6238] hover:text-[#2d4027] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Updating…" : "Update summary"}
            </button>
          )}
        </div>
      </div>

      {data.source === "rules" && (
        <p className="mt-4 flex items-start gap-2 text-xs text-gray-600 bg-gray-100 rounded-xl px-3 py-2">
          <Info size={14} className="mt-0.5 shrink-0" />
          The AI is busy right now, so this summary was written from your numbers only. Try “Update summary” in a few minutes.
        </p>
      )}

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

      {data.tips?.length > 0 && (
        <div className="mt-6 text-sm text-gray-600">
          <p className="font-semibold text-gray-800">Make this summary more accurate</p>
          <ul className="mt-1.5 space-y-1 list-disc pl-5">
            {data.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

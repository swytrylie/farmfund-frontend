import { useState } from "react";
import { Clock, CheckCircle2, Info } from "lucide-react";

// ---- KPI summary data ----
const KPI_CARDS = [
  { label: "Total Outstanding", value: "₱151,000", valueColor: "text-[#b83838]" },
  {
    label: "Next Payment Due",
    value: "₱14,200",
    valueColor: "text-[#be8238]",
    subtext: "In 7 days 2026 -09-05",
  },
  { label: "Active Loans", value: "2", valueColor: "text-gray-900" },
];

// ---- Loan data ----
// Agrarian Reform Fund's 42% / ₱87,500 here is a literal duplicate of
// LANDBANK's numbers, confirmed against the actual screenshot — but it
// conflicts with the 20% / ₱64,000 already shown for the same loan on the
// Dashboard home page. Matching this screenshot exactly, as instructed;
// the two pages now disagree with each other about this loan's real numbers.
//
// Agrarian's detail-panel fields (principal, interest, term, paid-so-far)
// weren't specified anywhere, so they're filled in as reasonable
// placeholders consistent with its known ₱87,500 remaining balance here —
// not real figures.
const LOANS = {
  landbank: {
    id: "landbank",
    name: "LANDBANK Agriculture",
    subtitle: "Farm Equipment",
    status: "active",
    progress: 42,
    remainingLabel: "₱87,500 remaining",
    interestRate: "14% p.a.",
    term: "2025-03-01 to 2026-12-01",
    principal: "₱500,000",
    outstanding: "₱312,000",
    totalPaid: "₱188,000",
    monthlyPayment: "₱14,200",
    nextDue: "2026-09-05",
    nextDueDays: "(7 days)",
    trend: [500000, 420000, 340000, 260000, 180000, 100000, 20000],
  },
  agrarian: {
    id: "agrarian",
    name: "Agrarian Reform Fund",
    subtitle: "Crop Production Capital",
    status: "active",
    progress: 42,
    remainingLabel: "₱87,500 remaining",
    interestRate: "10% p.a.", // placeholder — not specified
    term: "2025-06-01 to 2027-06-01", // placeholder — not specified
    principal: "₱500,000", // placeholder — not specified
    outstanding: "₱87,500",
    totalPaid: "₱412,500", // placeholder — not specified
    monthlyPayment: "₱8,600", // placeholder — not specified
    nextDue: "2026-09-15",
    nextDueDays: "(17 days)",
    trend: [500000, 420000, 340000, 260000, 180000, 100000, 87500], // placeholder
  },
  seasonal: {
    id: "seasonal",
    name: "Seasonal Loan",
    subtitle: "Farmers SACCO",
    status: "paid",
  },
};

const CHART_MONTHS = ["Mar", "Jun", "Sep", "Dec", "Mar '26", "Jun '26", "Sep '26"];
const CHART_MAX = 600000;
const Y_AXIS_LABELS = ["₱600k", "₱450k", "₱300k", "₱150k", "₱0"];
const CHART_W = 600;
const CHART_H = 200;

function LoanSelectorCard({ loan, isSelected, onSelect }) {
  if (loan.status === "paid") {
    return (
      <div className="bg-[#f0fdf4] border border-emerald-300 rounded-2xl p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-gray-900">{loan.name}</h3>
          <span className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={14} className="text-white" />
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{loan.subtitle}</p>
        <p className="mt-3 text-xs font-semibold text-emerald-700">
          Fully repaid
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-white border rounded-2xl p-4 transition-colors ${
        isSelected ? "border-[#4d6b41] ring-1 ring-[#4d6b41]" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-gray-900">{loan.name}</h3>
        <Clock size={16} className="text-amber-500" />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">{loan.subtitle}</p>

      <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-600 rounded-full"
          style={{ width: `${loan.progress}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-gray-500">{loan.progress}% paid</span>
        <span className="text-gray-700 font-medium">{loan.remainingLabel}</span>
      </div>
    </button>
  );
}

function LoanDetailPanel({ loan }) {
  const stats = [
    { label: "Principal", value: loan.principal, color: "text-gray-900" },
    { label: "Outstanding", value: loan.outstanding, color: "text-red-600" },
    { label: "Total Paid", value: loan.totalPaid, color: "text-green-700" },
    {
      label: "Monthly Payment",
      value: loan.monthlyPayment,
      color: "text-amber-700",
    },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 underline decoration-2 decoration-blue-500 underline-offset-4">
        {loan.name}
      </h3>
      <p className="text-xs text-gray-400 mt-0.5">{loan.subtitle}</p>
      <p className="text-xs text-gray-500 mt-1">
        {loan.interestRate} · {loan.term}
      </p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border border-gray-100 rounded-xl p-3"
          >
            <p className="text-[11px] text-gray-400">{s.label}</p>
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-[#fff7ed] border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-xs font-medium text-amber-900">
        <Info size={14} className="shrink-0" />
        Next Payment due:{" "}
        <span className="font-bold">{loan.nextDue}</span>{" "}
        {loan.nextDueDays}
      </div>
    </div>
  );
}

function OutstandingTrendChart({ loan }) {
  const points = loan.trend.map((v, i) => ({
    x: (i / (loan.trend.length - 1)) * CHART_W,
    y: CHART_H - (v / CHART_MAX) * CHART_H,
  }));
  const path = points.map((p) => `${p.x},${p.y}`).join(" L ");

  return (
    <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900">Outstanding Balance Trend</h3>

      <div className="mt-6 flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {Y_AXIS_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="flex-1 border-l border-gray-200 pl-4">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-48"
            preserveAspectRatio="none"
          >
            <path d={`M ${path}`} fill="none" stroke="#374151" strokeWidth="1.5" />
          </svg>
          <div className="flex justify-between mt-2 px-1">
            {CHART_MONTHS.map((m) => (
              <span key={m} className="text-[10px] text-gray-500">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoansDebt() {
  const [selectedLoanId, setSelectedLoanId] = useState("landbank");
  const selectedLoan = LOANS[selectedLoanId];

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">
        Loan & Debt Management
      </h2>
      <p className="mt-1 text-gray-500">
        Track repayments, interest, and outstanding balances
      </p>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {KPI_CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <p className="text-sm text-gray-700">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.valueColor}`}>
              {card.value}
            </p>
            {card.subtext && (
              <p className="mt-0.5 text-xs text-gray-400">{card.subtext}</p>
            )}
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: loan selector cards */}
        <div className="space-y-4">
          {Object.values(LOANS).map((loan) => (
            <LoanSelectorCard
              key={loan.id}
              loan={loan}
              isSelected={selectedLoanId === loan.id}
              onSelect={() => setSelectedLoanId(loan.id)}
            />
          ))}
        </div>

        {/* Right: selected loan details + trend chart */}
        <div>
          <LoanDetailPanel loan={selectedLoan} />
          <OutstandingTrendChart loan={selectedLoan} />
        </div>
      </div>
    </div>
  );
}
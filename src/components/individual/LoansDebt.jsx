import { useState } from "react";
import { Clock, CheckCircle2, Info, Plus, UploadCloud, X } from "lucide-react";

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

// ---- New Loan modal dropdown options ----
const LENDER_OPTIONS = [
  "Land Bank of the Philippines (LBP)",
  "Development Bank of the Philippines (DBP)",
  "Agricultural Credit Policy Council (ACPC)",
  "Quedan and Rural Credit Guarantee Corporation (Quedancor)",
  "Rural bank",
  "Cooperative (e.g., KFA Cooperative)",
  "Microfinance institution / NGO",
  "Private lender / individual",
  "Other",
];
const LOAN_TYPE_OPTIONS = [
  "Crop Production",
  "Equipment / Machinery",
  "Land Acquisition",
  "Working Capital",
  "Other",
];
const LOAN_TERM_OPTIONS = ["12 months", "24 months", "36 months", "60 months"];
const PAYMENT_FREQUENCY_OPTIONS = [
  "Monthly",
  "Quarterly",
  "Semi-Annually",
  "Annually",
  "Lump Sum at Maturity",
];

// ---- Initial loan data ----
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
const INITIAL_LOANS = {
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

function TextField({ label, required, value, onChange, error, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SelectField({ label, required, value, onChange, options, error }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
        {label} {required && "*"}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      >
        <option value="" disabled>
          Select...
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const EMPTY_LOAN_FORM = {
  name: "",
  lender: "",
  loanType: "",
  principal: "",
  interestRate: "",
  loanTerm: "",
  disbursementDate: "",
  maturityDate: "",
  paymentFrequency: "",
  firstPaymentDue: "",
  monthlyPayment: "",
  notes: "",
};

function NewLoanModal({ onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY_LOAN_FORM);
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // Loan/Debt Name: letters, numbers, spaces, and common punctuation only —
  // blocks stray symbols while still allowing things like "Tractor Loan #2"
  // or "Juan's Farm Expansion".
  function updateName(rawValue) {
    const cleaned = rawValue.replace(/[^a-zA-Z0-9\s.,'&()-]/g, "");
    update("name", cleaned);
  }

  // Principal Amount: digits and commas only, live-stripped as you type —
  // matches the "e.g., 500,000" placeholder format.
  function updatePrincipal(rawValue) {
    const cleaned = rawValue.replace(/[^0-9,]/g, "");
    update("principal", cleaned);
  }

  // Interest Rate: digits and at most one decimal point.
  function updateInterestRate(rawValue) {
    let cleaned = rawValue.replace(/[^0-9.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot !== -1) {
      cleaned =
        cleaned.slice(0, firstDot + 1) +
        cleaned.slice(firstDot + 1).replace(/\./g, "");
    }
    update("interestRate", cleaned);
  }

  // Monthly Payment: same digits-and-commas rule as Principal.
  function updateMonthlyPayment(rawValue) {
    const cleaned = rawValue.replace(/[^0-9,]/g, "");
    update("monthlyPayment", cleaned);
  }

  function handleFiles(files) {
    if (files && files[0]) setFileName(files[0].name);
  }

  function handleSave() {
    const principalNum = parseFloat(String(form.principal).replace(/,/g, ""));
    const interestNum = parseFloat(form.interestRate);

    const newErrors = {
      name: !form.name.trim() ? "Loan/Debt name is required." : null,
      lender: !form.lender ? "Select a lender/institution." : null,
      loanType: !form.loanType ? "Select a loan type." : null,
      principal: !form.principal.trim()
        ? "Principal amount is required."
        : !principalNum || principalNum <= 0
        ? "Enter a valid amount greater than 0."
        : null,
      interestRate: !form.interestRate.trim()
        ? "Interest rate is required."
        : Number.isNaN(interestNum) || interestNum <= 0 || interestNum > 100
        ? "Enter a valid rate between 0 and 100."
        : null,
      disbursementDate: !form.disbursementDate ? "Disbursement date is required." : null,
      maturityDate: !form.maturityDate
        ? "Maturity date is required."
        : form.disbursementDate && form.maturityDate <= form.disbursementDate
        ? "Maturity date must be after the disbursement date."
        : null,
      firstPaymentDue: !form.firstPaymentDue
        ? "First payment due date is required."
        : form.disbursementDate && form.firstPaymentDue < form.disbursementDate
        ? "First payment can't be before the disbursement date."
        : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    onSave({
      id: `loan-${Date.now()}`,
      name: form.name.trim(),
      subtitle: form.loanType,
      status: "active",
      progress: 0, // brand new loan, nothing paid yet
      remainingLabel: `₱${principalNum.toLocaleString()} remaining`,
      interestRate: `${form.interestRate}% p.a.`,
      term: `${form.disbursementDate} to ${form.maturityDate}`,
      principal: `₱${principalNum.toLocaleString()}`,
      outstanding: `₱${principalNum.toLocaleString()}`, // nothing paid yet
      totalPaid: "₱0",
      monthlyPayment: form.monthlyPayment
        ? `₱${form.monthlyPayment}`
        : "Not set",
      nextDue: form.firstPaymentDue,
      nextDueDays: "",
      trend: [principalNum, principalNum], // flat line — no payment history yet
      lender: form.lender,
      loanTerm: form.loanTerm,
      paymentFrequency: form.paymentFrequency,
      notes: form.notes,
      documentName: fileName || null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">New Loan</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Add a new loan or debt to keep track of repayments and balances.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Row 1 */}
          <TextField
            label="Loan / Debt Name"
            required
            value={form.name}
            onChange={updateName}
            error={errors.name}
            placeholder="e.g., Tractor Loan, Farm Expansion Loan"
          />

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Lender / Institution"
              required
              value={form.lender}
              onChange={(v) => update("lender", v)}
              options={LENDER_OPTIONS}
              error={errors.lender}
            />
            <SelectField
              label="Loan Type"
              required
              value={form.loanType}
              onChange={(v) => update("loanType", v)}
              options={LOAN_TYPE_OPTIONS}
              error={errors.loanType}
            />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextField
              label="Principal Amount (PHP)"
              required
              value={form.principal}
              onChange={updatePrincipal}
              error={errors.principal}
              placeholder="e.g., 500,000"
            />
            <TextField
              label="Interest Rate (%)"
              required
              value={form.interestRate}
              onChange={updateInterestRate}
              error={errors.interestRate}
              placeholder="e.g., 12"
            />
            <SelectField
              label="Loan Term"
              value={form.loanTerm}
              onChange={(v) => update("loanTerm", v)}
              options={LOAN_TERM_OPTIONS}
            />
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Disbursement Date"
              required
              type="date"
              value={form.disbursementDate}
              onChange={(v) => update("disbursementDate", v)}
              error={errors.disbursementDate}
            />
            <TextField
              label="Maturity Date"
              required
              type="date"
              value={form.maturityDate}
              onChange={(v) => update("maturityDate", v)}
              error={errors.maturityDate}
            />
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Payment Frequency"
              value={form.paymentFrequency}
              onChange={(v) => update("paymentFrequency", v)}
              options={PAYMENT_FREQUENCY_OPTIONS}
            />
            <TextField
              label="First Payment Due"
              required
              type="date"
              value={form.firstPaymentDue}
              onChange={(v) => update("firstPaymentDue", v)}
              error={errors.firstPaymentDue}
            />
          </div>

          {/* Row 6 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Monthly Payment (PHP)"
              value={form.monthlyPayment}
              onChange={updateMonthlyPayment}
              placeholder="e.g., 14,200"
            />
            <TextField
              label="Purpose / Notes"
              value={form.notes}
              onChange={(v) => update("notes", v)}
              placeholder="e.g., Purchase of seeds and fertilizers"
            />
          </div>

          {/* Upload area */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Upload Loan Document (Optional)
            </label>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-green-500 bg-green-50"
                  : "border-green-300 bg-[#f7faf6]"
              }`}
            >
              <UploadCloud size={22} className="mx-auto text-green-600" />
              <p className="mt-2 text-sm text-gray-700">
                {fileName || "Click to upload or drag & drop"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                PDF, JPG, PNG up to 5MB
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-[#5c8247] hover:bg-[#4d6b41] text-white transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoansDebt() {
  const [loans, setLoans] = useState(INITIAL_LOANS);
  const [selectedLoanId, setSelectedLoanId] = useState("landbank");
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const selectedLoan = loans[selectedLoanId];

  function handleSaveNewLoan(newLoan) {
    setLoans((prev) => ({ ...prev, [newLoan.id]: newLoan }));
    setSelectedLoanId(newLoan.id);
    setIsAddLoanOpen(false);
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Loan & Debt Management
          </h2>
          <p className="mt-1 text-gray-500">
            Track repayments, interest, and outstanding balances
          </p>
        </div>
        <button
          onClick={() => setIsAddLoanOpen(true)}
          className="mt-12 bg-[#5c8247] hover:bg-[#4d6b41] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
        >
          <Plus size={16} /> Add Loan
        </button>
      </div>

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
          {Object.values(loans).map((loan) => (
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

      {isAddLoanOpen && (
        <NewLoanModal
          onSave={handleSaveNewLoan}
          onCancel={() => setIsAddLoanOpen(false)}
        />
      )}
    </div>
  );
}
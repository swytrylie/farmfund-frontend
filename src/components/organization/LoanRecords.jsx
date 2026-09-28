import { useState, useEffect } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Plus,
  X,
  UploadCloud,
} from "lucide-react";
import {
  getLoanRecords,
  saveNewLoanRecord,
  BORROWER_OPTIONS,
  LOAN_TYPE_OPTIONS,
  LOAN_TERM_OPTIONS,
  PAYMENT_FREQUENCY_OPTIONS,
} from "../../mocks/organization/orgLoanRecords.mock";

const CHART_MONTHS = ["Mar", "Jun", "Sep", "Dec", "Mar '26", "Jun '26", "Sep '26"];
const Y_AXIS_LABELS = ["₱600k", "₱450k", "₱300k", "₱150k", "₱0"];
const CHART_W = 600;
const CHART_H = 200;

// Exact patterns from the spec
const PRINCIPAL_REGEX = /^\d+(\.\d{1,2})?$/;
const INTEREST_REGEX = /^\d+(\.\d{1,2})?$/;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_UPLOAD_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

function KPICard({ label, value, valueColor }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

const STATUS_CONFIG = {
  active: { Icon: Clock, iconColor: "text-amber-500", card: "border-2 border-[#4f7331] bg-white" },
  overdue: { Icon: AlertTriangle, iconColor: "text-red-500", card: "border border-gray-200 bg-white" },
  paid: { Icon: CheckCircle2, iconColor: "text-green-600", card: "border border-green-200 bg-[#f4f8f3]" },
};

function LoanCard({ loan, isSelected, onSelect }) {
  const config = STATUS_CONFIG[loan.status];
  const Icon = config.Icon;
  const barColor = loan.status === "overdue" ? "bg-red-500" : "bg-green-600";

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl p-4 shadow-sm relative transition-colors ${config.card} ${
        isSelected && loan.status !== "active" ? "ring-1 ring-[#4f7331]" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-gray-900">{loan.borrower}</h3>
        <Icon size={16} className={config.iconColor} />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        {loan.id} · {loan.subtitle}
      </p>

      <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${loan.progress}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-gray-500">{loan.progress}% paid</span>
        <span
          className={`font-medium ${
            loan.status === "overdue" ? "text-red-600" : loan.status === "paid" ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {loan.remainingLabel}
        </span>
      </div>
    </button>
  );
}

function OutstandingTrendChart({ loan }) {
  const points = loan.trend.map((v, i) => ({
    x: (i / (loan.trend.length - 1)) * CHART_W,
    y: CHART_H - (v / 600000) * CHART_H,
  }));
  const path = points.map((p) => `${p.x},${p.y}`).join(" L ");

  return (
    <div className="mt-4 flex gap-3">
      <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
        {Y_AXIS_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="flex-1 border-l border-gray-200 pl-4">
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-48" preserveAspectRatio="none">
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
  );
}

function LoanDetailPanel({ loan }) {
  const stats = [
    { label: "Principal", value: loan.principal, color: "text-gray-900" },
    { label: "Outstanding", value: loan.outstanding, color: "text-red-600" },
    { label: "Total Paid", value: loan.totalPaid, color: "text-[#4f7331]" },
    { label: "Monthly", value: loan.monthlyPayment, color: "text-amber-700" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="font-bold text-gray-900">
        LOAN {loan.id} • {loan.borrower}
      </h3>
      <p className="text-xs text-gray-500 mt-0.5">
        {loan.subtitle} · {loan.interestRate} · {loan.term}
      </p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="border border-gray-100 rounded-xl p-3">
            <p className="text-[11px] text-gray-400">{s.label}</p>
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 bg-[#fff8ed] border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-sm">
        <Info size={14} className="text-amber-700 shrink-0" />
        <span>
          Next Payment due: <span className="font-bold text-[#8a2d2d]">{loan.nextDue}</span>{" "}
          {loan.nextDueDays}
        </span>
      </div>

      <h4 className="mt-6 font-bold text-gray-900">Outstanding Balance Trend</h4>
      <OutstandingTrendChart loan={loan} />
    </div>
  );
}

function TextField({ label, required, value, onChange, error, placeholder, type = "text", maxLength }) {
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
        maxLength={maxLength}
        className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SelectField({ label, required, value, onChange, options, error, placeholder = "Select..." }) {
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
          {placeholder}
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
  borrower: "",
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

function AddLoanModal({ onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY_LOAN_FORM);
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // Digits and one decimal point, up to 2 decimal places — matches the
  // PRINCIPAL_REGEX/INTEREST_REGEX pattern live as you type, not just on submit.
  function updateDecimalField(field, rawValue) {
    let cleaned = rawValue.replace(/[^0-9.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot !== -1) {
      cleaned =
        cleaned.slice(0, firstDot + 1) +
        cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
    }
    update(field, cleaned);
  }

  function handleFiles(files) {
    const file = files && files[0];
    if (!file) return;

    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      setFileError("Only PDF, JPG, or PNG files are allowed.");
      setFileName("");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setFileError("File is too large — 5MB maximum.");
      setFileName("");
      return;
    }

    setFileError("");
    setFileName(file.name);
  }

  function handleSave() {
    const principalNum = parseFloat(form.principal);
    const interestNum = parseFloat(form.interestRate);

    const newErrors = {
      name: !form.name.trim()
        ? "Loan/Debt name is required."
        : form.name.length > 60
        ? "Keep it under 60 characters."
        : null,
      borrower: !form.borrower ? "Select a farmer/borrower." : null,
      loanType: !form.loanType ? "Select a loan type." : null,
      principal: !form.principal.trim()
        ? "Principal amount is required."
        : !PRINCIPAL_REGEX.test(form.principal) || principalNum <= 0
        ? "Enter a valid positive amount (e.g., 500000 or 500000.50)."
        : null,
      interestRate: !form.interestRate.trim()
        ? "Interest rate is required."
        : !INTEREST_REGEX.test(form.interestRate) || interestNum < 0 || interestNum > 100
        ? "Enter a valid rate between 0 and 100."
        : null,
      loanTerm: !form.loanTerm ? "Select a loan term." : null,
      disbursementDate: !form.disbursementDate ? "Disbursement date is required." : null,
      maturityDate: !form.maturityDate
        ? "Maturity date is required."
        : form.disbursementDate && form.maturityDate <= form.disbursementDate
        ? "Maturity date must be after the disbursement date."
        : null,
      paymentFrequency: !form.paymentFrequency ? "Select a payment frequency." : null,
      firstPaymentDue: !form.firstPaymentDue ? "First payment due date is required." : null,
      notes: form.notes.length > 250 ? "Keep notes under 250 characters." : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean) || fileError) return;

    const loanId = `LN-${Math.floor(1000 + Math.random() * 9000)}`;

    onSave({
      id: loanId,
      borrower: form.borrower,
      subtitle: form.loanType,
      status: "active",
      progress: 0,
      remainingLabel: `₱${principalNum.toLocaleString()} remaining`,
      interestRate: `${form.interestRate}% p.a.`,
      term: `${form.disbursementDate} to ${form.maturityDate}`,
      principal: `₱${principalNum.toLocaleString()}`,
      outstanding: `₱${principalNum.toLocaleString()}`,
      totalPaid: "₱0",
      monthlyPayment: form.monthlyPayment ? `₱${form.monthlyPayment}` : "Not set",
      nextDue: form.firstPaymentDue,
      nextDueDays: "",
      trend: [principalNum, principalNum],
      principalRaw: principalNum,
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
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <TextField
            label="Loan / Debt Name"
            required
            value={form.name}
            onChange={(v) => update("name", v)}
            error={errors.name}
            placeholder="e.g., Tractor Loan, Farm Expansion Loan"
            maxLength={60}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Farmer / Borrower"
              required
              value={form.borrower}
              onChange={(v) => update("borrower", v)}
              options={BORROWER_OPTIONS}
              error={errors.borrower}
              placeholder="Select Farmer"
            />
            <SelectField
              label="Loan Type"
              required
              value={form.loanType}
              onChange={(v) => update("loanType", v)}
              options={LOAN_TYPE_OPTIONS}
              error={errors.loanType}
              placeholder="Select Loan Type"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextField
              label="Principal Amount (PHP)"
              required
              value={form.principal}
              onChange={(v) => updateDecimalField("principal", v)}
              error={errors.principal}
              placeholder="e.g., 500,000"
            />
            <TextField
              label="Interest Rate (%)"
              required
              value={form.interestRate}
              onChange={(v) => updateDecimalField("interestRate", v)}
              error={errors.interestRate}
              placeholder="e.g., 12"
            />
            <SelectField
              label="Loan Term"
              required
              value={form.loanTerm}
              onChange={(v) => update("loanTerm", v)}
              options={LOAN_TERM_OPTIONS}
              error={errors.loanTerm}
              placeholder="e.g., 24 months"
            />
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Payment Frequency"
              required
              value={form.paymentFrequency}
              onChange={(v) => update("paymentFrequency", v)}
              options={PAYMENT_FREQUENCY_OPTIONS}
              error={errors.paymentFrequency}
              placeholder="Select frequency"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Monthly Payment (PHP)"
              value={form.monthlyPayment}
              onChange={(v) => updateDecimalField("monthlyPayment", v)}
              placeholder="e.g., 14,200"
            />
            <TextField
              label="Purpose / Notes"
              value={form.notes}
              onChange={(v) => update("notes", v)}
              error={errors.notes}
              placeholder="e.g., Purchase of seeds and fertilizers"
              maxLength={250}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Upload Loan Document (Optional)
            </label>
            <p className="text-xs text-gray-400 mb-1.5">
              Upload contract, agreement, or any related document
            </p>
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
                isDragging ? "border-green-500 bg-green-50" : "border-green-300 bg-[#f7faf6]"
              }`}
            >
              <UploadCloud size={22} className="mx-auto text-green-600" />
              <p className="mt-2 text-sm text-gray-700">
                {fileName || "Click to upload or drag & drop"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG up to 5MB</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
            {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
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

// Parses "₱4.82M" style abbreviated strings, adds an amount, and reformats
// — so the KPI card genuinely updates rather than staying static.
function addToAbbreviatedPeso(abbreviated, amountToAdd) {
  const num = parseFloat(abbreviated.replace(/[₱,]/g, "").replace("M", "")) * 1000000;
  const newTotal = num + amountToAdd;
  return newTotal >= 1000000
    ? `₱${(newTotal / 1000000).toFixed(2)}M`
    : `₱${Math.round(newTotal).toLocaleString()}`;
}

export default function LoanRecords() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getLoanRecords().then((result) => {
      if (!cancelled) {
        setData(result);
        setSelectedLoanId(Object.keys(result.loans)[0]);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveNewLoan(newLoan) {
    await saveNewLoanRecord();
    setData((prev) => ({
      ...prev,
      loans: { ...prev.loans, [newLoan.id]: newLoan },
      kpis: {
        ...prev.kpis,
        activeLoans: prev.kpis.activeLoans + 1,
        totalOutstanding: addToAbbreviatedPeso(prev.kpis.totalOutstanding, newLoan.principalRaw),
      },
    }));
    setSelectedLoanId(newLoan.id);
    setIsAddLoanOpen(false);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Loan Records</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading loan records…
        </div>
      </div>
    );
  }

  const selectedLoan = data.loans[selectedLoanId];

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Loan Records</h2>
          <p className="mt-1 text-gray-500">
            Loan amount, date issued, terms, and due date for every loan issued
          </p>
        </div>
        <button
          onClick={() => setIsAddLoanOpen(true)}
          className="mt-12 bg-[#38512f] hover:bg-[#2b3e24] text-white font-medium px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={16} /> Add new loan
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="TOTAL OUTSTANDING" value={data.kpis.totalOutstanding} valueColor="text-[#c24141]" />
        <KPICard label="ACTIVE LOANS" value={data.kpis.activeLoans} valueColor="text-gray-900" />
        <KPICard label="AVG. INTEREST RATE" value={data.kpis.avgInterestRate} valueColor="text-gray-900" />
      </div>

      <div className="mt-6 flex flex-col lg:flex-row gap-4">
        <div className="lg:w-2/5 space-y-4">
          {Object.values(data.loans).map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              isSelected={selectedLoanId === loan.id}
              onSelect={() => setSelectedLoanId(loan.id)}
            />
          ))}
        </div>

        <div className="flex-1">
          <LoanDetailPanel loan={selectedLoan} />
        </div>
      </div>

      {isAddLoanOpen && (
        <AddLoanModal onSave={handleSaveNewLoan} onCancel={() => setIsAddLoanOpen(false)} />
      )}
    </div>
  );
}
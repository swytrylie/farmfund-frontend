import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Download,
  UploadCloud,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import {
  getReceiptsData,
  CATEGORY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "../../mocks/individual/digitalReceipts.mock";

function KPICard({ label, value, valueColor, subtext }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{subtext}</p>
    </div>
  );
}

// Status badge for the list — three states: scanned (green), pending
// (amber), or no status at all (renders nothing, matching URC Feeds).
function StatusBadge({ status }) {
  if (status === "scanned") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={12} />
        scanned
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
        <Clock size={12} />
        pending
      </span>
    );
  }
  return null;
}

function ReceiptListItem({ receipt, isSelected, onSelect }) {
  const isUnpriced = !receipt.status; // URC Feeds: no badge, amount shown in red
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl p-4 transition-colors ${
        isSelected
          ? "bg-[#f4f8f3] border-2 border-[#4f7331]"
          : "bg-white border border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">
            {receipt.vendor}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {receipt.id} · {receipt.date}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`font-bold text-sm ${
              isUnpriced ? "text-red-600" : "text-green-700"
            }`}
          >
            {receipt.amount}
          </p>
          <div className="mt-1">
            <StatusBadge status={receipt.status} />
          </div>
        </div>
      </div>
    </button>
  );
}

// Footer note reflects the receipt's real status rather than always
// claiming "verified" — not specified for pending/no-status receipts in
// the original spec, so built to stay honest about what's actually true.
function VerificationFooter({ status }) {
  if (status === "scanned") {
    return (
      <p className="text-xs text-green-700 flex items-center gap-1 mt-3">
        <CheckCircle2 size={14} />
        verified and stored in FarmFund
      </p>
    );
  }
  if (status === "pending") {
    return (
      <p className="text-xs text-amber-700 flex items-center gap-1 mt-3">
        <Clock size={14} />
        pending verification
      </p>
    );
  }
  return (
    <p className="text-xs text-gray-400 mt-3">Not yet scanned or verified</p>
  );
}

function ReceiptDetailPanel({ receipt }) {
  const receiptCardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  async function handleDownloadPdf() {
    if (!receiptCardRef.current || isGenerating) return;
    setIsGenerating(true);
    setDownloadError("");

    try {
      // Screenshots the actual styled receipt card (scale: 2 for crisp text,
      // not blurry when printed/zoomed), then embeds that image into a real
      // PDF file sized to match, and triggers the browser's download.
      const canvas = await html2canvas(receiptCardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      const imageData = canvas.toDataURL("image/png");

      const pdfWidth = canvas.width / 2; // divide back out the scale: 2 factor
      const pdfHeight = canvas.height / 2;
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
        unit: "pt",
        format: [pdfWidth, pdfHeight],
      });
      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${receipt.id}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setDownloadError("Couldn't generate the PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  if (!receipt) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center min-h-[420px] shadow-sm">
        <p className="text-gray-400 text-sm">
          Select a receipt to view details
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Receipt Detail</h3>
        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          {isGenerating ? "Generating…" : "PDF"}
        </button>
      </div>

      {downloadError && (
        <p className="mt-2 text-xs text-red-500">{downloadError}</p>
      )}

      <div
        ref={receiptCardRef}
        className="mt-4 bg-[#f9faf7] border border-gray-200 rounded-2xl p-6"
      >
        <div className="text-center">
          <p className="font-bold text-gray-900 tracking-wide">
            FARM RECEIPT
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{receipt.id}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-gray-400">Date</span>
          <span className="text-right text-gray-900">{receipt.date}</span>

          <span className="text-gray-400">Vendor</span>
          <span className="text-right text-gray-900">{receipt.vendor}</span>

          <span className="text-gray-400">Category</span>
          <span className="text-right text-gray-900">{receipt.category}</span>

          <span className="text-gray-400">Payment</span>
          <span className="text-right text-gray-900">{receipt.payment}</span>
        </div>

        <p className="mt-4 text-sm text-gray-700">{receipt.lineItem}</p>

        <div className="bg-[#4f7331] h-1 w-full my-4 rounded-full" />

        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">TOTAL</span>
          <span className="text-[#be8238] font-bold text-xl">
            {receipt.amount}
          </span>
        </div>
      </div>

      <VerificationFooter status={receipt.status} />
    </div>
  );
}

function NewReceiptModal({ onSave, onCancel }) {
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [payment, setPayment] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  function handleSave() {
    const numericAmount = parseFloat(String(amount).replace(/,/g, ""));
    if (!vendor.trim() || !numericAmount || numericAmount <= 0 || !date || !category || !payment) {
      setError("Please fill in all required fields with a valid amount.");
      return;
    }
    onSave({
      id: `RCP-2026-NEW-${Date.now()}`,
      vendor: vendor.trim(),
      date,
      amount: `₱${numericAmount.toLocaleString("en-US")}`,
      category,
      payment,
      lineItem: fileName ? `Attached: ${fileName}` : "Manually added receipt",
      status: "pending",
    });
  }

  function handleFiles(files) {
    if (files && files[0]) setFileName(files[0].name);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-900">New Receipt</h3>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Vendor / Supplier *
          </label>
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g., SL Agritech Corporation"
            className="bg-gray-100 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Amount (PHP) *
          </label>
          <div className="bg-gray-100 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
            <span className="text-gray-500 font-medium">PHP</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-transparent w-full focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-gray-100 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-gray-100 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            >
              <option value="" disabled>
                Select...
              </option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Payment Method *
          </label>
          <select
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            className="bg-gray-100 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          >
            <option value="" disabled>
              Select...
            </option>
            {PAYMENT_METHOD_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Upload zone — visual drag/drop + file picker, no real upload since there's no backend yet */}
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

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-[#4f7331] text-white hover:bg-[#3f6238] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DigitalReceipts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isNewReceiptOpen, setIsNewReceiptOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getReceiptsData().then((result) => {
      if (!cancelled) {
        setData(result);
        setSelectedReceipt(result.receipts[0] ?? null);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSaveReceipt(newReceipt) {
    setData((prev) => ({ ...prev, receipts: [newReceipt, ...prev.receipts] }));
    setSelectedReceipt(newReceipt);
    setIsNewReceiptOpen(false);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Digital Receipts</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading receipts…
        </div>
      </div>
    );
  }

  const filteredReceipts = data.receipts.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.vendor.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header + New Receipt button */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Digital Receipts
          </h2>
          <p className="mt-1 text-gray-500">
            Record and store receipts for all farm transactions
          </p>
        </div>
        <button
          onClick={() => setIsNewReceiptOpen(true)}
          className="mt-12 bg-[#3f6238] hover:bg-[#34512e] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
        >
          <Plus size={16} /> New Receipt
        </button>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Total Receipts"
          value={data.kpis.totalReceipts}
          valueColor="text-gray-900"
          subtext="This year"
        />
        <KPICard
          label="Verified"
          value={data.kpis.verified}
          valueColor="text-[#4f7331]"
          subtext={`This ${data.kpis.verifiedRate} rate`}
        />
        <KPICard
          label="Total Value"
          value={data.kpis.totalValue}
          valueColor="text-[#be8238]"
          subtext="Documented"
        />
      </div>

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: search + list */}
        <div>
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Receipts..."
              className="bg-[#f3f4f0] border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>

          <div className="space-y-3">
            {filteredReceipts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No receipts match your search.
              </p>
            ) : (
              filteredReceipts.map((receipt) => (
                <ReceiptListItem
                  key={receipt.id}
                  receipt={receipt}
                  isSelected={selectedReceipt?.id === receipt.id}
                  onSelect={() => setSelectedReceipt(receipt)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: detail viewer */}
        <ReceiptDetailPanel receipt={selectedReceipt} />
      </div>

      {isNewReceiptOpen && (
        <NewReceiptModal
          onSave={handleSaveReceipt}
          onCancel={() => setIsNewReceiptOpen(false)}
        />
      )}
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { Search, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { authedRequest } from "../../api";

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

function KPICard({ label, value, valueColor, subtext }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{subtext}</p>
    </div>
  );
}

function ReceiptListItem({ record, isSelected, onSelect }) {
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
            {record.description || "Untitled transaction"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <p className={`font-bold text-sm shrink-0 ${record.type === "income" ? "text-green-700" : "text-gray-900"}`}>
          {peso(record.amount)}
        </p>
      </div>
    </button>
  );
}

// The receipt IS the PDF, generated on the spot from the transaction's own
// real data — no upload, no external file, nothing that can go missing.
// Every transaction can produce one, since every transaction already has
// everything a receipt needs.
function ReceiptDetailPanel({ record, onSaveNote }) {
  const receiptCardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [noteInput, setNoteInput] = useState(record?.receiptMetadata?.notes || "");
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState("");

  useEffect(() => {
    setNoteInput(record?.receiptMetadata?.notes || "");
    setNoteError("");
  }, [record?._id]);

  async function handleDownloadPdf() {
    if (!receiptCardRef.current || isGenerating) return;
    setIsGenerating(true);
    setDownloadError("");
    try {
      const canvas = await html2canvas(receiptCardRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imageData = canvas.toDataURL("image/png");
      const pdfWidth = canvas.width / 2;
      const pdfHeight = canvas.height / 2;
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
        unit: "pt",
        format: [pdfWidth, pdfHeight],
      });
      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${record._id}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setDownloadError("Couldn't generate the PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveNote() {
    setSavingNote(true);
    setNoteError("");
    try {
      await onSaveNote(record._id, noteInput.trim());
    } catch (err) {
      setNoteError(err.message || "Couldn't save the note.");
    } finally {
      setSavingNote(false);
    }
  }

  if (!record) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center min-h-[420px] shadow-sm">
        <p className="text-gray-400 text-sm">Select a transaction to view its receipt</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Receipt</h3>
        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          {isGenerating ? "Generating…" : "Download PDF"}
        </button>
      </div>

      {downloadError && <p className="mt-2 text-xs text-red-500">{downloadError}</p>}

      <div ref={receiptCardRef} className="mt-4 bg-[#f9faf7] border border-gray-200 rounded-2xl p-6">
        <div className="text-center">
          <p className="font-bold text-gray-900 tracking-wide">FARM RECEIPT</p>
          <p className="text-xs text-gray-400 mt-0.5">{record._id}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-gray-400">Date</span>
          <span className="text-right text-gray-900">
            {new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>

          <span className="text-gray-400">Description</span>
          <span className="text-right text-gray-900">{record.description || "—"}</span>

          <span className="text-gray-400">Category</span>
          <span className="text-right text-gray-900">{record.category?.name || "—"}</span>

          <span className="text-gray-400">Payment</span>
          <span className="text-right text-gray-900">{record.paymentMethod || "—"}</span>
        </div>

        {record.receiptMetadata?.notes && (
          <p className="mt-4 text-sm text-gray-700">{record.receiptMetadata.notes}</p>
        )}

        <div className="bg-[#4f7331] h-1 w-full my-4 rounded-full" />

        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">TOTAL</span>
          <span className="text-[#be8238] font-bold text-xl">{peso(record.amount)}</span>
        </div>
      </div>

      {/* Optional note — not required to generate a receipt, just extra
          context you can attach (e.g. "paid in cash, vendor gave a
          handwritten receipt"). Saved directly to this transaction. */}
      <div className="mt-4">
        <label className="text-xs font-medium text-gray-500 block mb-1">Note (optional)</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Add a note about this receipt..."
            className="bg-gray-100 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
          <button
            onClick={handleSaveNote}
            disabled={savingNote || noteInput.trim() === (record.receiptMetadata?.notes || "")}
            className="text-xs font-medium text-[#4f7331] hover:underline disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {savingNote ? "Saving…" : "Save"}
          </button>
        </div>
        {noteError && <p className="mt-1 text-xs text-red-500">{noteError}</p>}
      </div>
    </div>
  );
}

function FarmSetupPrompt() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center max-w-md mx-auto">
      <h3 className="font-bold text-gray-900 text-lg">No farm set up yet</h3>
      <p className="mt-2 text-sm text-gray-500">
        Receipts are generated from your transactions, which need a farm first. Set one up from Income & Expenses to get started.
      </p>
    </div>
  );
}

export default function DigitalReceipts() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hasFarm, setHasFarm] = useState(true);
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const farms = await authedRequest("/api/farms");
        if (cancelled) return;
        if (farms.length === 0) {
          setHasFarm(false);
          setLoading(false);
          return;
        }
        const data = await authedRequest(`/api/financial-records?farm=${farms[0]._id}&limit=100`);
        if (cancelled) return;
        setRecords(data);
        setSelectedId(data[0]?._id ?? null);
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

  async function handleSaveNote(recordId, note) {
    const updated = await authedRequest(`/api/financial-records/${recordId}`, {
      method: "PATCH",
      body: { receiptMetadata: { notes: note || undefined } },
    });
    setRecords((prev) => prev.map((r) => (r._id === recordId ? updated : r)));
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Digital Receipts</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Digital Receipts</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
          {loadError}
        </div>
      </div>
    );
  }

  if (!hasFarm) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Digital Receipts</h2>
        <p className="mt-1 text-gray-500 mb-8">Generate and download receipts for your farm transactions</p>
        <FarmSetupPrompt />
      </div>
    );
  }

  const selectedRecord = records.find((r) => r._id === selectedId) || null;
  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      (r.description || "").toLowerCase().includes(q) ||
      (r.category?.name || "").toLowerCase().includes(q)
    );
  });
  const totalValue = records.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Digital Receipts</h2>
        <p className="mt-1 text-gray-500">Generate and download receipts for your farm transactions</p>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard label="Total Transactions" value={records.length} valueColor="text-gray-900" subtext="Each one is receipt-ready" />
        <KPICard label="Total Value" value={peso(totalValue)} valueColor="text-[#be8238]" subtext="Documented" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Transactions..."
              className="bg-[#f3f4f0] border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>

          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6 flex flex-col items-center gap-2">
                {records.length === 0 ? (
                  <>
                    <FileText size={24} className="text-gray-300" />
                    No transactions yet. Add one in Income & Expenses to generate its first receipt.
                  </>
                ) : (
                  "No transactions match your search."
                )}
              </p>
            ) : (
              filteredRecords.map((record) => (
                <ReceiptListItem
                  key={record._id}
                  record={record}
                  isSelected={selectedId === record._id}
                  onSelect={() => setSelectedId(record._id)}
                />
              ))
            )}
          </div>
        </div>

        <ReceiptDetailPanel record={selectedRecord} onSaveNote={handleSaveNote} />
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Search, CheckCircle2, XCircle, Eye, Clock, X } from "lucide-react";
import { getBorrowerData, updateDocumentReview, STATUS_FILTERS } from "../../mocks/organization/orgBorrowers.mock";

function KPICard({ label, value, valueColor }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

// Table badge literally says "Active" for "current" status per the spec —
// the underlying filter value/detail-panel label both say "Current".
const STATUS_BADGE = {
  current: { label: "Active", className: "bg-green-100 text-green-800" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
  "fully-paid": { label: "Fully paid", className: "bg-gray-100 text-gray-600" },
};

const STATUS_DETAIL_LABEL = {
  current: "Current",
  overdue: "Overdue",
  "fully-paid": "Fully paid",
};

function ProgressBar({ percent, isFullyPaid }) {
  return (
    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${isFullyPaid || percent > 50 ? "bg-green-500" : "bg-red-500"}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

function BorrowerRow({ borrower, isSelected, onSelect }) {
  const remaining = borrower.totalDebt - borrower.paid;
  const percent = (borrower.paid / borrower.totalDebt) * 100;
  const badge = STATUS_BADGE[borrower.status];

  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer border-t border-gray-50 transition-colors ${
        isSelected ? "bg-[#f4f8f3]" : "hover:bg-gray-50"
      }`}
    >
      <td className="py-3 pr-4">
        <p className="font-bold text-gray-900 text-sm">{borrower.name}</p>
        <p className="text-xs text-gray-400">{borrower.farmName}</p>
      </td>
      <td className="py-3 pr-4 text-gray-600 text-sm">{borrower.contact}</td>
      <td className="py-3 pr-4 text-gray-900 text-sm font-medium">
        ₱{borrower.totalDebt.toLocaleString()}
      </td>
      <td className="py-3 pr-4 text-green-700 text-sm font-medium">
        ₱{borrower.paid.toLocaleString()}
      </td>
      <td className="py-3 pr-4 text-gray-900 text-sm font-medium">
        ₱{remaining.toLocaleString()}
      </td>
      <td className="py-3 pr-4">
        <ProgressBar percent={percent} isFullyPaid={borrower.status === "fully-paid"} />
      </td>
      <td className="py-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      </td>
    </tr>
  );
}

function PaymentHistoryModal({ borrower, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {borrower.name} · {borrower.farmName}
        </p>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {borrower.paymentHistory.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between border border-gray-100 rounded-lg p-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{p.date}</p>
                <p className="text-xs text-gray-400">{p.method}</p>
              </div>
              <p className="text-sm font-bold text-green-700">
                ₱{p.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">
            Total Paid
          </span>
          <span className="text-sm font-bold text-green-700">
            ₱{borrower.paid.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function SelectedBorrowerSummary({ borrower, onViewHistory }) {
  if (!borrower) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 text-sm min-h-[200px]">
        Select a borrower to view details
      </div>
    );
  }

  const remaining = borrower.totalDebt - borrower.paid;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="font-bold text-gray-900">{borrower.name}</p>
      <p className="text-xs text-gray-400">
        {borrower.farmName} · {borrower.location}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider">
            Total Debt
          </p>
          <p className="font-bold text-gray-900">
            ₱{borrower.totalDebt.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider">Paid</p>
          <p className="font-bold text-green-700">
            ₱{borrower.paid.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider">
            Remaining
          </p>
          <p className="font-bold text-gray-900">
            ₱{remaining.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider">
            Status
          </p>
          <p className="font-bold text-gray-900">
            {STATUS_DETAIL_LABEL[borrower.status]}
          </p>
        </div>
      </div>

      <button
        onClick={onViewHistory}
        className="mt-4 w-full text-center text-sm font-semibold text-green-600 hover:underline"
      >
        View full payment history
      </button>
    </div>
  );
}

function DocumentRow({ doc, onApprove, onReject, onView }) {
  return (
    <div className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
        <p className="text-xs text-gray-400">
          {doc.id} · {doc.uploaded}
        </p>
      </div>

      {doc.reviewStatus === "unreviewed" && (
        <div className="flex items-center gap-2">
          <button
            onClick={onApprove}
            className="text-green-600 hover:text-green-700"
            aria-label="Approve"
          >
            <CheckCircle2 size={18} />
          </button>
          <button
            onClick={onReject}
            className="text-red-500 hover:text-red-600"
            aria-label="Reject"
          >
            <XCircle size={18} />
          </button>
          <button onClick={onView} className="text-gray-400 hover:text-gray-600" aria-label="View">
            <Eye size={18} />
          </button>
        </div>
      )}

      {doc.reviewStatus === "verified" && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={12} />
            Verified
          </span>
          <button onClick={onView} className="text-gray-400 hover:text-gray-600" aria-label="View">
            <Eye size={18} />
          </button>
        </div>
      )}

      {doc.reviewStatus === "pending" && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
            <Clock size={12} />
            Pending review
          </span>
          <button onClick={onView} className="text-gray-400 hover:text-gray-600" aria-label="View">
            <Eye size={18} />
          </button>
        </div>
      )}

      {doc.reviewStatus === "rejected" && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
            <XCircle size={12} />
            Rejected
          </span>
          <button onClick={onView} className="text-gray-400 hover:text-gray-600" aria-label="View">
            <Eye size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

const DOC_STATUS_DISPLAY = {
  unreviewed: { label: "Awaiting review", className: "bg-gray-100 text-gray-600" },
  verified: { label: "Verified", className: "bg-green-100 text-green-800" },
  pending: { label: "Pending review", className: "bg-amber-100 text-amber-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
};

function DocumentViewModal({ doc, onClose }) {
  const status = DOC_STATUS_DISPLAY[doc.reviewStatus];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-gray-900">{doc.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          {doc.id} · {doc.uploaded}
        </p>

        {/* No real file exists to display — no upload/storage backend yet,
            same honest placeholder pattern used on Digital Receipts. */}
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl h-48 flex items-center justify-center">
          <p className="text-xs text-gray-400 text-center px-6">
            No document preview available yet — file storage isn't connected
            to a backend.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">Review status</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function SubmittedDocuments({ borrower, onReviewChange, onViewDoc }) {
  if (!borrower) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 text-sm min-h-[200px]">
        Select a borrower to view documents
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-3">Submitted Documents</h3>
      <div className="space-y-2">
        {borrower.documents.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            onApprove={() => onReviewChange(doc.id, "verified")}
            onReject={() => onReviewChange(doc.id, "rejected")}
            onView={() => onViewDoc(doc)}
          />
        ))}
      </div>
    </div>
  );
}

export default function BorrowerManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getBorrowerData().then((result) => {
      if (!cancelled) {
        setData(result);
        setSelectedBorrowerId(result.borrowers[0]?.id ?? null);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleReviewChange(docId, newStatus) {
    setData((prev) => ({
      ...prev,
      borrowers: prev.borrowers.map((b) => ({
        ...b,
        documents: b.documents.map((d) =>
          d.id === docId ? { ...d, reviewStatus: newStatus } : d
        ),
      })),
    }));
    updateDocumentReview(); // simulated network call
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Borrower & Debt Management
        </h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading borrowers…
        </div>
      </div>
    );
  }

  const filterKeyMap = {
    All: null,
    Current: "current",
    Overdue: "overdue",
    "Fully paid": "fully-paid",
  };

  const filteredBorrowers = data.borrowers.filter((b) => {
    const matchesStatus =
      statusFilter === "All" || b.status === filterKeyMap[statusFilter];
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const selectedBorrower = data.borrowers.find((b) => b.id === selectedBorrowerId);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">
        Borrower & Debt Management
      </h2>
      <p className="mt-1 text-gray-500">
        Farmers with loans or debts — total debt, balance, paid, and status
        for each
      </p>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="TOTAL BORROWERS" value={data.kpis.totalBorrowers} valueColor="text-gray-900" />
        <KPICard label="TOTAL DEBT HELD" value={data.kpis.totalDebtHeld} valueColor="text-[#be8238]" />
        <KPICard label="TOTAL PAID SO FAR" value={data.kpis.totalPaid} valueColor="text-[#4f7331]" />
        <KPICard label="OVERDUE BORROWERS" value={data.kpis.overdueBorrowers} valueColor="text-red-600" />
      </div>

      {/* Table panel */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search borrowers by name or ID..."
              className="bg-[#f3f4f0] border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>
          <div className="flex gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === filter
                    ? "bg-[#2d4027] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="pb-2 font-semibold">Borrower</th>
                <th className="pb-2 font-semibold">Contact</th>
                <th className="pb-2 font-semibold">Total Debt</th>
                <th className="pb-2 font-semibold">Paid</th>
                <th className="pb-2 font-semibold">Remaining</th>
                <th className="pb-2 font-semibold">Progress</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBorrowers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                    No borrowers match your search/filter.
                  </td>
                </tr>
              ) : (
                filteredBorrowers.map((b) => (
                  <BorrowerRow
                    key={b.id}
                    borrower={b}
                    isSelected={selectedBorrowerId === b.id}
                    onSelect={() => setSelectedBorrowerId(b.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom detail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SelectedBorrowerSummary
          borrower={selectedBorrower}
          onViewHistory={() => setIsHistoryOpen(true)}
        />
        <SubmittedDocuments
          borrower={selectedBorrower}
          onReviewChange={handleReviewChange}
          onViewDoc={setViewingDoc}
        />
      </div>

      {isHistoryOpen && selectedBorrower && (
        <PaymentHistoryModal
          borrower={selectedBorrower}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}

      {viewingDoc && (
        <DocumentViewModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
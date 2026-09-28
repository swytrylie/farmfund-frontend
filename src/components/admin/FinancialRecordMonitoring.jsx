import { useState, useEffect } from "react";
import { Info, X, CheckCircle2 } from "lucide-react";
import {
  getFinancialMonitoring,
  submitAccessRequest,
} from "../../mocks/admin/adminFinancialMonitoring.mock";

function MetricCard({ label, value, valueColor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm border-l-4 border-l-[#4d6b41]">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className={`text-3xl font-extrabold ${valueColor}`}>{value}</p>
    </div>
  );
}

function AccessBadge({ status, caseRef }) {
  if (status === "authorized") {
    return (
      <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-xs font-semibold">
        Authorized - {caseRef}
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="bg-[#fff8e1] text-[#b8860b] px-3 py-1 rounded-full text-xs font-semibold">
        Pending - {caseRef}
      </span>
    );
  }
  return (
    <span className="bg-[#fbe9e7] text-[#c62828] px-3 py-1 rounded-full text-xs font-semibold">
      Not authorized
    </span>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2d4027] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

function RequestAccessModal({ farmer, onSubmit, onCancel }) {
  const [reason, setReason] = useState("");
  const [caseRef, setCaseRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!reason.trim()) {
      setError("A reason for access is required.");
      return;
    }
    onSubmit({ farmer, reason: reason.trim(), caseRef: caseRef.trim(), notes: notes.trim() });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Request Individual Record Access
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Access requests are audited and logged with your admin account.
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Farmer
            </label>
            <div className="bg-[#f4f4f4] rounded-xl px-4 py-3 text-sm font-medium text-gray-800">
              {farmer.farmer}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Reason for Access *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              className={`bg-[#f4f4f4] border rounded-xl px-4 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] ${
                error ? "border-red-400" : "border-gray-200"
              }`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Case / Reference Number
            </label>
            <input
              type="text"
              value={caseRef}
              onChange={(e) => setCaseRef(e.target.value)}
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Briefly describe why this access is needed...."
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl p-3 text-sm text-gray-800 w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewRecordModal({ record, onClose }) {
  const fields = [
    { label: "Loan ID", value: record.record.loanId },
    { label: "Loan Type", value: record.record.loanType },
    { label: "Principal", value: record.record.principal, color: "text-gray-900" },
    { label: "Outstanding", value: record.record.outstanding, color: "text-red-600" },
    { label: "Total Paid", value: record.record.totalPaid, color: "text-[#2e7d32]" },
    { label: "Status", value: record.record.status, color: "text-red-600" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Financial Record</h3>
            <p className="text-xs text-gray-500 mb-1">
              {record.farmer} · {record.cooperative}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Access authorized under {record.caseRef}. This view is logged
              to Audit Logs.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {f.label}
              </p>
              <div className="bg-[#f4f4f4] rounded-xl px-4 py-3 text-sm font-medium">
                <span className={f.color || "text-gray-800"}>{f.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end mt-6">
          <button
            onClick={onClose}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FinancialRecordMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestingFarmer, setRequestingFarmer] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getFinancialMonitoring().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmitRequest({ farmer, reason, caseRef }) {
    await submitAccessRequest();
    setData((prev) => ({
      ...prev,
      recordAccess: prev.recordAccess.map((r) =>
        r.id === farmer.id
          ? { ...r, status: "pending", caseRef: caseRef || reason }
          : r
      ),
    }));
    setToastMessage(`Access request submitted for ${farmer.farmer}`);
    setRequestingFarmer(null);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Financial Record Monitoring</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading…
        </div>
      </div>
    );
  }

  const q = searchQuery.toLowerCase();
  const filteredAccess = data.recordAccess.filter((r) =>
    r.farmer.toLowerCase().includes(q)
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Financial Record Monitoring</h2>
      <p className="text-sm text-gray-500 mt-1">
        System-level financial activity across the platform
      </p>

      <div className="mt-4 bg-[#f4f7f4] border border-[#d2dfd0] rounded-2xl p-4 mb-6 text-xs text-gray-600 flex items-start gap-2">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>
          System-level totals are shown by default. A specific farmer's
          individual records (income, expenses, budgets, receipts) require
          elevated, role-based authorization — see "Individual Record
          Access" below.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Transactions Logged Today"
          value={data.metrics.transactionsToday}
          valueColor="text-gray-900"
        />
        <MetricCard
          label="Digital Receipts Uploaded"
          value={data.metrics.receiptsUploaded}
          valueColor="text-gray-900"
        />
        <MetricCard
          label="Total System Loan Volume"
          value={data.metrics.totalLoanVolume}
          valueColor="text-[#2d4027]"
        />
        <MetricCard
          label="AI Advisor Sessions"
          value={data.metrics.aiAdvisorSessions}
          valueColor="text-gray-900"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Feature Adoption</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="pb-2 font-semibold">Feature</th>
              <th className="pb-2 font-semibold">Active Users</th>
              <th className="pb-2 font-semibold">Adoption Rate</th>
            </tr>
          </thead>
          <tbody>
            {data.featureAdoption.map((f) => (
              <tr key={f.feature} className="border-t border-gray-50">
                <td className="py-3 pr-4 font-medium text-gray-900">{f.feature}</td>
                <td className="py-3 pr-4 text-gray-700">{f.activeUsers.toLocaleString()}</td>
                <td className="py-3 text-gray-700">{f.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">Individual Record Access</h3>
        <p className="text-xs text-gray-500 mb-4">
          Viewing a specific farmer's financial detail requires an access
          request with a stated reason. This is logged to Audit Logs and,
          where applicable, notifies the farmer's cooperative.
        </p>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search farmer by name to request access..."
          className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 mb-6 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
        />

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="pb-2 font-semibold">Farmer</th>
              <th className="pb-2 font-semibold">Cooperative</th>
              <th className="pb-2 font-semibold">Access Level</th>
              <th className="pb-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccess.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                  No farmers match your search.
                </td>
              </tr>
            ) : (
              filteredAccess.map((r) => (
                <tr key={r.id} className="border-t border-gray-50">
                  <td className="py-3 pr-4 font-semibold text-gray-900">{r.farmer}</td>
                  <td className="py-3 pr-4 text-gray-700">{r.cooperative}</td>
                  <td className="py-3 pr-4">
                    <AccessBadge status={r.status} caseRef={r.caseRef} />
                  </td>
                  <td className="py-3">
                    {r.status === "authorized" ? (
                      <button
                        onClick={() => setViewingRecord(r)}
                        className="border border-[#4d6b41] text-[#2d4027] hover:bg-[#f4f7f4] px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                      >
                        View record
                      </button>
                    ) : r.status === "pending" ? (
                      <button
                        disabled
                        className="border border-gray-200 text-gray-400 px-4 py-1.5 rounded-xl text-xs font-medium cursor-not-allowed"
                      >
                        Request pending
                      </button>
                    ) : (
                      <button
                        onClick={() => setRequestingFarmer(r)}
                        className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors"
                      >
                        Request access
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {requestingFarmer && (
        <RequestAccessModal
          farmer={requestingFarmer}
          onSubmit={handleSubmitRequest}
          onCancel={() => setRequestingFarmer(null)}
        />
      )}

      {viewingRecord && (
        <ViewRecordModal record={viewingRecord} onClose={() => setViewingRecord(null)} />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}
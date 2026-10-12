import { useState, useEffect, useRef, useCallback } from "react";
import { Info, X, CheckCircle2, Search } from "lucide-react";
import { authedRequest } from "../../api";
import { formatDate, formatDateTime, messageFrom } from "../../lib/adminUsers";

const PAGE_SIZE = 10;

const peso = (n) =>
  typeof n === "number" && Number.isFinite(n)
    ? `${n < 0 ? "-" : ""}₱${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

// The server explains exactly what was wrong ("The reason must be 3–300
// characters"); show that rather than a generic failure.
const detailMessage = (err, fallback) =>
  (Array.isArray(err?.details) && err.details[0]?.message) || messageFrom(err, fallback);

const getOverview = () => authedRequest("/api/admin/financial/overview");
const listFarmers = ({ search, page, limit }) => {
  const q = new URLSearchParams();
  if (search) q.set("search", search);
  q.set("page", String(page));
  q.set("limit", String(limit));
  return authedRequest(`/api/admin/financial/farmers?${q.toString()}`);
};
const requestAccess = (id, body) => authedRequest(`/api/admin/financial/farmers/${id}/access`, { method: "POST", body });
const getRecords = (id) => authedRequest(`/api/admin/financial/farmers/${id}/records`);

function MetricCard({ label, value, valueColor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm border-l-4 border-l-[#4d6b41]">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-extrabold ${valueColor}`}>{value}</p>
    </div>
  );
}

function AccessBadge({ access }) {
  if (access && access.status === "authorized") {
    return (
      <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
        Authorized{access.caseRef ? ` - ${access.caseRef}` : ""} · until {formatDateTime(access.expiresAt)}
      </span>
    );
  }
  return (
    <span className="bg-[#fbe9e7] text-[#c62828] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
      Not authorized
    </span>
  );
}

function Toast({ message, tone = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, tone === "error" ? 6000 : 3000);
    return () => clearTimeout(timer);
  }, [onClose, tone]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${
        tone === "error" ? "bg-[#c24141]" : "bg-[#2d4027]"
      }`}
    >
      {tone === "error" ? <Info size={16} /> : <CheckCircle2 size={16} />}
      {message}
    </div>
  );
}

function RequestAccessModal({ farmer, busy, error, onSubmit, onCancel }) {
  const [reason, setReason] = useState("");
  const [caseRef, setCaseRef] = useState("");
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState("");

  function handleSubmit() {
    if (busy) return;
    const r = reason.trim();
    if (r.length < 3) {
      setLocalError("A reason for access is required (at least 3 characters).");
      return;
    }
    onSubmit({ reason: r, caseRef: caseRef.trim(), notes: notes.trim() });
  }

  const shownError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Request Individual Record Access</h3>
            <p className="text-xs text-gray-500 mb-6">
              Access lasts 24 hours and is logged to Audit Logs with your admin account.
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">Farmer</label>
            <div className="bg-[#f4f4f4] rounded-xl px-4 py-3 text-sm font-medium text-gray-800">
              {farmer.farmer}
              <span className="block text-xs font-normal text-gray-400">{farmer.email}</span>
            </div>
          </div>

          <div>
            <label htmlFor="access-reason" className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Reason for Access *
            </label>
            <input
              id="access-reason"
              type="text"
              value={reason}
              maxLength={300}
              onChange={(e) => {
                setReason(e.target.value);
                setLocalError("");
              }}
              className={`bg-[#f4f4f4] border rounded-xl px-4 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] ${
                shownError ? "border-red-400" : "border-gray-200"
              }`}
            />
            {shownError && <p className="mt-1 text-xs text-red-500">{shownError}</p>}
          </div>

          <div>
            <label htmlFor="access-case" className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Case / Reference Number
            </label>
            <input
              id="access-case"
              type="text"
              value={caseRef}
              maxLength={60}
              onChange={(e) => setCaseRef(e.target.value)}
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]"
            />
          </div>

          <div>
            <label htmlFor="access-notes" className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Additional Notes
            </label>
            <textarea
              id="access-notes"
              value={notes}
              maxLength={500}
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
            disabled={busy}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewRecordModal({ farmer, state, onClose }) {
  const { loading, error, data } = state;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Financial Record</h3>
            <p className="text-xs text-gray-500 mb-1">
              {farmer.farmer}
              {data && data.farm ? ` · ${data.farm.name}` : ""}
            </p>
            {data && (
              <p className="text-xs text-gray-400 mb-6">
                Access authorized{data.access.caseRef ? ` under ${data.access.caseRef}` : ""} until{" "}
                {formatDateTime(data.access.expiresAt)}. This view is logged to Audit Logs.
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {loading && <p className="py-8 text-center text-sm text-gray-400">Loading records…</p>}
        {error && <p className="py-6 text-center text-sm text-[#c24141] font-medium">{error}</p>}

        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Income", value: peso(data.summary.income), color: "text-[#2e7d32]" },
                { label: "Expenses", value: peso(data.summary.expense), color: "text-red-600" },
                { label: "Net", value: peso(data.summary.net), color: data.summary.net < 0 ? "text-red-600" : "text-gray-900" },
                { label: "Records", value: String(data.summary.recordCount), color: "text-gray-900" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{s.label}</p>
                  <div className="bg-[#f4f4f4] rounded-xl px-3 py-3 text-sm font-medium">
                    <span className={s.color}>{s.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">Latest transactions</h4>
              {data.records.length === 0 ? (
                <p className="text-sm text-gray-400">No transactions recorded.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                      <th className="pb-2 font-semibold">Date</th>
                      <th className="pb-2 font-semibold">Category</th>
                      <th className="pb-2 font-semibold">Type</th>
                      <th className="pb-2 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((r) => (
                      <tr key={r.id} className="border-t border-gray-50 align-top">
                        <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">{formatDate(r.date)}</td>
                        <td className="py-2 pr-3 text-gray-800">
                          {r.category}
                          {r.description && <span className="block text-xs text-gray-400">{r.description}</span>}
                        </td>
                        <td className={`py-2 pr-3 ${r.type === "income" ? "text-[#2e7d32]" : "text-red-600"}`}>
                          {r.type === "income" ? "Income" : "Expense"}
                        </td>
                        <td className="py-2 text-right text-gray-800 whitespace-nowrap">{peso(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">Loans</h4>
              {data.loans.length === 0 ? (
                <p className="text-sm text-gray-400">No loans.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                      <th className="pb-2 font-semibold">Cooperative</th>
                      <th className="pb-2 font-semibold text-right">Principal</th>
                      <th className="pb-2 font-semibold text-right">Paid</th>
                      <th className="pb-2 font-semibold pl-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.loans.map((l) => (
                      <tr key={l.id} className="border-t border-gray-50">
                        <td className="py-2 pr-3 text-gray-800">{l.cooperative}</td>
                        <td className="py-2 text-right text-gray-800 whitespace-nowrap">{peso(l.principal)}</td>
                        <td className="py-2 text-right text-[#2e7d32] whitespace-nowrap">{peso(l.paid)}</td>
                        <td className="py-2 pl-3 text-gray-700 capitalize">{String(l.status).replace(/_/g, " ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

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

export default function FinancialRecordMonitoring({ onSignOut }) {
  // ---- system-level totals ----
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState("");
  const overviewLatest = useRef(0);

  const loadOverview = useCallback(async () => {
    const id = ++overviewLatest.current;
    setOverviewError("");
    try {
      const result = await getOverview();
      if (id === overviewLatest.current) setOverview(result);
    } catch (err) {
      if (id !== overviewLatest.current) return;
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      setOverviewError(messageFrom(err, "Could not load the platform totals."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // ---- farmers table ----
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ farmers: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);
  const appliedSearch = useRef("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = search.trim();
      if (next === appliedSearch.current) return;
      appliedSearch.current = next;
      setDebouncedSearch(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      const id = ++latest.current;
      if (!quiet) setLoading(true);
      setError("");
      try {
        const result = await listFarmers({ search: debouncedSearch, page, limit: PAGE_SIZE });
        if (id !== latest.current) return;
        setData(result);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        setError(messageFrom(err, "Could not load the farmers."));
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  // ---- request access / view record ----
  const [requestingFarmer, setRequestingFarmer] = useState(null);
  const [requestError, setRequestError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const requestingRef = useRef(false);
  const [viewing, setViewing] = useState(null); // { farmer, loading, error, data }
  const viewToken = useRef(0);
  const [toast, setToast] = useState(null);

  async function handleSubmitRequest(fields) {
    if (requestingRef.current || !requestingFarmer) return;
    requestingRef.current = true;
    setRequesting(true);
    setRequestError("");
    const farmer = requestingFarmer;
    const body = { reason: fields.reason };
    if (fields.caseRef) body.caseRef = fields.caseRef;
    if (fields.notes) body.notes = fields.notes;
    try {
      await requestAccess(farmer.id, body);
      setRequestingFarmer(null);
      setToast({ message: `Access granted for ${farmer.farmer} (24 hours)`, tone: "success" });
      load({ quiet: true });
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      if (err && err.status === 409) load({ quiet: true });
      setRequestError(detailMessage(err, "Could not grant access. Please try again."));
    } finally {
      requestingRef.current = false;
      setRequesting(false);
    }
  }

  async function handleView(farmer) {
    const token = ++viewToken.current;
    setViewing({ farmer, loading: true, error: "", data: null });
    try {
      const result = await getRecords(farmer.id);
      if (token !== viewToken.current) return;
      setViewing({ farmer, loading: false, error: "", data: result });
    } catch (err) {
      if (token !== viewToken.current) return;
      if (err && err.status === 401) {
        setViewing(null);
        onSignOut?.();
        return;
      }
      if (err && err.status === 403) load({ quiet: true }); // access ran out: the table should say so
      setViewing({ farmer, loading: false, error: messageFrom(err, "Could not load the records."), data: null });
    }
  }

  function closeView() {
    viewToken.current += 1;
    setViewing(null);
  }

  const { farmers, total, pages } = data;
  const firstShown = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, total);
  const m = overview && overview.metrics;
  const card = (v, format = (x) => String(x)) => (m && v !== undefined && v !== null ? format(v) : "—");

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Financial Record Monitoring</h2>
      <p className="text-sm text-gray-500 mt-1">System-level financial activity across the platform</p>

      <div className="mt-4 bg-[#f4f7f4] border border-[#d2dfd0] rounded-2xl p-4 mb-6 text-xs text-gray-600 flex items-start gap-2">
        <Info size={14} className="shrink-0 mt-0.5" />
        <span>
          System-level totals are shown by default. A specific farmer's individual records (income, expenses, loans)
          need a stated reason, last 24 hours, and are logged to Audit Logs — see "Individual Record Access" below.
        </span>
      </div>

      {overviewError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-sm text-red-600">
          {overviewError}{" "}
          <button onClick={loadOverview} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Transactions Logged Today" value={card(m && m.transactionsToday, (x) => x.toLocaleString("en-US"))} valueColor="text-gray-900" />
        <MetricCard label="Income Recorded This Month" value={card(m && m.incomeThisMonth, peso)} valueColor="text-[#2e7d32]" />
        <MetricCard label="Expenses Recorded This Month" value={card(m && m.expensesThisMonth, peso)} valueColor="text-gray-900" />
        <MetricCard label="Total System Loan Volume" value={card(m && m.totalLoanVolume, peso)} valueColor="text-[#2d4027]" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-gray-900">Feature Adoption</h3>
        <p className="text-xs text-gray-500 mb-4">
          Farmers who have used each feature, out of {overview ? overview.totalFarmers.toLocaleString("en-US") : "—"} farmers with a registered farm.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="pb-2 font-semibold">Feature</th>
              <th className="pb-2 font-semibold">Active Users</th>
              <th className="pb-2 font-semibold">Adoption Rate</th>
            </tr>
          </thead>
          <tbody>
            {!overview ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-400 text-sm">
                  {overviewError ? "—" : "Loading…"}
                </td>
              </tr>
            ) : (
              overview.featureAdoption.map((f) => (
                <tr key={f.feature} className="border-t border-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-900">{f.feature}</td>
                  <td className="py-3 pr-4 text-gray-700">{f.activeUsers.toLocaleString("en-US")}</td>
                  <td className="py-3 text-gray-700">{f.ratePercent === null ? "—" : `${f.ratePercent}%`}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">Individual Record Access</h3>
        <p className="text-xs text-gray-500 mb-4">
          Viewing a specific farmer's financial detail requires an access request with a stated reason. Access lasts 24
          hours and every request and every view is logged to Audit Logs.
        </p>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farmer by name to request access..."
            aria-label="Search farmers"
            className="bg-[#f4f4f4] border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>

        <div className="overflow-x-auto">
          {error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#c24141] font-medium">{error}</p>
              <button
                onClick={() => load()}
                className="mt-4 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Try again
              </button>
            </div>
          ) : (
            <table className={`w-full text-sm transition-opacity ${loading && farmers.length > 0 ? "opacity-50" : ""}`}>
              <thead>
                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Farmer</th>
                  <th className="pb-2 font-semibold">Cooperative</th>
                  <th className="pb-2 font-semibold">Access Level</th>
                  <th className="pb-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && farmers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">Loading farmers…</td>
                  </tr>
                ) : farmers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                      {debouncedSearch ? "No farmers match your search." : "No farmers have registered a farm yet."}
                    </td>
                  </tr>
                ) : (
                  farmers.map((r) => (
                    <tr key={r.id} className="border-t border-gray-50">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-gray-900">{r.farmer}</p>
                        <p className="text-xs text-gray-400">{r.farm}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {r.cooperatives.length > 0 ? (
                          r.cooperatives.join(", ")
                        ) : (
                          <span className="text-xs italic text-gray-400">— No lender yet</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <AccessBadge access={r.access} />
                      </td>
                      <td className="py-3">
                        {r.access.status === "authorized" ? (
                          <button
                            onClick={() => handleView(r)}
                            aria-label={`View record of ${r.farmer}`}
                            className="border border-[#4d6b41] text-[#2d4027] hover:bg-[#f4f7f4] px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                          >
                            View record
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setRequestError("");
                              setRequestingFarmer(r);
                            }}
                            aria-label={`Request access for ${r.farmer}`}
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
          )}
        </div>

        {!error && total > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {firstShown}–{lastShown} of {total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span>
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pages}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {requestingFarmer && (
        <RequestAccessModal
          farmer={requestingFarmer}
          busy={requesting}
          error={requestError}
          onSubmit={handleSubmitRequest}
          onCancel={() => setRequestingFarmer(null)}
        />
      )}

      {viewing && <ViewRecordModal farmer={viewing.farmer} state={viewing} onClose={closeView} />}

      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
}
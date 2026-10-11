import { useState, useEffect, useRef, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import { authedRequest } from "../../api";
import { formatDateTime, messageFrom } from "../../lib/adminUsers";

const PAGE_SIZE = 20;

const CATEGORY_FILTERS = [
  { label: "All", value: "all" },
  { label: "Account actions", value: "accounts" },
  { label: "Cooperative actions", value: "cooperatives" },
];

// The server stores a person as "Name <email>". Show the name big and the email small.
function splitTarget(target) {
  const m = /^(.*?)\s*<([^<>]+)>$/.exec(target || "");
  return m ? { name: m[1] || m[2], email: m[1] ? m[2] : "" } : { name: target || "—", email: "" };
}

function listAuditLogs({ search, category, page, limit }) {
  const q = new URLSearchParams();
  if (search) q.set("search", search);
  if (category && category !== "all") q.set("category", category);
  q.set("page", String(page));
  q.set("limit", String(limit));
  return authedRequest(`/api/admin/audit-logs?${q.toString()}`);
}

export default function AuditLogs({ onSignOut }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ logs: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);
  const appliedSearch = useRef("");

  // Wait until the admin stops typing, then search. Only a real change of the
  // text sends the list back to page 1.
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
      const id = ++latest.current; // answers that arrive late are ignored
      if (!quiet) setLoading(true);
      setError("");
      try {
        const result = await listAuditLogs({ search: debouncedSearch, category, page, limit: PAGE_SIZE });
        if (id !== latest.current) return;
        setData(result);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        setError(messageFrom(err, "Could not load the audit logs."));
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, category, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const chooseCategory = (value) => {
    if (value === category) return;
    setCategory(value);
    setPage(1);
  };

  const { logs, total, pages } = data;
  const firstShown = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, total);
  const filtered = Boolean(debouncedSearch) || category !== "all";

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-sm text-gray-500 mt-1">
            Record of important actions taken by admins, newest first
          </p>
        </div>
        <button
          onClick={() => load({ quiet: true })}
          aria-label="Refresh logs"
          className="shrink-0 flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full min-w-0 md:flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by admin, action, or person/cooperative..."
            aria-label="Search audit logs"
            className="bg-[#f4f4f4] border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => chooseCategory(filter.value)}
              className={
                category === filter.value
                  ? "bg-[#38512f] text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
                  : "bg-[#f0f0f0] text-gray-700 hover:bg-gray-200 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
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
          <table className={`w-full transition-opacity ${loading && logs.length > 0 ? "opacity-50" : ""}`}>
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="pb-2 font-semibold">Admin</th>
                <th className="pb-2 font-semibold">Action</th>
                <th className="pb-2 font-semibold">Target</th>
                <th className="pb-2 font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">Loading logs…</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                    {filtered ? "No log entries match your search/filter." : "No actions have been recorded yet."}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const target = splitTarget(log.target);
                  return (
                    <tr key={log.id} className="border-t border-gray-50 align-top">
                      <td className="py-3 pr-4 font-semibold text-gray-900 text-sm whitespace-nowrap">{log.actor}</td>
                      <td className="py-3 pr-4 text-sm">
                        <p className="text-gray-700">{log.actionText}</p>
                        {log.detail && <p className="text-xs text-gray-400 mt-0.5 max-w-xs break-words">{log.detail}</p>}
                      </td>
                      <td className="py-3 pr-4 text-sm">
                        <p className="text-gray-700">{target.name}</p>
                        {target.email && <p className="text-xs text-gray-400 font-mono break-all">{target.email}</p>}
                      </td>
                      <td className="py-3 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(log.at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

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
    </div>
  );
}
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import { authedRequest } from "../../api";
import { formatDateTime, messageFrom } from "../../lib/adminUsers";

const PAGE_SIZE = 20;

const FILTER_TABS = [
  { label: "All", value: "all" },
  { label: "Logins", value: "logins" },
  { label: "Failed Attempts", value: "failed" },
];

const BADGES = {
  success: { text: "Success", className: "bg-[#e8f5e9] text-[#2e7d32]" },
  failed: { text: "Failed", className: "bg-[#fbe9e7] text-[#d84315]" },
  locked: { text: "Locked", className: "bg-[#fff8e1] text-[#b8860b]" },
  suspended: { text: "Suspended", className: "bg-[#fff8e1] text-[#b8860b]" },
  unverified: { text: "Not verified", className: "bg-[#fff8e1] text-[#b8860b]" },
  not_approved: { text: "Not approved", className: "bg-[#fff8e1] text-[#b8860b]" },
};

function StatusBadge({ status }) {
  const badge = BADGES[status] || BADGES.failed;
  return (
    <span className={`${badge.className} px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap`}>
      {badge.text}
    </span>
  );
}

function listActivity({ search, filter, page, limit }) {
  const q = new URLSearchParams();
  if (search) q.set("search", search);
  if (filter && filter !== "all") q.set("filter", filter);
  q.set("page", String(page));
  q.set("limit", String(limit));
  return authedRequest(`/api/admin/activity?${q.toString()}`);
}

export default function UserActivityMonitoring({ onSignOut }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ activity: [], total: 0, pages: 1 });
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
        const result = await listActivity({ search: debouncedSearch, filter, page, limit: PAGE_SIZE });
        if (id !== latest.current) return;
        setData(result);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        setError(messageFrom(err, "Could not load the activity."));
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, filter, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const chooseFilter = (value) => {
    if (value === filter) return;
    setFilter(value);
    setPage(1);
  };

  const { activity, total, pages } = data;
  const firstShown = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, total);
  const filtered = Boolean(debouncedSearch) || filter !== "all";

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">User Activity Monitoring</h2>
          <p className="text-sm text-gray-500 mt-1">
            Login history across accounts, newest first. Entries are kept for 90 days.
          </p>
        </div>
        <button
          onClick={() => load({ quiet: true })}
          aria-label="Refresh activity"
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
            placeholder="Search by user, email or IP address..."
            aria-label="Search activity"
            className="bg-[#f4f4f4] border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => chooseFilter(tab.value)}
              className={
                filter === tab.value
                  ? "bg-[#38512f] text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
                  : "bg-[#f0f0f0] text-gray-700 hover:bg-gray-200 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
              }
            >
              {tab.label}
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
          <table className={`w-full text-sm transition-opacity ${loading && activity.length > 0 ? "opacity-50" : ""}`}>
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="pb-2 font-semibold">User</th>
                <th className="pb-2 font-semibold">Action</th>
                <th className="pb-2 font-semibold">Device/IP</th>
                <th className="pb-2 font-semibold">Timestamp</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && activity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">Loading activity…</td>
                </tr>
              ) : activity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                    {filtered ? "No activity matches your search/filter." : "No logins have been recorded yet."}
                  </td>
                </tr>
              ) : (
                activity.map((row) => (
                  <tr key={row.id} className="border-t border-gray-50 align-top">
                    <td className="py-3 pr-4">
                      <p className={`font-semibold ${row.knownUser ? "text-gray-900" : "text-gray-500"}`}>{row.user}</p>
                      {row.knownUser && row.email && <p className="text-xs text-gray-400">{row.email}</p>}
                      {!row.knownUser && <p className="text-xs text-gray-400">No matching account</p>}
                    </td>
                    <td className="py-3 pr-4 text-gray-700 text-sm">{row.action}</td>
                    <td className="py-3 pr-4 text-sm">
                      <p className="text-gray-700">{row.device}</p>
                      <p className="text-xs text-gray-400 font-mono">{row.ip}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-600 text-sm whitespace-nowrap">{formatDateTime(row.at)}</td>
                    <td className="py-3">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))
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
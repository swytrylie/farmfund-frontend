import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { authedRequest } from "../../api";
import { messageFrom } from "../../lib/adminUsers";

const PAGE_SIZE = 20;

const LINK_FILTERS = [
  { label: "All farms", value: "all" },
  { label: "Linked", value: "linked" },
  { label: "Not linked", value: "unlinked" },
];

function listFarms({ search, link, page, limit }) {
  const q = new URLSearchParams();
  if (search) q.set("search", search);
  if (link && link !== "all") q.set("link", link);
  q.set("page", String(page));
  q.set("limit", String(limit));
  return authedRequest(`/api/admin/farms?${q.toString()}`);
}

const formatHectares = (n) =>
  typeof n === "number" && Number.isFinite(n) ? `${Number(n.toFixed(2)).toLocaleString("en-US")} ha` : "—";

function KPICard({ label, value, valueColor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm border-l-4 border-l-[#4d6b41]">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-extrabold ${valueColor}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "suspended") {
    return (
      <span className="bg-[#fff8e1] text-[#b8860b] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
        Owner suspended
      </span>
    );
  }
  return (
    <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-xs font-semibold">Active</span>
  );
}

export default function FarmManagement({ onSignOut }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [link, setLink] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ farms: [], total: 0, pages: 1, kpis: null });
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
        const result = await listFarms({ search: debouncedSearch, link, page, limit: PAGE_SIZE });
        if (id !== latest.current) return;
        setData(result);
      } catch (err) {
        if (id !== latest.current) return;
        if (err && err.status === 401) {
          onSignOut?.();
          return;
        }
        setError(messageFrom(err, "Could not load the farms."));
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, link, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const chooseLink = (value) => {
    if (value === link) return;
    setLink(value);
    setPage(1);
  };

  const { farms, total, pages, kpis } = data;
  const firstShown = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, total);
  const filtered = Boolean(debouncedSearch) || link !== "all";
  const k = (v) => (kpis && v !== undefined && v !== null ? v : "—");

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Farm Management</h2>
      <p className="text-sm text-gray-500 mt-1">
        Registered farms and their basic information. A farm is linked to a cooperative when its owner has a loan with it.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Registered Farms" value={k(kpis && kpis.registeredFarms)} valueColor="text-gray-900" />
        <KPICard
          label="Avg. Farm Size"
          value={kpis ? formatHectares(kpis.avgFarmSizeHectares) : "—"}
          valueColor="text-gray-900"
        />
        <KPICard label="Linked to a Cooperative" value={k(kpis && kpis.linkedToCooperative)} valueColor="text-[#2e7d32]" />
        <KPICard label="Not Linked to a Cooperative" value={k(kpis && kpis.notLinked)} valueColor="text-[#b8860b]" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full min-w-0 md:flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by farm name, farmer, or location..."
              aria-label="Search farms"
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {LINK_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => chooseLink(filter.value)}
                className={
                  link === filter.value
                    ? "bg-[#38512f] text-white font-medium px-4 py-2 rounded-xl text-sm"
                    : "bg-[#f0f0f0] text-gray-700 hover:bg-gray-200 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
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
            <table className={`w-full text-sm transition-opacity ${loading && farms.length > 0 ? "opacity-50" : ""}`}>
              <thead>
                <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                  <th className="pb-2 font-semibold">Farm Name</th>
                  <th className="pb-2 font-semibold">Farmer</th>
                  <th className="pb-2 font-semibold">Location</th>
                  <th className="pb-2 font-semibold">Size</th>
                  <th className="pb-2 font-semibold">Cooperative</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && farms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">Loading farms…</td>
                  </tr>
                ) : farms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                      {filtered ? "No farms match your search/filter." : "No farms have been registered yet."}
                    </td>
                  </tr>
                ) : (
                  farms.map((f) => (
                    <tr key={f.id} className="border-t border-gray-50">
                      <td className="py-3 pr-4 font-semibold text-gray-900">{f.name}</td>
                      <td className="py-3 pr-4">
                        <p className="text-gray-700">{f.farmer}</p>
                        {f.farmerEmail && <p className="text-xs text-gray-400">{f.farmerEmail}</p>}
                      </td>
                      <td className={`py-3 pr-4 ${f.location ? "text-gray-600" : "text-gray-400"}`}>{f.location || "—"}</td>
                      <td className={`py-3 pr-4 whitespace-nowrap ${f.sizeHectares ? "text-gray-700" : "text-gray-400"}`}>
                        {formatHectares(f.sizeHectares)}
                      </td>
                      <td className="py-3 pr-4">
                        {f.cooperatives && f.cooperatives.length > 0 ? (
                          <span className="text-gray-700">{f.cooperatives.join(", ")}</span>
                        ) : (
                          <span className="text-xs italic text-gray-400">— No lender yet</span>
                        )}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={f.farmerStatus} />
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
    </div>
  );
}
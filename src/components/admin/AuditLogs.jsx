import { useState, useEffect } from "react";
import { getAuditLogs, CATEGORY_FILTERS } from "../../mocks/admin/adminAuditLogs.mock";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;
    getAuditLogs().then((data) => {
      if (!cancelled) {
        setLogs(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Audit Logs</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading logs…
        </div>
      </div>
    );
  }

  const filterCategoryMap = {
    All: null,
    "Admin actions": "admin",
    "Cooperative actions": "cooperative",
  };

  const q = searchQuery.toLowerCase();
  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      activeFilter === "All" || log.category === filterCategoryMap[activeFilter];
    const matchesSearch =
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Audit Logs</h2>
      <p className="text-sm text-gray-500 mt-1">
        Record of important actions taken by admins and cooperative staff
      </p>

      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by actor, action, or target..."
          className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 w-full min-w-0 md:flex-1 focus:outline-none focus:ring-2 focus:ring-[#4d6b41]"
        />

        <div className="flex gap-2 shrink-0">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={
                activeFilter === filter
                  ? "bg-[#38512f] text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
                  : "bg-[#f0f0f0] text-gray-700 hover:bg-gray-200 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
              }
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="pb-2 font-semibold">Actor</th>
              <th className="pb-2 font-semibold">Action</th>
              <th className="pb-2 font-semibold">Target</th>
              <th className="pb-2 font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                  No log entries match your search/filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-gray-50">
                  <td className="py-3 pr-4 font-semibold text-gray-900 text-sm">{log.actor}</td>
                  <td className="py-3 pr-4 text-gray-700 text-sm">{log.action}</td>
                  <td
                    className={`py-3 pr-4 text-gray-600 text-sm ${
                      log.target.includes("@") ? "font-mono" : ""
                    }`}
                  >
                    {log.target}
                  </td>
                  <td className="py-3 text-gray-500 text-xs">{log.timestamp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
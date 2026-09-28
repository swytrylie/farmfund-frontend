import { useState, useEffect } from "react";
import { getUserActivity, FILTER_TABS } from "../../mocks/admin/adminActivity.mock";

function StatusBadge({ status }) {
  if (status === "success") {
    return (
      <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-xs font-semibold">
        Success
      </span>
    );
  }
  return (
    <span className="bg-[#fbe9e7] text-[#d84315] px-3 py-1 rounded-full text-xs font-semibold">
      Failed (3x)
    </span>
  );
}

export default function UserActivityMonitoring() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;
    getUserActivity().then((data) => {
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
        <h2 className="text-3xl font-bold text-gray-900">User Activity Monitoring</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading activity…
        </div>
      </div>
    );
  }

  const filterCategoryMap = {
    All: null,
    Logins: "login",
    "Failed Attempts": "failed",
  };

  const q = searchQuery.toLowerCase();
  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      activeFilter === "All" || log.category === filterCategoryMap[activeFilter];
    const matchesSearch =
      log.user.toLowerCase().includes(q) || log.deviceIp.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">User Activity Monitoring</h2>
      <p className="text-sm text-gray-500 mt-1">
        Login history and session activity across accounts
      </p>

      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by user or IP address..."
          className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 w-full min-w-0 md:flex-1 focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
        />

        <div className="flex gap-2 shrink-0">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={
                activeFilter === tab
                  ? "bg-[#38512f] text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
                  : "bg-[#f0f0f0] text-gray-700 hover:bg-gray-200 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <table className="w-full text-sm">
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
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                  No activity matches your search/filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-gray-50">
                  <td className="py-3 pr-4 font-semibold text-gray-900">{log.user}</td>
                  <td className="py-3 pr-4 text-gray-700 text-sm">{log.action}</td>
                  <td className="py-3 pr-4 text-gray-600 text-sm">{log.deviceIp}</td>
                  <td className="py-3 pr-4 text-gray-600 text-sm">{log.timestamp}</td>
                  <td className="py-3">
                    <StatusBadge status={log.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
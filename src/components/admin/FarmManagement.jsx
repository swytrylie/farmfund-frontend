import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { getFarms } from "../../mocks/admin/adminFarms.mock";

function KPICard({ label, value, valueColor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm border-l-4 border-l-[#4d6b41]">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className={`text-3xl font-extrabold ${valueColor}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) return null; // Row 4 — no status badge at all
  if (status === "active") {
    return (
      <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-xs font-semibold">
        Active
      </span>
    );
  }
  return (
    <span className="bg-[#fff8e1] text-[#b8860b] px-3 py-1 rounded-full text-xs font-semibold">
      Under review
    </span>
  );
}

export default function FarmManagement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    getFarms().then((result) => {
      if (!cancelled) {
        setData(result);
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
        <h2 className="text-3xl font-bold text-gray-900">Farm Management</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading farms…
        </div>
      </div>
    );
  }

  const q = searchQuery.toLowerCase();
  const filteredFarms = data.farms.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.farmer.toLowerCase().includes(q) ||
      f.location.toLowerCase().includes(q)
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Farm Management</h2>
      <p className="text-sm text-gray-500 mt-1">
        Registered farms and their basic information
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Registered Farms"
          value={data.kpis.registeredFarms}
          valueColor="text-gray-900"
        />
        <KPICard
          label="Avg. Farm Size"
          value={data.kpis.avgFarmSize}
          valueColor="text-gray-900"
        />
        <KPICard
          label="Linked to a Cooperative"
          value={data.kpis.linkedToCooperative}
          valueColor="text-[#2e7d32]"
        />
        <KPICard
          label="Linked to an Individual Lender"
          value={data.kpis.linkedToIndividualLender}
          valueColor="text-[#c62828]"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by farm name, farmer, or location..."
            className="bg-[#f4f4f4] border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>

        <table className="w-full text-sm">
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
            {filteredFarms.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                  No farms match your search.
                </td>
              </tr>
            ) : (
              filteredFarms.map((f) => (
                <tr key={f.id} className="border-t border-gray-50">
                  <td className="py-3 pr-4 font-semibold text-gray-900">{f.name}</td>
                  <td className="py-3 pr-4 text-gray-700">{f.farmer}</td>
                  <td className="py-3 pr-4 text-gray-600">{f.location}</td>
                  <td className={`py-3 pr-4 ${f.size === "-" ? "text-gray-400" : "text-gray-700"}`}>
                    {f.size}
                  </td>
                  <td className="py-3 pr-4">
                    {f.cooperative ? (
                      <span className="text-gray-700">{f.cooperative}</span>
                    ) : (
                      <span className="text-xs italic text-gray-400">— No lender yet</span>
                    )}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={f.status} />
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
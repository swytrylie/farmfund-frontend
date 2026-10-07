import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { authedRequest } from "../../api";

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

function KPICard({ label, value, valueColor }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

const STATUS_BADGE = {
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
  active: { label: "Active", className: "bg-green-100 text-green-800" },
  pending: { label: "Pending review", className: "bg-amber-100 text-amber-700" },
  clear: { label: "No active loans", className: "bg-gray-100 text-gray-600" },
};

const LOAN_STATUS_LABEL = {
  pending: "Pending review",
  approved: "Approved",
  active: "Active",
  paid_off: "Paid off",
  defaulted: "Defaulted",
  rejected: "Rejected",
};

// A borrower's overall badge: overdue beats active beats pending beats
// clear — genuinely computed from their real loans, not stored anywhere
// separately.
function computeBorrowerStatus(loans) {
  const now = new Date();
  const hasOverdue = loans.some((l) => l.status === "active" && l.dueDate && new Date(l.dueDate) < now);
  if (hasOverdue) return "overdue";
  if (loans.some((l) => l.status === "active")) return "active";
  if (loans.some((l) => l.status === "pending")) return "pending";
  return "clear";
}

function BorrowerRow({ borrower, isSelected, onSelect }) {
  const badge = STATUS_BADGE[borrower.status];
  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer border-t border-gray-50 transition-colors ${isSelected ? "bg-[#f4f8f3]" : "hover:bg-gray-50"}`}
    >
      <td className="py-3 pr-4">
        <p className="font-bold text-gray-900 text-sm">{borrower.name}</p>
        <p className="text-xs text-gray-400">{borrower.email}</p>
      </td>
      <td className="py-3 pr-4 text-gray-900 text-sm font-medium">{peso(borrower.totalPrincipal)}</td>
      <td className="py-3 pr-4 text-gray-600 text-sm">{borrower.loanCount}</td>
      <td className="py-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
      </td>
    </tr>
  );
}

// Shows real loan history instead of fake payment records — there's no
// real payment-recording flow yet (LoanPayment is still read-only), so
// rather than invent payment dates and amounts, this shows the actual
// loan requests themselves, which are genuinely real.
function BorrowerDetailPanel({ borrower }) {
  if (!borrower) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 text-sm min-h-[200px]">
        Select a borrower to view details
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="font-bold text-gray-900">{borrower.name}</p>
      <p className="text-xs text-gray-400">{borrower.email}</p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider">Total Loans</p>
          <p className="font-bold text-gray-900">{borrower.loanCount}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider">Total Principal</p>
          <p className="font-bold text-gray-900">{peso(borrower.totalPrincipal)}</p>
        </div>
      </div>

      <p className="mt-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Loan History</p>
      <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
        {borrower.loans.map((loan) => (
          <div key={loan._id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{peso(loan.principalAmount)}</p>
              <p className="text-xs text-gray-400">
                Requested {new Date(loan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <span className="text-xs text-gray-500">{LOAN_STATUS_LABEL[loan.status] || loan.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BorrowerManagement() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loans, setLoans] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const data = await authedRequest("/api/loans?limit=100");
        if (!cancelled) setLoans(data);
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

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Borrower Management</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Borrower Management</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  // Group real loans by farmer — a borrower only exists here because
  // they have at least one real loan with this cooperative.
  const borrowersMap = {};
  for (const loan of loans) {
    const farmerId = loan.farmer?._id || loan.farmer;
    if (!farmerId) continue;
    if (!borrowersMap[farmerId]) {
      borrowersMap[farmerId] = {
        id: farmerId,
        name: loan.farmer?.firstName ? `${loan.farmer.firstName} ${loan.farmer.lastName}` : "Unknown farmer",
        email: loan.farmer?.email || "",
        loans: [],
      };
    }
    borrowersMap[farmerId].loans.push(loan);
  }
  const borrowers = Object.values(borrowersMap).map((b) => ({
    ...b,
    loanCount: b.loans.length,
    totalPrincipal: b.loans.reduce((s, l) => s + l.principalAmount, 0),
    status: computeBorrowerStatus(b.loans),
  }));

  const filteredBorrowers = borrowers.filter((b) => {
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // If the currently-selected borrower has been filtered out by the
  // search/status filter, fall back to the first still-visible one —
  // otherwise the detail panel below would keep showing someone no
  // longer present in the filtered table above it.
  const selectedBorrower = filteredBorrowers.find((b) => b.id === selectedBorrowerId) || filteredBorrowers[0] || null;

  const totalPrincipalAcrossAll = borrowers.reduce((s, b) => s + b.totalPrincipal, 0);
  const overdueCount = borrowers.filter((b) => b.status === "overdue").length;

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">Borrower Management</h2>
      <p className="mt-1 text-gray-500">Farmers who have borrowed from your cooperative</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="TOTAL BORROWERS" value={borrowers.length} valueColor="text-gray-900" />
        <KPICard label="TOTAL PRINCIPAL LENT" value={peso(totalPrincipalAcrossAll)} valueColor="text-[#be8238]" />
        <KPICard label="OVERDUE BORROWERS" value={overdueCount} valueColor="text-red-600" />
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search borrowers by name or email..."
              className="bg-[#f3f4f0] border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
          </div>
          <div className="flex gap-2">
            {["All", "overdue", "active", "pending", "clear"].map((key) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === key ? "bg-[#4f7331] text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {key === "All" ? "All" : STATUS_BADGE[key].label}
              </button>
            ))}
          </div>
        </div>

        {filteredBorrowers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            {borrowers.length === 0 ? "No one has borrowed from your cooperative yet." : "No borrowers match this search/filter."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="pb-2 font-semibold">Borrower</th>
                <th className="pb-2 font-semibold">Total Principal</th>
                <th className="pb-2 font-semibold">Loans</th>
                <th className="pb-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBorrowers.map((b) => (
                <BorrowerRow key={b.id} borrower={b} isSelected={selectedBorrower?.id === b.id} onSelect={() => setSelectedBorrowerId(b.id)} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <BorrowerDetailPanel borrower={selectedBorrower} />
    </div>
  );
}
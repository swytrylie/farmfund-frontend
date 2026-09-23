import { useState } from "react";
import { Plus, ArrowUpRight, Coins, Search } from "lucide-react";

// ---- KPI summary data ----
const KPI_CARDS = [
  {
    label: "Total Income",
    value: "₱58,200",
    valueColor: "text-green-700",
    iconBg: "bg-[#e2f5d8]",
    iconColor: "text-emerald-700",
  },
  {
    label: "Total Expenses",
    value: "₱12,590",
    valueColor: "text-red-700",
    iconBg: "bg-[#fde2e2]",
    iconColor: "text-rose-700",
  },
  {
    label: "Net",
    value: "₱45,610",
    valueColor: "text-amber-700",
    iconBg: "bg-[#fef3c7]",
    iconColor: "text-amber-700",
    isNet: true,
  },
];

// ---- Weekly grouped bar chart data ----
const WEEKLY_DATA = [
  { week: "W1", income: 52000, expenses: 22000 },
  { week: "W2", income: 40000, expenses: 12000 },
  { week: "W3", income: 65000, expenses: 26000 },
  { week: "W4", income: 72000, expenses: 38000 },
];
const WEEKLY_MAX = 80000;
const Y_AXIS_WEEKLY = ["₱80k", "₱60k", "₱40k", "₱20k"];

// ---- Initial transactions ----
// Only the first two rows were specified exactly; a few extra plausible rows
// were added so the search/filter controls have something real to filter.
const INITIAL_TRANSACTIONS = [
  {
    date: "Aug 20, 2026",
    description: "Corn Harvest",
    category: "Crop Sales",
    method: "GCash",
    amount: "+₱45,000.00",
    type: "income",
  },
  {
    date: "Aug 14, 2026",
    description: "Fertilizer — NPK blend 50 kg",
    category: "Fertilizer",
    method: "Maya",
    amount: "-₱2,800.00",
    type: "expenses",
  },
  {
    date: "Aug 10, 2026",
    description: "Rice Harvest",
    category: "Crop Sales",
    method: "GCash",
    amount: "+₱21,000.00",
    type: "income",
  },
  {
    date: "Aug 8, 2026",
    description: "Farm Labor Wages",
    category: "Labor",
    method: "Cash",
    amount: "-₱6,500.00",
    type: "expenses",
  },
  {
    date: "Aug 3, 2026",
    description: "Egg Sales",
    category: "Livestock Sales",
    method: "GCash",
    amount: "+₱8,200.00",
    type: "income",
  },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expenses", label: "Expenses" },
];

const CATEGORY_OPTIONS = [
  "Crop Sales",
  "Livestock Sales",
  "Fertilizer",
  "Labor",
  "Seeds",
  "Equipment",
  "Fuel",
  "Other",
];

const METHOD_OPTIONS = ["GCash", "Maya", "Cash", "Bank Transfer"];

function KPICard({ label, value, valueColor, iconBg, iconColor, isNet }) {
  const Icon = isNet ? Coins : ArrowUpRight;
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <span
        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}
      >
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className={`mt-0.5 text-xl font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}

function WeeklyOverviewChart() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
      <h3 className="font-bold text-gray-900">Weekly Overview - August 2026</h3>

      <div className="mt-6 flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {Y_AXIS_WEEKLY.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="flex-1 flex items-end h-48 border-l border-gray-200 pl-6">
          {WEEKLY_DATA.map((w) => (
            <div key={w.week} className="flex flex-col items-center flex-1 px-2">
              <div className="w-full flex items-end justify-center gap-1.5 h-40">
                <div
                  className="w-1/2 rounded-t-sm bg-[#4f7331]"
                  style={{ height: `${(w.income / WEEKLY_MAX) * 100}%` }}
                  title={`Income: ₱${w.income.toLocaleString()}`}
                />
                <div
                  className="w-1/2 rounded-t-sm bg-[#b35959]"
                  style={{ height: `${(w.expenses / WEEKLY_MAX) * 100}%` }}
                  title={`Expenses: ₱${w.expenses.toLocaleString()}`}
                />
              </div>
              <span className="mt-2 text-xs text-gray-500">{w.week}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#4f7331]" /> Income
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#b35959]" /> Expenses
        </span>
      </div>
    </div>
  );
}

const selectClass =
  "bg-gray-100 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 text-gray-700";

function NewTransactionForm({ onSave, onCancel }) {
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    const numericAmount = parseFloat(amount);
    if (!description.trim() || !numericAmount || numericAmount <= 0) {
      setError("Enter a description and an amount greater than 0.");
      return;
    }

    // TODO: replace with a real API call once the backend exists
    onSave({
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      description: description.trim(),
      category: category || "Other",
      method: method || "Cash",
      amount: `${type === "income" ? "+" : "-"}₱${numericAmount.toLocaleString(
        "en-US",
        { minimumFractionDigits: 2 }
      )}`,
      type,
    });
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
      <h3 className="font-bold text-gray-900">New Transaction</h3>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={selectClass}
        >
          <option value="income">Income</option>
          <option value="expenses">Expenses</option>
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={selectClass}
        >
          <option value="">Select...</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className={selectClass}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
          className={`${selectClass} sm:col-span-2`}
        />

        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className={selectClass}
        >
          <option value="">Select payment method...</option>
          {METHOD_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="bg-[#5b8a4b] hover:bg-[#4d753f] text-white px-8 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function IncomeExpenses() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  const filteredTransactions = transactions.filter((t) => {
    const matchesFilter = activeFilter === "all" || t.type === activeFilter;
    const matchesSearch = t.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  function handleSaveTransaction(newTransaction) {
    setTransactions((prev) => [newTransaction, ...prev]);
    setIsAddingTransaction(false);
  }

  return (
    <div>
      {/* Header + Add button */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Income & Expenses
          </h2>
          <p className="mt-1 text-gray-500">
            Record and categorize all farm transactions
          </p>
        </div>
        <button
          onClick={() => setIsAddingTransaction((open) => !open)}
          className="bg-[#3f6238] hover:bg-[#34512e] text-white px-5 py-2 rounded-lg flex items-center gap-1.5 font-medium shadow-sm transition-colors"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {KPI_CARDS.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      {/* New Transaction form — sits between KPI cards and the chart, only when open */}
      {isAddingTransaction && (
        <div className="mt-6">
          <NewTransactionForm
            onSave={handleSaveTransaction}
            onCancel={() => setIsAddingTransaction(false)}
          />
        </div>
      )}

      {/* Weekly overview chart */}
      <div className="mt-6">
        <WeeklyOverviewChart />
      </div>

      {/* Search & filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Transactions..."
            className="border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>

        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`rounded-full px-5 py-1 text-xs transition-colors ${
                activeFilter === f.key
                  ? "bg-[#4d6b41] text-white"
                  : "bg-[#e5e7eb] text-gray-700 hover:bg-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="pb-2 font-semibold">Date</th>
              <th className="pb-2 font-semibold">Description</th>
              <th className="pb-2 font-semibold">Category</th>
              <th className="pb-2 font-semibold">Method</th>
              <th className="pb-2 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  No transactions match your search.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t, i) => (
                <tr key={i} className="border-t border-gray-50">
                  <td className="py-3 text-gray-500">{t.date}</td>
                  <td className="py-3 text-gray-900 font-medium">
                    {t.description}
                  </td>
                  <td className="py-3">
                    <span className="bg-[#fef9c3] text-amber-800 px-3 py-1 rounded-lg text-xs">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{t.method}</td>
                  <td
                    className={`py-3 text-right font-bold ${
                      t.type === "income" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {t.amount}
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
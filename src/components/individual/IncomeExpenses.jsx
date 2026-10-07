import { useState, useEffect } from "react";
import { Plus, ArrowUpRight, Coins, Search } from "lucide-react";
import { authedRequest } from "../../api";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expenses" },
];

const METHOD_OPTIONS = ["GCash", "Maya", "Cash", "Bank Transfer"];
const AMOUNT_OPTIONS = [1000, 5000, 10000, 25000, 50000, 100000];

const peso = (n) => `₱${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

function KPICard({ label, value, valueColor, iconBg, iconColor, isNet }) {
  const Icon = isNet ? Coins : ArrowUpRight;
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <span
        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className={`mt-0.5 text-xl font-bold truncate ${valueColor}`} title={value}>{value}</p>
      </div>
    </div>
  );
}

// Buckets real records into 4 weekly bars for the current month — the
// backend has no dedicated "weekly summary" endpoint, so this is computed
// client-side from the same records already fetched for the table below.
// A 5th partial week (days 29-31) folds into week 4, matching the fixed
// 4-bar layout.
function computeWeeklyData(records) {
  const buckets = [
    { week: "W1", income: 0, expenses: 0 },
    { week: "W2", income: 0, expenses: 0 },
    { week: "W3", income: 0, expenses: 0 },
    { week: "W4", income: 0, expenses: 0 },
  ];
  for (const r of records) {
    const day = new Date(r.date).getDate();
    const bucketIndex = Math.min(3, Math.floor((day - 1) / 7));
    if (r.type === "income") buckets[bucketIndex].income += r.amount;
    else buckets[bucketIndex].expenses += r.amount;
  }
  return buckets;
}

function WeeklyOverviewChart({ data }) {
  const maxValue = Math.max(80000, ...data.flatMap((w) => [w.income, w.expenses]));
  const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map((f) =>
    `₱${Math.round((maxValue * (1 - f)) / 1000)}k`
  );

  // Bars grow from 0 whenever `data` changes, same technique used on the
  // other bar charts across the app.
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    setGrown(false);
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setGrown(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [data]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
      <h3 className="font-bold text-gray-900">Weekly Overview - This Month</h3>

      <div className="mt-6 flex gap-3">
        <div className="flex flex-col justify-between text-[11px] text-gray-400 h-48">
          {yAxisLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>

        <div className="flex-1 flex items-end h-48 border-l border-gray-200 pl-6">
          {data.map((w, i) => (
            <div key={w.week} className="flex flex-col items-center flex-1 px-2">
              <div className="w-full flex items-end justify-center gap-1.5 h-40">
                <div
                  className="w-1/2 rounded-t-sm bg-[#4f7331] transition-[height] duration-700 ease-out"
                  style={{
                    height: `${grown ? (w.income / maxValue) * 100 : 0}%`,
                    transitionDelay: `${i * 70}ms`,
                  }}
                  title={`Income: ${peso(w.income)}`}
                />
                <div
                  className="w-1/2 rounded-t-sm bg-[#b35959] transition-[height] duration-700 ease-out"
                  style={{
                    height: `${grown ? (w.expenses / maxValue) * 100 : 0}%`,
                    transitionDelay: `${i * 70 + 45}ms`,
                  }}
                  title={`Expenses: ${peso(w.expenses)}`}
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

function NewTransactionForm({ farmId, categories, farmingCycles, onSave, onCancel }) {
  const [type, setType] = useState("income");
  const incomeCategories = categories.filter((c) => c.type === "income");
  const [category, setCategory] = useState(incomeCategories[0]?._id || "");
  const [amount, setAmount] = useState(AMOUNT_OPTIONS[0]);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState("");
  const [farmingCycleId, setFarmingCycleId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Only categories matching the selected type are offered — the backend
  // rejects a type/category mismatch anyway, so this prevents the error
  // from ever happening rather than just catching it after the fact.
  const availableCategories = categories.filter((c) => c.type === type);

  async function handleSave() {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (numericAmount > 500000) {
      setError("Amount cannot exceed ₱500,000 per transaction.");
      return;
    }
    if (!category) {
      setError("Select a category.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const newRecord = await authedRequest("/api/financial-records", {
        method: "POST",
        body: {
          farm: farmId,
          category,
          type,
          amount: numericAmount,
          description: description.trim() || undefined,
          paymentMethod: method || undefined,
          farmingCycle: farmingCycleId || undefined,
        },
      });
      onSave(newRecord);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
      <h3 className="font-bold text-gray-900">New Transaction</h3>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
        <select
          value={type}
          onChange={(e) => {
            const newType = e.target.value;
            setType(newType);
            const firstMatch = categories.find((c) => c.type === newType);
            setCategory(firstMatch?._id || ""); // auto-select instead of leaving it blank
          }}
          className={selectClass}
        >
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={availableCategories.length === 0}
          className={`${selectClass} disabled:opacity-60`}
        >
          {availableCategories.length === 0 ? (
            <option value="">No {type} categories yet — add one in the database first</option>
          ) : (
            availableCategories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))
          )}
        </select>

        <div>
          <select
            value={isCustomAmount ? "custom" : amount}
            onChange={(e) => {
              if (e.target.value === "custom") {
                setIsCustomAmount(true);
                setAmount("");
              } else {
                setIsCustomAmount(false);
                setAmount(e.target.value);
              }
            }}
            className={selectClass}
          >
            {AMOUNT_OPTIONS.map((amt) => (
              <option key={amt} value={amt}>
                {peso(amt)}
              </option>
            ))}
            <option value="custom">Custom amount...</option>
          </select>

          {isCustomAmount && (
            <>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                autoFocus
                max={500000}
                className={`${selectClass} mt-2 ${
                  Number(amount) > 500000 ? "ring-2 ring-red-400" : ""
                }`}
              />
              {/* Live counter — updates as they type, before Save is ever clicked */}
              <p
                className={`mt-1 text-[11px] ${
                  Number(amount) > 500000 ? "text-red-500 font-semibold" : "text-gray-400"
                }`}
              >
                {amount ? peso(Number(amount)) : "₱0.00"} / ₱500,000.00 max
                {Number(amount) > 500000 && " — over the limit"}
              </p>
            </>
          )}
        </div>
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

      {/* Optional — most transactions aren't tied to one specific crop
          (general farm expenses, labor, etc.), so this stays unselected
          by default. Only shown when at least one real cycle exists. */}
      {farmingCycles.length > 0 && (
        <div className="mt-3">
          <select
            value={farmingCycleId}
            onChange={(e) => setFarmingCycleId(e.target.value)}
            className={selectClass}
          >
            <option value="">Not linked to a specific crop</option>
            {farmingCycles.map((c) => (
              <option key={c._id} value={c._id}>
                Link to: {c.crop?.name || "Crop"}
                {c.crop?.name === "Other Crop" && c.customCropName ? ` (${c.customCropName})` : ""} — started{" "}
                {new Date(c.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#5b8a4b] hover:bg-[#4d753f] text-white px-8 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
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

// Shown when the logged-in user has no farm yet — financial records belong
// to a farm, so this has to be set up before anything else on this page
// can work. Only asks for a name, since that's the only required field on
// the real Farm model.
function FarmSetupPrompt({ onCreated }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Enter a name for your farm.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const farm = await authedRequest("/api/farms", {
        method: "POST",
        body: { name: name.trim() },
      });
      onCreated(farm);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center max-w-md mx-auto">
      <h3 className="font-bold text-gray-900 text-lg">Set up your farm first</h3>
      <p className="mt-2 text-sm text-gray-500">
        Income and expenses are tracked per farm. Give your farm a name to
        get started — you can add more details later from Farm Profile.
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Lauron Family Farm"
        className="mt-4 bg-gray-100 rounded-xl px-4 py-2.5 text-sm w-full text-center focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
      />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <button
        onClick={handleCreate}
        disabled={saving}
        className="mt-4 bg-[#3f6238] hover:bg-[#34512e] text-white px-8 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
      >
        {saving ? "Creating…" : "Create Farm"}
      </button>
    </div>
  );
}

export default function IncomeExpenses() {
  const [loading, setLoading] = useState(true);
  const [farm, setFarm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [records, setRecords] = useState([]);
  const [farmingCycles, setFarmingCycles] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  // Loads the user's farm (0 or 1, now that one-farm-per-user is enforced
  // server-side) and, once a farm exists, its categories and records.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const farms = await authedRequest("/api/farms");
        if (cancelled) return;

        if (farms.length === 0) {
          setFarm(null);
          setLoading(false);
          return;
        }

        const userFarm = farms[0];
        setFarm(userFarm);

        const [categoriesData, recordsData, fieldsData] = await Promise.all([
          authedRequest("/api/financial-categories"),
          authedRequest(`/api/financial-records?farm=${userFarm._id}&limit=100`),
          authedRequest(`/api/fields?farm=${userFarm._id}`),
        ]);
        if (cancelled) return;

        setCategories(categoriesData);
        setRecords(recordsData);

        // Crop cycles are optional context here — if Crop/Livestock hasn't
        // been visited yet, there's no Field at all, which is a perfectly
        // normal state, not an error. The "link to a crop" dropdown just
        // has nothing to offer yet in that case.
        if (fieldsData.length > 0) {
          const cyclesData = await authedRequest(`/api/farming-cycles?field=${fieldsData[0]._id}&limit=100`);
          if (cancelled) return;
          setFarmingCycles(cyclesData);
        }
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

  const filteredRecords = records.filter((r) => {
    const matchesFilter = activeFilter === "all" || r.type === activeFilter;
    const matchesSearch = (r.description || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // KPIs and the weekly chart are both computed live from the real fetched
  // records — not stored separately, so they can never drift out of sync
  // with the table below.
  const totalIncome = records.filter((r) => r.type === "income").reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = records.filter((r) => r.type === "expense").reduce((sum, r) => sum + r.amount, 0);
  const net = totalIncome - totalExpenses;
  const weeklyData = computeWeeklyData(records);

  function handleFarmCreated(newFarm) {
    setFarm(newFarm);
    setCategories([]);
    setRecords([]);
    // Immediately load categories now that a farm exists, so the Add form
    // isn't stuck with an empty category list.
    authedRequest("/api/financial-categories").then(setCategories).catch(() => {});
  }

  function handleSaveTransaction(newRecord) {
    setRecords((prev) => [newRecord, ...prev]);
    setIsAddingTransaction(false);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Income & Expenses</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading…
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Income & Expenses</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
          {loadError}
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Income & Expenses</h2>
        <p className="mt-1 text-gray-500 mb-8">
          Record and categorize all farm transactions
        </p>
        <FarmSetupPrompt onCreated={handleFarmCreated} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Income & Expenses
          </h2>
          <p className="mt-1 text-gray-500">{farm.name}</p>
        </div>
        <button
          onClick={() => setIsAddingTransaction((open) => !open)}
          className="mt-12 bg-[#3f6238] hover:bg-[#34512e] text-white px-5 py-2 rounded-lg flex items-center gap-1.5 font-medium shadow-sm transition-colors"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Total Income"
          value={peso(totalIncome)}
          valueColor="text-green-700"
          iconBg="bg-[#e2f5d8]"
          iconColor="text-emerald-700"
        />
        <KPICard
          label="Total Expenses"
          value={peso(totalExpenses)}
          valueColor="text-red-700"
          iconBg="bg-[#fde2e2]"
          iconColor="text-rose-700"
        />
        <KPICard
          label="Net"
          value={peso(net)}
          valueColor="text-amber-700"
          iconBg="bg-[#fef3c7]"
          iconColor="text-amber-700"
          isNet
        />
      </div>

      {isAddingTransaction && (
        <div className="mt-6">
          <NewTransactionForm
            farmId={farm._id}
            categories={categories}
            farmingCycles={farmingCycles}
            onSave={handleSaveTransaction}
            onCancel={() => setIsAddingTransaction(false)}
          />
        </div>
      )}

      <div className="mt-6">
        <WeeklyOverviewChart data={weeklyData} />
      </div>

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
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  {records.length === 0
                    ? "No transactions yet — click \"Add\" to record your first one."
                    : "No transactions match your search."}
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => (
                <tr key={r._id} className="border-t border-gray-50">
                  <td className="py-3 text-gray-500">
                    {new Date(r.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 text-gray-900 font-medium">
                    {r.description || "—"}
                  </td>
                  <td className="py-3">
                    <span className="bg-[#fef9c3] text-amber-800 px-3 py-1 rounded-lg text-xs">
                      {r.category?.name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{r.paymentMethod || "—"}</td>
                  <td
                    className={`py-3 text-right font-bold ${
                      r.type === "income" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {r.type === "income" ? "+" : "-"}
                    {peso(r.amount)}
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
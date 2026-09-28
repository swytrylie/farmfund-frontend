import { useState, useEffect, useRef } from "react";
import {
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Slash,
  Trash2,
  ChevronDown,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  getUsers,
  suspendUser,
  activateUser,
  deleteUser,
  updateUser,
  createUser,
  TYPE_FILTERS,
  USER_TYPE_OPTIONS,
} from "../../mocks/admin/adminUsers.mock";

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TYPE_BADGE = {
  Farmer: "bg-[#e8f5e9] text-[#2e7d32]",
  "Cooperative Owner": "bg-[#fff8e1] text-[#b8860b]",
  "Financial Manager": "bg-[#e8eaf6] text-[#3f51b5]",
  "Individual Lender": "bg-[#ede7f6] text-[#6a1b9a]",
};

function TypeBadge({ type }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${TYPE_BADGE[type] ?? "bg-gray-100 text-gray-600"}`}>
      {type}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === "active") {
    return (
      <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-xs font-medium">
        Active
      </span>
    );
  }
  return (
    <span className="bg-[#fbe9e7] text-[#d84315] px-3 py-1 rounded-full text-xs font-medium">
      Suspended
    </span>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2d4027] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

function ActionMenu({ user, onView, onUpdate, onSuspendRequest, onActivate, onDeleteRequest }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => setIsOpen((o) => !o)} aria-label="Actions">
        <MoreVertical className="w-5 h-5 text-gray-500 cursor-pointer" />
      </button>

      {isOpen && (
        <div className="absolute top-7 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 w-48 z-50">
          <button
            onClick={() => {
              setIsOpen(false);
              onView(user);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 text-left"
          >
            <Eye className="w-4 h-4 text-gray-500" />
            View account
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onUpdate(user);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 text-left"
          >
            <Pencil className="w-4 h-4 text-gray-500" />
            Update details
          </button>
          {user.status === "active" ? (
            <button
              onClick={() => {
                setIsOpen(false);
                onSuspendRequest(user);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-amber-50 text-amber-700 text-left"
            >
              <Slash className="w-4 h-4 text-amber-500" />
              Suspend
            </button>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                onActivate(user);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-emerald-50 text-emerald-700 text-left"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Activate
            </button>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              onDeleteRequest(user);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-red-50 text-red-600 text-left"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ViewAccountModal({ user, onClose }) {
  const fields = [
    { label: "Full Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "User Type", value: user.type },
    { label: "Status", value: user.status === "active" ? "Active" : "Suspended" },
    { label: "Cooperative / Farm", value: user.org },
    { label: "Joined", value: user.joined },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Account Details</h3>
            <p className="text-xs text-gray-500 mb-6">
              Account and platform metadata only — no financial content is
              shown here.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {f.label}
              </p>
              <div className="bg-[#f4f4f4] rounded-xl px-4 py-3 text-sm font-medium text-gray-800">
                {f.value}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#f8f9f8] border border-gray-200 rounded-2xl p-4 mt-4">
          <p className="text-xs font-bold text-gray-800 mb-2">Recent Activity</p>
          <p className="text-xs text-gray-500">Last login: Aug 31, 2026, 8:14 AM</p>
          <p className="text-xs text-gray-500">Account created: {user.joined}</p>
        </div>

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

function UpdateDetailsModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    type: user.type,
    org: user.org,
  });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSave() {
    const newErrors = {
      name: !form.name.trim()
        ? "Full name is required."
        : form.name.trim().length < 2
        ? "Name must be at least 2 characters."
        : !NAME_REGEX.test(form.name)
        ? "Only letters, spaces, hyphens, and apostrophes allowed."
        : null,
      email: !form.email.trim()
        ? "Email is required."
        : !EMAIL_REGEX.test(form.email)
        ? "Enter a valid email address."
        : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    onSave({ ...user, ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Update User Details</h3>
            <p className="text-xs text-gray-500 mb-6">
              Changes here are logged to Audit Logs under your admin account.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value.replace(/[^a-zA-Z\s'-]/g, ""))}
              className={`bg-[#f4f4f4] border rounded-xl px-4 py-3 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] focus:bg-white transition-all ${
                errors.name ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={`bg-[#f4f4f4] border rounded-xl px-4 py-3 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] focus:bg-white transition-all ${
                errors.email ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              User Type
            </label>
            <div className="relative">
              <select
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                className="appearance-none bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] focus:bg-white transition-all"
              >
                {USER_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Cooperative / Farm
            </label>
            <input
              type="text"
              value={form.org}
              onChange={(e) => update("org", e.target.value)}
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function SuspendAccountModal({ user, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function handleConfirm() {
    if (!reason.trim()) {
      setError("A reason is required to suspend this account.");
      return;
    }
    onConfirm(user, reason.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-900">Suspend Account</h3>
        <p className="text-sm text-gray-500 mb-6">
          {user.name} will be temporarily blocked from logging in. This can
          be reversed anytime.
        </p>

        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
          Reason *
        </label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          rows={3}
          placeholder="e.g., Reported for suspicious activity, pending review"
          className={`bg-[#f4f4f4] border rounded-xl px-4 py-3 text-sm text-gray-800 w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41] focus:bg-white transition-all ${
            error ? "border-red-400" : "border-gray-200"
          }`}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleConfirm}
            className="bg-[#1d2a1b] hover:bg-[#121c11] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            Suspend account
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteAccountModal({ user, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-red-600 mb-2">Delete Account</h3>
        <p className="text-sm text-gray-600 mb-6">
          This permanently removes {user.name}'s account and its records.
          This cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-[#8b0000] hover:bg-[#660000] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}

function AddUserModal({ existingEmails, onSave, onCancel }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("");
  const [errors, setErrors] = useState({});

  function updateName(rawValue) {
    setName(rawValue.replace(/[^a-zA-Z\s'-]/g, ""));
    setErrors((prev) => ({ ...prev, name: undefined }));
  }

  function handleSave() {
    const trimmedEmail = email.trim().toLowerCase();

    const newErrors = {
      name: !name.trim()
        ? "Name is required."
        : name.trim().length < 2
        ? "Name must be at least 2 characters."
        : !NAME_REGEX.test(name)
        ? "Only letters, spaces, hyphens, and apostrophes allowed."
        : null,
      email: !trimmedEmail
        ? "Email address is required."
        : !EMAIL_REGEX.test(trimmedEmail)
        ? "Enter a valid email address."
        : existingEmails.includes(trimmedEmail)
        ? "This email already exists on the platform."
        : null,
      userType: !userType ? "Select a user type." : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    onSave({ name: name.trim(), email: trimmedEmail, type: userType });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Add User</h3>
            <p className="text-sm text-gray-500 mb-6">
              Manually create an account. Most users self-register; use this
              for support-created accounts.
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => updateName(e.target.value)}
              placeholder="e.g., Charles Leclerc"
              className={`bg-[#f4f4f4] border rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] focus:bg-white transition-all ${
                errors.name ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="name@example.com"
              className={`bg-[#f4f4f4] border rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] focus:bg-white transition-all ${
                errors.email ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              User Type
            </label>
            <div className="relative">
              <select
                value={userType}
                onChange={(e) => {
                  setUserType(e.target.value);
                  setErrors((prev) => ({ ...prev, userType: undefined }));
                }}
                className={`appearance-none bg-[#f4f4f4] border rounded-xl px-4 py-3 pr-10 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] focus:bg-white transition-all ${
                  errors.userType ? "border-red-400" : "border-gray-200"
                }`}
              >
                <option value="" disabled>
                  Select user type
                </option>
                {USER_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.userType && <p className="mt-1 text-xs text-red-500">{errors.userType}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            onClick={onCancel}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
          >
            Add user
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [viewingUser, setViewingUser] = useState(null);
  const [updatingUser, setUpdatingUser] = useState(null);
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getUsers().then((data) => {
      if (!cancelled) {
        setUsers(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filterTypeMap = {
    All: null,
    Farmers: "Farmer",
    "Cooperative Owners": "Cooperative Owner",
    "Financial Managers": "Financial Manager",
  };

  const filteredUsers = users.filter((u) => {
    const matchesType = typeFilter === "All" || u.type === filterTypeMap[typeFilter];
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  async function handleUpdateSave(updatedUser) {
    await updateUser();
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setToastMessage(`${updatedUser.name}'s details updated`);
    setUpdatingUser(null);
  }

  async function handleSuspendConfirm(user, reason) {
    await suspendUser(user.id, reason);
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: "suspended" } : u))
    );
    setToastMessage(`${user.name}'s account suspended`);
    setSuspendingUser(null);
  }

  async function handleActivate(user) {
    await activateUser();
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: "active" } : u))
    );
    setToastMessage(`${user.name}'s account activated`);
  }

  async function handleConfirmDelete() {
    await deleteUser();
    setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id));
    setToastMessage(`${pendingDelete.name}'s account deleted`);
    setPendingDelete(null);
  }

  async function handleAddUser({ name, email, type }) {
    await createUser();
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      type,
      org: "—",
      status: "active",
      joined: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    };
    setUsers((prev) => [newUser, ...prev]);
    setToastMessage("User account created successfully");
    setIsAddModalOpen(false);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading users…
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
          <p className="mt-1 text-gray-500">
            View, add, update, and delete accounts across the platform
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="mt-12 bg-[#38512f] hover:bg-[#2b3e24] text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Add user
        </button>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full min-w-0 sm:flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="bg-[#f4f4f4] border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>

        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setTypeFilter(filter)}
              className={
                typeFilter === filter
                  ? "bg-[#38512f] text-white font-medium px-4 py-2 rounded-xl text-sm"
                  : "bg-[#f0f0f0] text-gray-700 hover:bg-gray-200 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
              }
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="pb-2 font-semibold">User</th>
              <th className="pb-2 font-semibold">Type</th>
              <th className="pb-2 font-semibold">Cooperative/Farm</th>
              <th className="pb-2 font-semibold">Status</th>
              <th className="pb-2 font-semibold">Joined</th>
              <th className="pb-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                  No users match your search/filter.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-gray-50">
                  <td className="py-3 pr-4">
                    <p className="text-gray-900 font-medium">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <TypeBadge type={u.type} />
                  </td>
                  <td className="py-3 pr-4 text-gray-700">{u.org}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{u.joined}</td>
                  <td className="py-3">
                    <ActionMenu
                      user={u}
                      onView={setViewingUser}
                      onUpdate={setUpdatingUser}
                      onSuspendRequest={setSuspendingUser}
                      onActivate={handleActivate}
                      onDeleteRequest={setPendingDelete}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewingUser && (
        <ViewAccountModal user={viewingUser} onClose={() => setViewingUser(null)} />
      )}

      {updatingUser && (
        <UpdateDetailsModal
          user={updatingUser}
          onSave={handleUpdateSave}
          onClose={() => setUpdatingUser(null)}
        />
      )}

      {suspendingUser && (
        <SuspendAccountModal
          user={suspendingUser}
          onConfirm={handleSuspendConfirm}
          onClose={() => setSuspendingUser(null)}
        />
      )}

      {pendingDelete && (
        <DeleteAccountModal
          user={pendingDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {isAddModalOpen && (
        <AddUserModal
          existingEmails={users.map((u) => u.email.toLowerCase())}
          onSave={handleAddUser}
          onCancel={() => setIsAddModalOpen(false)}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}
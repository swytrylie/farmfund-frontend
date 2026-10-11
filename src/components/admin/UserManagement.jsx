import { useState, useEffect, useRef } from "react";
import {
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Slash,
  Trash2,
  Mail,
  X,
  CheckCircle2,
  Info,
} from "lucide-react";
import {
  useAdminUserList,
  suspendAdminUser,
  reactivateAdminUser,
  updateAdminUser,
  deleteAdminUser,
  sendAdminPasswordReset,
  messageFrom,
  formatDate,
  formatDateTime,
} from "../../lib/adminUsers";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TYPE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Farm Owners", value: "individual" },
  { label: "Cooperative Owners", value: "owner" },
  { label: "Financial Managers", value: "finance_manager" },
  { label: "Members", value: "member" },
];

// The server calls a regular account "Individual"; in this app those people are farm owners.
const typeText = (u) => (u.type === "individual" ? "Farm Owner" : u.typeLabel);

const TYPE_BADGE = {
  individual: "bg-[#e8f5e9] text-[#2e7d32]",
  owner: "bg-[#fff8e1] text-[#b8860b]",
  finance_manager: "bg-[#e8eaf6] text-[#3f51b5]",
  member: "bg-[#ede7f6] text-[#6a1b9a]",
};

function TypeBadge({ type, label }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${TYPE_BADGE[type] ?? "bg-gray-100 text-gray-600"}`}>
      {label}
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

function Toast({ message, tone = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, tone === "error" ? 6000 : 3000);
    return () => clearTimeout(timer);
  }, [onClose, tone]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${
        tone === "error" ? "bg-[#c24141]" : "bg-[#2d4027]"
      }`}
    >
      {tone === "error" ? <Info size={16} /> : <CheckCircle2 size={16} />}
      {message}
    </div>
  );
}

function ActionMenu({ user, onView, onUpdate, onSuspendRequest, onActivate, onResetRequest, onDeleteRequest }) {
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

  const item = "w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left";

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => setIsOpen((o) => !o)} aria-label={`Actions for ${user.name}`}>
        <MoreVertical className="w-5 h-5 text-gray-500 cursor-pointer" />
      </button>

      {isOpen && (
        <div className="absolute top-7 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 w-52 z-50">
          <button
            onClick={() => { setIsOpen(false); onView(user); }}
            className={`${item} hover:bg-gray-50 text-gray-700`}
          >
            <Eye className="w-4 h-4 text-gray-500" />
            View account
          </button>
          <button
            onClick={() => { setIsOpen(false); onUpdate(user); }}
            className={`${item} hover:bg-gray-50 text-gray-700`}
          >
            <Pencil className="w-4 h-4 text-gray-500" />
            Update details
          </button>
          {user.status === "active" ? (
            <>
              <button
                onClick={() => { setIsOpen(false); onResetRequest(user); }}
                className={`${item} hover:bg-gray-50 text-gray-700`}
              >
                <Mail className="w-4 h-4 text-gray-500" />
                Send password reset
              </button>
              <button
                onClick={() => { setIsOpen(false); onSuspendRequest(user); }}
                className={`${item} hover:bg-amber-50 text-amber-700`}
              >
                <Slash className="w-4 h-4 text-amber-500" />
                Suspend
              </button>
            </>
          ) : (
            <button
              onClick={() => { setIsOpen(false); onActivate(user); }}
              className={`${item} hover:bg-emerald-50 text-emerald-700`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Reactivate
            </button>
          )}
          <button
            onClick={() => { setIsOpen(false); onDeleteRequest(user); }}
            className={`${item} hover:bg-red-50 text-red-600`}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ModalShell({ onClose, children, width = "max-w-md" }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-3xl p-8 ${width} w-full shadow-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ViewAccountModal({ user, onClose }) {
  const fields = [
    { label: "Full Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "User Type", value: typeText(user) },
    { label: "Status", value: user.status === "active" ? "Active" : "Suspended" },
    { label: "Cooperative", value: user.org || "—" },
    { label: "Joined", value: formatDate(user.joined) },
  ];

  return (
    <ModalShell onClose={onClose} width="max-w-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Account Details</h3>
          <p className="text-xs text-gray-500 mb-6">
            Account and platform metadata only — no financial content is shown here.
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{f.label}</p>
            <div className="bg-[#f4f4f4] rounded-xl px-4 py-3 text-sm font-medium text-gray-800 break-words">
              {f.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#f8f9f8] border border-gray-200 rounded-2xl p-4 mt-4">
        <p className="text-xs font-bold text-gray-800 mb-2">Recent Activity</p>
        <p className="text-xs text-gray-500">
          Last login: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
        </p>
        <p className="text-xs text-gray-500">Account created: {formatDateTime(user.joined)}</p>
      </div>

      {user.status === "suspended" && (
        <div className="bg-[#fff8e1] border border-[#f1d98a] rounded-2xl p-4 mt-4">
          <p className="text-xs font-bold text-[#8c6a00] mb-2">Suspension</p>
          <p className="text-xs text-gray-700">Reason: {user.statusReason || "—"}</p>
          <p className="text-xs text-gray-500">
            By {user.statusChangedBy || "—"}
            {user.statusChangedAt ? ` on ${formatDateTime(user.statusChangedAt)}` : ""}
          </p>
        </div>
      )}

      <div className="flex items-center justify-end mt-6">
        <button
          onClick={onClose}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}

function UpdateDetailsModal({ user, busy, error, onSave, onClose }) {
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, email: user.email });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function nameProblem(value, label) {
    const v = value.trim();
    if (!v) return `${label} is required.`;
    if (v.length > 50) return `${label} must be 50 characters or fewer.`;
    if (/[<>]/.test(v)) return `${label} can't contain < or >.`;
    return null;
  }

  const emailChanging = form.email.trim().toLowerCase() !== user.email.toLowerCase();

  function handleSave() {
    if (busy) return;
    const newErrors = {
      firstName: nameProblem(form.firstName, "First name"),
      lastName: nameProblem(form.lastName, "Last name"),
      email: !form.email.trim()
        ? "Email is required."
        : !EMAIL_REGEX.test(form.email.trim())
        ? "Enter a valid email address."
        : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    const changes = {};
    if (form.firstName.trim() !== user.firstName) changes.firstName = form.firstName.trim();
    if (form.lastName.trim() !== user.lastName) changes.lastName = form.lastName.trim();
    if (emailChanging) changes.email = form.email.trim();
    onSave(changes);
  }

  const inputClass = (hasError) =>
    `bg-[#f4f4f4] border rounded-xl px-4 py-3 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] focus:bg-white transition-all ${
      hasError ? "border-red-400" : "border-gray-200"
    }`;
  const labelClass = "text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block";

  return (
    <ModalShell onClose={busy ? () => {} : onClose} width="max-w-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">Update User Details</h3>
          <p className="text-xs text-gray-500 mb-6">Changes are recorded in the Audit Logs under your admin account.</p>
        </div>
        <button onClick={onClose} disabled={busy} className="text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="um-first">First name</label>
            <input id="um-first" type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={inputClass(errors.firstName)} />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="um-last">Last name</label>
            <input id="um-last" type="text" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={inputClass(errors.lastName)} />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="um-email">Email</label>
          <input id="um-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass(errors.email)} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          {emailChanging && !errors.email && (
            <p className="mt-1 text-xs text-[#8c6a00]">
              Changing the email signs this person out everywhere and notifies both the old and new address.
            </p>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-3 mt-6">
        <button onClick={onClose} disabled={busy} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
          Close
        </button>
        <button onClick={handleSave} disabled={busy} className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-60">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </ModalShell>
  );
}

function SuspendAccountModal({ user, busy, error: serverError, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function handleConfirm() {
    if (busy) return;
    const r = reason.trim();
    if (r.length < 3) {
      setError("Give a reason of at least 3 characters.");
      return;
    }
    if (r.length > 300) {
      setError("The reason must be 300 characters or fewer.");
      return;
    }
    onConfirm(r);
  }

  return (
    <ModalShell onClose={busy ? () => {} : onClose}>
      <h3 className="text-xl font-bold text-gray-900">Suspend Account</h3>
      <p className="text-sm text-gray-500 mb-6">
        {user.name} will be signed out and blocked from logging in, and will be emailed this reason. You can reverse it anytime.
      </p>

      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block" htmlFor="um-reason">
        Reason *
      </label>
      <textarea
        id="um-reason"
        value={reason}
        onChange={(e) => { setReason(e.target.value); setError(""); }}
        rows={3}
        maxLength={300}
        placeholder="e.g., Reported for suspicious activity, pending review"
        className={`bg-[#f4f4f4] border rounded-xl px-4 py-3 text-sm text-gray-800 w-full resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41] focus:bg-white transition-all ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      />
      <div className="flex justify-between">
        <p className="mt-1 text-xs text-red-500">{error}</p>
        <p className="mt-1 text-xs text-gray-400">{reason.length}/300</p>
      </div>
      {serverError && <p className="mt-2 text-sm text-red-600">{serverError}</p>}

      <div className="flex items-center justify-end gap-3 mt-6">
        <button onClick={onClose} disabled={busy} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
          Close
        </button>
        <button onClick={handleConfirm} disabled={busy} className="bg-[#1d2a1b] hover:bg-[#121c11] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-60">
          {busy ? "Suspending…" : "Suspend account"}
        </button>
      </div>
    </ModalShell>
  );
}

function DeleteAccountModal({ user, busy, error, onConfirm, onCancel }) {
  return (
    <ModalShell onClose={busy ? () => {} : onCancel}>
      <h3 className="text-xl font-bold text-red-600 mb-2">Delete Account</h3>
      <p className="text-sm text-gray-600 mb-4">
        This permanently removes {user.name}'s account and its farm records, and emails them that it was deleted. This cannot be undone.
      </p>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <button onClick={onCancel} disabled={busy} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={busy} className="bg-[#8b0000] hover:bg-[#660000] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-60">
          {busy ? "Deleting…" : "Delete permanently"}
        </button>
      </div>
    </ModalShell>
  );
}

function PasswordResetModal({ user, busy, error, onConfirm, onCancel }) {
  return (
    <ModalShell onClose={busy ? () => {} : onCancel}>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Send password reset</h3>
      <p className="text-sm text-gray-600 mb-4">
        This emails {user.name} ({user.email}) asking them to reset their password using Forgot Password. Their current
        password keeps working until they do.
      </p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-end gap-3">
        <button onClick={onCancel} disabled={busy} className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={busy} className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-60">
          {busy ? "Sending…" : "Send email"}
        </button>
      </div>
    </ModalShell>
  );
}

export default function UserManagement({ onSignOut }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const list = useAdminUserList({ type: typeFilter, onUnauthorized: onSignOut });
  const { users, total, page, pages, limit, loading, error, search, setSearch, setPage, reload } = list;

  const [viewingUser, setViewingUser] = useState(null);
  const [updatingUser, setUpdatingUser] = useState(null);
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState(null); // { message, tone }
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const actingRef = useRef(false); // stops a double-click from sending twice

  function closeModals() {
    setUpdatingUser(null);
    setSuspendingUser(null);
    setResettingUser(null);
    setPendingDelete(null);
    setModalError("");
  }

  // Runs one admin action once at a time. Success: close the modal, show the
  // toast, refresh the list. Failure: keep the modal open and show why.
  async function perform(run, { inModal }) {
    if (actingRef.current) return;
    actingRef.current = true;
    setBusy(true);
    setModalError("");
    try {
      const outcome = await run();
      closeModals();
      setToast({ message: outcome.message, tone: outcome.tone || "success" });
      if (outcome.afterDelete && users.length === 1 && page > 1) setPage(page - 1);
      else reload({ quiet: true });
    } catch (err) {
      if (err && err.status === 401) {
        onSignOut?.();
        return;
      }
      const message = messageFrom(err, "Something went wrong. Please try again.");
      if (inModal) setModalError(message);
      else setToast({ message, tone: "error" });
      // 404 means it's already gone — refresh so the list is truthful.
      if (err && err.status === 404) reload({ quiet: true });
    } finally {
      actingRef.current = false;
      setBusy(false);
    }
  }

  const emailNote = (result, ok) => (result && result.emailSent === false ? `${ok}, but the email couldn't be sent.` : ok);
  const emailTone = (result) => (result && result.emailSent === false ? "error" : "success");

  const handleUpdateSave = (changes) =>
    perform(async () => {
      if (Object.keys(changes).length === 0) return { message: "Nothing changed" };
      const result = await updateAdminUser(updatingUser.id, changes);
      return { message: emailNote(result, `${result.name || updatingUser.name}'s details updated`), tone: emailTone(result) };
    }, { inModal: true });

  const handleSuspendConfirm = (reason) =>
    perform(async () => {
      const result = await suspendAdminUser(suspendingUser.id, reason);
      return { message: emailNote(result, `${suspendingUser.name}'s account suspended`), tone: emailTone(result) };
    }, { inModal: true });

  const handleActivate = (user) =>
    perform(async () => {
      const result = await reactivateAdminUser(user.id);
      return { message: emailNote(result, `${user.name}'s account reactivated`), tone: emailTone(result) };
    }, { inModal: false });

  const handleReset = () =>
    perform(async () => {
      await sendAdminPasswordReset(resettingUser.id);
      return { message: `Password reset email sent to ${resettingUser.email}` };
    }, { inModal: true });

  const handleConfirmDelete = () =>
    perform(async () => {
      const result = await deleteAdminUser(pendingDelete.id);
      return { message: emailNote(result, `${pendingDelete.name}'s account deleted`), tone: emailTone(result), afterDelete: true };
    }, { inModal: true });

  const firstShown = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastShown = Math.min(total, page * limit);

  return (
    <div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
        <p className="mt-1 text-gray-500">View, update, suspend, and delete accounts across the platform</p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full min-w-0 sm:flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            aria-label="Search users"
            className="bg-[#f4f4f4] border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>

        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={
                typeFilter === filter.value
                  ? "bg-[#38512f] text-white font-medium px-4 py-2 rounded-xl text-sm"
                  : "bg-[#f0f0f0] text-gray-700 hover:bg-gray-200 font-medium px-4 py-2 rounded-xl text-sm transition-colors"
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
        {error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#c24141] font-medium">{error}</p>
            <button
              onClick={() => reload()}
              className="mt-4 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <table className={`w-full text-sm transition-opacity ${loading && users.length > 0 ? "opacity-50" : ""}`}>
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="pb-2 font-semibold">User</th>
                <th className="pb-2 font-semibold">Type</th>
                <th className="pb-2 font-semibold">Cooperative</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Joined</th>
                <th className="pb-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">Loading users…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                    {search || typeFilter !== "all" ? "No users match your search/filter." : "No users yet."}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-50">
                    <td className="py-3 pr-4">
                      <p className="text-gray-900 font-medium">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <TypeBadge type={u.type} label={typeText(u)} />
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{u.org || "—"}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{formatDate(u.joined)}</td>
                    <td className="py-3">
                      <ActionMenu
                        user={u}
                        onView={setViewingUser}
                        onUpdate={(x) => { setModalError(""); setUpdatingUser(x); }}
                        onSuspendRequest={(x) => { setModalError(""); setSuspendingUser(x); }}
                        onActivate={handleActivate}
                        onResetRequest={(x) => { setModalError(""); setResettingUser(x); }}
                        onDeleteRequest={(x) => { setModalError(""); setPendingDelete(x); }}
                      />
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

      {viewingUser && <ViewAccountModal user={viewingUser} onClose={() => setViewingUser(null)} />}

      {updatingUser && (
        <UpdateDetailsModal user={updatingUser} busy={busy} error={modalError} onSave={handleUpdateSave} onClose={closeModals} />
      )}

      {suspendingUser && (
        <SuspendAccountModal user={suspendingUser} busy={busy} error={modalError} onConfirm={handleSuspendConfirm} onClose={closeModals} />
      )}

      {resettingUser && (
        <PasswordResetModal user={resettingUser} busy={busy} error={modalError} onConfirm={handleReset} onCancel={closeModals} />
      )}

      {pendingDelete && (
        <DeleteAccountModal user={pendingDelete} busy={busy} error={modalError} onConfirm={handleConfirmDelete} onCancel={closeModals} />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
}
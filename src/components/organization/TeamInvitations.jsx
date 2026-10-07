import { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import { authedRequest } from "../../api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_OPTIONS = ["member", "finance_manager"];
const ROLE_LABEL = { owner: "Owner", finance_manager: "Finance Manager", member: "Member" };

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium max-w-md text-center">
      {message}
    </div>
  );
}

// There's no real email-sending service set up yet, so the invite link
// is shown here directly for the owner to copy and share themselves
// (text, email, however) — rather than claiming it was auto-sent when it
// genuinely wasn't.
function InviteLinkModal({ inviteLink, onClose }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-gray-900">Invite Created</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Copy this link and send it to them yourself — there's no automatic email delivery set up yet. The link expires in 7 days.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-600 w-full"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={handleCopy}
            className="shrink-0 bg-[#2d4027] hover:bg-[#1f2d1b] text-white rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-sm transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl py-2.5 text-sm transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function InviteStaffModal({ existingEmails, onSend, onCancel }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Email address is required.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    if (existingEmails.includes(trimmed)) {
      setError("This email is already part of your team or has a pending invite.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSend({ email: trimmed, role });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-gray-900">Invite a Staff Member</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          This is for someone brand new to FarmFund. They'll get a real link to set up their own password — this only works for an email that doesn't already have an account.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="e.g., name@example.com"
              className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                error ? "border-red-400" : "border-gray-200"
              }`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Assign Role *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <div className="mt-3 bg-[#fff8e1] border border-[#ffe082] rounded-xl p-3 text-xs text-[#8d6e63]">
              This invite will assign <strong>{ROLE_LABEL[role]}</strong> access once accepted.
              {role === "finance_manager" && " A cooperative can have at most 3 finance managers."}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={saving}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white rounded-xl px-5 py-2.5 transition-colors disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member }) {
  const name = member.user ? `${member.user.firstName} ${member.user.lastName}` : "Unknown";
  return (
    <tr className="border-t border-gray-50">
      <td className="py-3 pr-4">
        <p className="font-medium text-gray-900 text-sm">{name}</p>
        <p className="text-xs text-gray-400">{member.user?.email}</p>
      </td>
      <td className="py-3 text-sm text-gray-600">{ROLE_LABEL[member.role]}</td>
      <td className="py-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Active</span>
      </td>
    </tr>
  );
}

function PendingInviteRow({ invite, onRevoke, onShowLink }) {
  const isExpired = new Date(invite.expiresAt) < new Date();
  return (
    <tr className="border-t border-gray-50">
      <td className="py-3 pr-4">
        <p className="font-medium text-gray-900 text-sm">{invite.email}</p>
        <p className="text-xs text-gray-400">
          Expires {new Date(invite.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </td>
      <td className="py-3 text-sm text-gray-600">{ROLE_LABEL[invite.role]}</td>
      <td className="py-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isExpired ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"}`}>
          {isExpired ? "Expired" : "Pending"}
        </span>
      </td>
      <td className="py-3 text-right">
        <button onClick={() => onShowLink(invite)} className="text-xs text-[#4f7331] hover:underline mr-3">
          Copy link
        </button>
        <button onClick={() => onRevoke(invite)} className="text-xs text-red-500 hover:underline">
          Revoke
        </button>
      </td>
    </tr>
  );
}

export default function TeamInvitations() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cooperativeId, setCooperativeId] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeInviteLink, setActiveInviteLink] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  async function loadAll(coopId) {
    const [membersData, invitesData] = await Promise.all([
      authedRequest(`/api/cooperative-members?cooperative=${coopId}`),
      authedRequest(`/api/cooperative-invites?cooperative=${coopId}`),
    ]);
    setMembers(membersData);
    setInvites(invitesData);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const me = await authedRequest("/api/auth/me");
        if (cancelled) return;
        if (!me.cooperativeId) {
          setLoadError("No cooperative membership found on this account.");
          setLoading(false);
          return;
        }
        setCooperativeId(me.cooperativeId);
        await loadAll(me.cooperativeId);
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

  async function handleSendInvite({ email, role }) {
    const invite = await authedRequest("/api/cooperative-invites", {
      method: "POST",
      body: { cooperative: cooperativeId, email, role },
    });
    await loadAll(cooperativeId);
    setIsInviteModalOpen(false);
    setActiveInviteLink(`${window.location.origin}/accept-invite?token=${invite.token}`);
  }

  async function handleRevoke(invite) {
    await authedRequest(`/api/cooperative-invites/${invite._id}`, { method: "DELETE" });
    setInvites((prev) => prev.filter((i) => i._id !== invite._id));
    setToastMessage(`Invite to ${invite.email} revoked`);
  }

  function handleShowLink(invite) {
    setActiveInviteLink(`${window.location.origin}/accept-invite?token=${invite.token}`);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Team & Invitations</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading team…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Team & Invitations</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  const existingEmails = [...members.map((m) => m.user?.email), ...invites.map((i) => i.email)].filter(Boolean);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Team & Invitations</h2>
          <p className="mt-1 text-gray-500">Manage who has access to your cooperative</p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="mt-12 bg-[#3f6238] hover:bg-[#34512e] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          Invite Staff
        </button>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-3">Team Members</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="pb-2 font-semibold">Name</th>
              <th className="pb-2 font-semibold">Role</th>
              <th className="pb-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <MemberRow key={m._id} member={m} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-3">Pending Invites</h3>
        {invites.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No pending invites.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
                <th className="pb-2 font-semibold">Email</th>
                <th className="pb-2 font-semibold">Role</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((i) => (
                <PendingInviteRow key={i._id} invite={i} onRevoke={handleRevoke} onShowLink={handleShowLink} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isInviteModalOpen && (
        <InviteStaffModal existingEmails={existingEmails} onSend={handleSendInvite} onCancel={() => setIsInviteModalOpen(false)} />
      )}

      {activeInviteLink && <InviteLinkModal inviteLink={activeInviteLink} onClose={() => setActiveInviteLink(null)} />}

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
    </div>
  );
}
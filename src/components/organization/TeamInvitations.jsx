import { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  Ban,
  Trash2,
  RefreshCw,
  X,
  UserCircle2,
  CheckCircle2,
} from "lucide-react";
import {
  getTeamMembers,
  sendInvitation,
  resendInvitation,
  cancelInvitation,
  deactivateAccess,
  removeFromOrganization,
  ROLE_OPTIONS,
} from "../../mocks/organization/orgTeam.mock";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StatusBadge({ status }) {
  if (status === "active") {
    return (
      <span className="bg-[#e8f5e9] text-[#2e7d32] font-medium px-3 py-1 rounded-full text-xs">
        Active
      </span>
    );
  }
  return (
    <span className="bg-[#fef3c7] text-[#92400e] font-medium px-3 py-1 rounded-full text-xs">
      Invite Sent
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

function ActionMenu({ member, onResend, onCancelInvite, onDeactivate, onRemove }) {
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

  if (member.isOwner) return null;

  const isPending = member.status === "invite-sent";

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Actions"
      >
        <MoreVertical className="w-5 h-5 text-gray-500 cursor-pointer" />
      </button>

      {isOpen && (
        <div className="absolute top-7 right-0 z-20 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {isPending ? (
            <>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onResend(member);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
              >
                <RefreshCw size={15} className="text-gray-500" />
                Resend invitation
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCancelInvite(member);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
              >
                <X size={15} className="text-red-500" />
                Cancel invitation
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onDeactivate(member);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
              >
                <Ban size={15} className="text-gray-500" />
                Deactivate access
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onRemove(member);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
              >
                <Trash2 size={15} className="text-red-500" />
                Remove from organization
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function InviteStaffModal({ existingEmails, onSend, onCancel }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [error, setError] = useState("");

  function handleSend() {
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

    onSend({ email: trimmed, role });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-gray-900">Invite a Staff Member</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Assign their role below. A temporary password will be sent to their
          email, and they'll be required to set a new password on their
          first login. They cannot sign up on their own — this is the only
          way to join your organization.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Email Address *
            </label>
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
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Assign Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <div className="mt-3 bg-[#fff8e1] border border-[#ffe082] rounded-xl p-3 text-xs text-[#8d6e63]">
              This invite will assign <strong>{role}</strong> access once
              accepted.
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white rounded-xl px-5 py-2.5 transition-colors"
          >
            Send invitation
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamInvitations() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    getTeamMembers().then((data) => {
      if (!cancelled) {
        setMembers(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSendInvite({ email, role }) {
    await sendInvitation();
    setMembers((prev) => [
      ...prev,
      {
        id: `staff-${Date.now()}`,
        name: null,
        email,
        role,
        status: "invite-sent",
        isOwner: false,
      },
    ]);
    setToastMessage(`Invitation sent to ${email}`);
    setIsInviteModalOpen(false);
  }

  async function handleResend(member) {
    await resendInvitation();
    setToastMessage(`Invitation resent to ${member.email}`);
  }

  async function handleCancelInvite(member) {
    await cancelInvitation();
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    setToastMessage(`Invitation to ${member.email} cancelled`);
  }

  async function handleDeactivate(member) {
    await deactivateAccess();
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, status: "deactivated" } : m))
    );
    setToastMessage(`${member.name}'s access has been deactivated`);
  }

  async function handleRemove(member) {
    await removeFromOrganization();
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    setToastMessage(`${member.name} removed from the organization`);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Team & Invitations</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading team…
        </div>
      </div>
    );
  }

  const existingEmails = members.map((m) => m.email.toLowerCase());

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Team & Invitations</h2>
          <p className="mt-1 text-gray-500">
            Invite staff and assign their role. Staff cannot sign up on their
            own.
          </p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="mt-12 bg-[#38512f] hover:bg-[#2b3e24] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          + Invite staff member
        </button>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="pb-2 font-semibold">Name</th>
              <th className="pb-2 font-semibold">Email</th>
              <th className="pb-2 font-semibold">Role</th>
              <th className="pb-2 font-semibold">Status</th>
              <th className="pb-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-gray-50">
                <td className="py-3 pr-4">
                  {member.name ? (
                    <span className="text-gray-900 font-medium">{member.name}</span>
                  ) : (
                    <UserCircle2 size={28} className="text-gray-300" />
                  )}
                </td>
                <td className="py-3 pr-4 text-gray-600">{member.email}</td>
                <td className="py-3 pr-4 text-gray-700">{member.role}</td>
                <td className="py-3 pr-4">
                  <StatusBadge status={member.status === "active" ? "active" : "invite-sent"} />
                </td>
                <td className="py-3">
                  <ActionMenu
                    member={member}
                    onResend={handleResend}
                    onCancelInvite={handleCancelInvite}
                    onDeactivate={handleDeactivate}
                    onRemove={handleRemove}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isInviteModalOpen && (
        <InviteStaffModal
          existingEmails={existingEmails}
          onSend={handleSendInvite}
          onCancel={() => setIsInviteModalOpen(false)}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}
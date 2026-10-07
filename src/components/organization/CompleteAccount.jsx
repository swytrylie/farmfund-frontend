import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { authedRequest } from "../../api";

const ROLE_LABEL = { owner: "Owner", finance_manager: "Finance Manager", member: "Member" };

function validateNamePart(value, label) {
  if (!value || !value.trim()) return `${label} is required.`;
  if (!/^[a-zA-Z\s]+$/.test(value)) return `${label} can only contain letters.`;
  return null;
}

// Self-contained: reads the invite token straight from the URL
// (?token=...) and fetches the real invite — rather than being handed
// invitedEmail/assignedRole as hardcoded props the way the old mock was,
// since this page genuinely doesn't know who's arriving until the real
// token is looked up.
export default function CompleteAccount({ onComplete }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [invite, setInvite] = useState(null);

  const [form, setForm] = useState({ firstName: "", lastName: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);

    if (!t) {
      setLoadError("No invite link found. Please use the exact link you were sent.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    authedRequest(`/api/cooperative-invites/${t}`)
      .then((data) => {
        if (!cancelled) setInvite(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "This invite link is invalid or has expired.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit() {
    const newErrors = {
      firstName: validateNamePart(form.firstName, "First name"),
      lastName: validateNamePart(form.lastName, "Last name"),
      newPassword: !form.newPassword
        ? "New password is required."
        : form.newPassword.length < 8
        ? "Password must be at least 8 characters."
        : !/[A-Za-z]/.test(form.newPassword)
        ? "Password must contain at least one letter."
        : !/[0-9]/.test(form.newPassword)
        ? "Password must contain at least one number."
        : null,
      confirmPassword: form.confirmPassword !== form.newPassword ? "Passwords don't match." : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      const result = await authedRequest(`/api/cooperative-invites/${token}/accept`, {
        method: "POST",
        body: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          password: form.newPassword,
        },
      });
      onComplete?.(result);
    } catch (err) {
      setErrors({ newPassword: err.message || "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field) =>
    `bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
      errors[field] ? "border-red-400" : "border-gray-200"
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Left: hero/brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#2d4027] to-[#4f7331] text-white p-12 flex-col justify-center">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Your Farm. Your Finances. Under Control.</h1>
          <p className="mt-4 text-white/85 text-lg">
            Track income, manage expenses, monitor loans, and get farm insights — all designed for farmers.
          </p>
          <div className="mt-8 space-y-3">
            {["Real-time income & expense tracking", "Loan and repayment management", "Built for cooperatives and farmers"].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-white/90 shrink-0" />
                <span className="text-white/90 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: onboarding form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-10">Checking your invite…</p>
          ) : loadError ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900">Invite not valid</h2>
              <p className="mt-2 text-sm text-red-600">{loadError}</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900">Complete your account</h2>
              <p className="mt-2 text-sm text-gray-500">
                You were invited as <strong>{ROLE_LABEL[invite.role]}</strong> at{" "}
                <strong>{invite.cooperativeName}</strong> ({invite.email}). Set your name and a password to get started.
              </p>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">First Name *</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => update("firstName", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                      placeholder="e.g., Nelmar"
                      className={inputClass("firstName")}
                    />
                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Last Name *</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => update("lastName", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                      placeholder="e.g., Lauron"
                      className={inputClass("lastName")}
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">New Password *</label>
                  <input
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => update("newPassword", e.target.value)}
                    className={inputClass("newPassword")}
                  />
                  {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Confirm New Password *</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    className={inputClass("confirmPassword")}
                  />
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-6 bg-[#689f38] hover:bg-[#558b2f] text-white rounded-xl py-3 w-full font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? "Setting up your account…" : "Create account"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
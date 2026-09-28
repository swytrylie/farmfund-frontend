import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

// Standalone page — NOT part of OrgDashboard's sidebar navigation. This is
// meant to load on an invited staff member's first login (email + temp
// password), before they ever reach the real dashboard.
//
// INTEGRATION NOTE: actually detecting "this is a first-time invited login"
// and routing here instead of the normal dashboard requires changes to the
// real login flow (App.jsx / LoginForm.jsx) — specifically, the backend
// would need to flag an account as "pending onboarding" (e.g. a
// mustSetPassword field on the user), and the login handler would check
// that flag and render this component instead of the dashboard. That
// integration isn't built here, since those files weren't visible in this
// conversation — this component is complete and ready to use once that
// routing decision points to it.

const NAME_REGEX = /^[a-zA-Z\s]+$/;
// Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number — a different,
// stricter rule than the existing signup password validator (which
// requires a special character instead of case variety). Kept local to
// this component rather than reusing lib/validation.js's validatePassword,
// since the two are genuinely different rule sets.
const NEW_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Mock "correct" temporary password this invited user was supposedly
// emailed — a placeholder for a real backend check.
const MOCK_TEMP_PASSWORD = "Temp1234";

function validateNamePart(value, label, required) {
  if (!value.trim()) return required ? `${label} is required.` : null;
  if (!NAME_REGEX.test(value)) return `${label} can only contain letters.`;
  if (value.trim().length < 2) return `${label} must be at least 2 characters.`;
  return null;
}

export default function CompleteAccount({ invitedEmail = "invited@gmail.com", assignedRole = "Financial Manager", onComplete }) {
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    tempPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit() {
    const newErrors = {
      lastName: validateNamePart(form.lastName, "Last name", true),
      firstName: validateNamePart(form.firstName, "First name", true),
      middleName: validateNamePart(form.middleName, "Middle name", false),
      tempPassword: !form.tempPassword
        ? "Temporary password is required."
        : form.tempPassword !== MOCK_TEMP_PASSWORD
        ? "That doesn't match the temporary password we sent you."
        : null,
      newPassword: !form.newPassword
        ? "New password is required."
        : !NEW_PASSWORD_REGEX.test(form.newPassword)
        ? "Use at least 8 characters with an uppercase letter, a lowercase letter, and a number."
        : null,
      confirmPassword: !form.confirmPassword
        ? "Please confirm your new password."
        : form.confirmPassword !== form.newPassword
        ? "Passwords don't match."
        : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSubmitting(true);
    // Simulated network delay — swap for a real API call when wired up.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitting(false);

    onComplete?.({
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: hero/brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#2d4027] to-[#4f7331] text-white p-12 flex-col justify-center">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Your Farm. Your Finances. Under Control.
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Track income, manage expenses, monitor loans, and get AI-powered
            insights — all designed for farmers.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Real-time income & expense tracking",
              "Loan and repayment management",
              "AI Farm Advisor recommendations",
            ].map((feature) => (
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
          <h2 className="text-2xl font-bold text-gray-900">Complete your account</h2>
          <p className="mt-2 text-sm text-gray-500">
            You were invited as <strong>{assignedRole}</strong> and logged in
            with a temporary password sent to your email ({invitedEmail}).
            Confirm your name and set a new password to continue.
          </p>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                  placeholder="e.g., Lauron"
                  className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                    errors.lastName ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                  placeholder="e.g., Nelmar"
                  className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                    errors.firstName ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Middle Name <span className="normal-case text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={form.middleName}
                onChange={(e) => update("middleName", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                placeholder="e.g., Lauron"
                className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                  errors.middleName ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.middleName && <p className="mt-1 text-xs text-red-500">{errors.middleName}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Temporary Password *
              </label>
              <input
                type="password"
                value={form.tempPassword}
                onChange={(e) => update("tempPassword", e.target.value)}
                className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                  errors.tempPassword ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.tempPassword && <p className="mt-1 text-xs text-red-500">{errors.tempPassword}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                New Password *
              </label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => update("newPassword", e.target.value)}
                className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                  errors.newPassword ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                className={`bg-gray-50 border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                  errors.confirmPassword ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 bg-[#689f38] hover:bg-[#558b2f] text-white rounded-xl py-3 w-full font-semibold transition-colors disabled:opacity-60"
          >
            {submitting ? "Setting up your account…" : "Set password and continue"}
          </button>

          <p className="mt-4 text-xs text-gray-400 text-center">
            For this demo, the temporary password is{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded">Temp1234</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
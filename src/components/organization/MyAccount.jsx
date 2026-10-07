import { useState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { authedRequest } from "../../api";

const ROLE_LABEL = { owner: "Owner", finance_manager: "Finance Manager", member: "Member" };

// Names may contain letters from any language (so "Peña" and "Muñoz" work),
// spaces, apostrophes (straight or curly), hyphens and periods — the same
// set the server accepts. Anything else is dropped as it's typed.
const NAME_STRIP = /[^\p{L}\p{M} '’.-]/gu;
const NAME_VALID = /^[\p{L}\p{M}][\p{L}\p{M} '’.-]*$/u;
const PHONE_STRIP = /[^0-9+() .-]/g;
const NEW_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

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

function FormField({ label, required, value, onChange, error, placeholder, type = "text", readOnly, hint, maxLength, inputMode }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        value={value}
        onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        className={`border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
          readOnly ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" : "bg-[#f4f4f4] text-gray-800"
        } ${error ? "border-red-400" : "border-gray-200"}`}
      />
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function validateNamePart(value, label) {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (!NAME_VALID.test(v)) return `${label} must start with a letter and can only contain letters, spaces, apostrophes, hyphens, and periods.`;
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  if (v.length > 50) return `${label} must be 50 characters or fewer.`;
  return null;
}

const EMPTY_PASSWORD_FORM = { current: "", newPassword: "", confirm: "" };
const pickEditable = (u) => ({ firstName: u.firstName || "", lastName: u.lastName || "", phone: u.phone || "" });

// The server reports field problems as a list of details; show the first
// specific one rather than a bare "Validation failed".
const messageFrom = (err, fallback) =>
  (Array.isArray(err?.details) && err.details[0]?.message) || err?.message || fallback;

// user is the logged-in account from the dashboard; onProfileUpdated tells
// the dashboard about a saved change so the sidebar and greeting update
// straight away instead of only after a refresh.
export default function MyAccount({ onProfileUpdated }) {
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordServerError, setPasswordServerError] = useState("");
  const [requesting, setRequesting] = useState(false);
  // Changing a password is two steps: asking for the change (which checks
  // the current password and emails a code), then confirming the code.
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // "Already running" flags, set the instant an action starts. The disabled
  // buttons above already stop a second click once React has re-rendered;
  // these also stop two calls landing in the same instant, which matters for
  // actions that send an email or change a password.
  const savingRef = useRef(false);
  const requestingRef = useRef(false);
  const verifyingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const me = await authedRequest("/api/auth/me");
        if (cancelled) return;
        setSaved(me);
        setForm(pickEditable(me));
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load your account.");
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
        <h2 className="text-3xl font-bold text-gray-900">My Account</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading account…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">My Account</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  // Only what actually changed is checked and sent. An untouched field (say,
  // an older phone number saved before today's rules) never blocks you from
  // fixing something else, and a save can't overwrite a field you didn't touch.
  const original = pickEditable(saved);
  const trimmed = { firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() };
  const changes = {};
  for (const key of ["firstName", "lastName", "phone"]) {
    if (trimmed[key] !== original[key]) changes[key] = trimmed[key];
  }
  const isDirty = Object.keys(changes).length > 0;
  const fullName = `${saved.firstName} ${saved.lastName}`.trim();
  const initials = `${saved.firstName?.[0] ?? ""}${saved.lastName?.[0] ?? ""}`.toUpperCase();
  const roleLabel = ROLE_LABEL[saved.orgRole] || "Member";

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSaveError("");
  }

  function handleCancelInfo() {
    setForm(pickEditable(saved));
    setErrors({});
    setSaveError("");
  }

  async function handleSaveInfo() {
    if (savingRef.current || !isDirty) return;
    const digits = form.phone.replace(/\D/g, "");
    const newErrors = {
      lastName: "lastName" in changes ? validateNamePart(form.lastName, "Last name") : null,
      firstName: "firstName" in changes ? validateNamePart(form.firstName, "First name") : null,
      phone: "phone" in changes && changes.phone && digits.length < 7 ? "Enter a valid phone number (at least 7 digits)." : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      // Only the changed fields go. Email is never among them: it can't be
      // changed from here.
      const updated = await authedRequest("/api/auth/me", { method: "PATCH", body: changes });
      // Merged, not replaced: the server's reply holds only the personal
      // fields, and replacing would lose the role and cooperative shown above.
      setSaved((prev) => ({ ...prev, ...updated }));
      setForm(pickEditable(updated));
      onProfileUpdated?.(updated);
      setToastMessage("Personal information updated successfully");
    } catch (err) {
      setSaveError(messageFrom(err, "Something went wrong. Please try again."));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function updatePasswordField(field, value) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
    setPasswordServerError("");
  }

  function resetPasswordFlow() {
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordErrors({});
    setPasswordServerError("");
    setAwaitingCode(false);
    setCode("");
    setCodeError("");
  }

  async function handleRequestChange() {
    if (requestingRef.current) return;
    const newErrors = {
      current: !passwordForm.current ? "Current password is required." : null,
      newPassword: !passwordForm.newPassword
        ? "New password is required."
        : !NEW_PASSWORD_REGEX.test(passwordForm.newPassword)
        ? "Use at least 8 characters with an uppercase letter, a lowercase letter, a number, and a special character (e.g. @ # $ ! % &)."
        : passwordForm.newPassword === passwordForm.current
        ? "New password can't be the same as your current password."
        : null,
      confirm: !passwordForm.confirm
        ? "Please confirm your new password."
        : passwordForm.confirm !== passwordForm.newPassword
        ? "Passwords don't match."
        : null,
    };
    setPasswordErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    requestingRef.current = true;
    setRequesting(true);
    setPasswordServerError("");
    try {
      await authedRequest("/api/auth/change-password/request", {
        method: "POST",
        body: { currentPassword: passwordForm.current, newPassword: passwordForm.newPassword },
      });
      setAwaitingCode(true);
    } catch (err) {
      const message = messageFrom(err, "Something went wrong. Please try again.");
      if (/current password/i.test(message)) setPasswordErrors({ current: message });
      else setPasswordServerError(message);
    } finally {
      requestingRef.current = false;
      setRequesting(false);
    }
  }

  async function handleVerifyCode() {
    if (verifyingRef.current || code.length !== 6) return;
    verifyingRef.current = true;
    setVerifying(true);
    setCodeError("");
    try {
      // Only the code is sent — the passwords were already handed over in
      // the first step and are held (hashed) by the server until this succeeds.
      await authedRequest("/api/auth/change-password/verify", { method: "POST", body: { code } });
      resetPasswordFlow();
      setToastMessage("Password updated successfully");
    } catch (err) {
      setCodeError(messageFrom(err, "Invalid or expired code."));
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">My Account</h2>
      <p className="mt-1 text-gray-500">Your personal details and login security</p>

      {/* Summary card */}
      <div className="mt-6 bg-[#f5f8f3] border border-[#d8e5d2] rounded-2xl p-6 mb-6 flex items-center gap-6">
        <div className="w-20 h-20 bg-[#2d4027] text-white rounded-full flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold">{initials}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{fullName}</p>
          <p className="text-sm font-medium text-gray-600">
            {roleLabel}
            {saved.orgName ? ` · ${saved.orgName}` : ""}
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900 font-semibold text-lg">Personal Information</h3>
          <span className="bg-[#e8f5e9] text-[#2e7d32] text-xs font-semibold px-3 py-1 rounded-full">{roleLabel}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField
            label="Last Name"
            required
            value={form.lastName}
            onChange={(v) => update("lastName", v.replace(NAME_STRIP, ""))}
            error={errors.lastName}
            placeholder="Dela Cruz"
            maxLength={50}
          />
          <FormField
            label="First Name"
            required
            value={form.firstName}
            onChange={(v) => update("firstName", v.replace(NAME_STRIP, ""))}
            error={errors.firstName}
            placeholder="Juan"
            maxLength={50}
          />
          <FormField
            label="Phone Number (optional)"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(v) => update("phone", v.replace(PHONE_STRIP, ""))}
            error={errors.phone}
            placeholder="+63 917 123 4567"
            maxLength={30}
            hint="Your personal number — your cooperative's contact number is on Cooperative Profile."
          />
          <FormField
            label="Email Address"
            type="email"
            value={saved.email || ""}
            readOnly
            hint="Your email is used to sign in and to receive verification codes, so it can't be changed here."
          />
        </div>

        {saveError && <p className="mb-4 text-sm text-red-600">{saveError}</p>}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleCancelInfo}
            disabled={!isDirty || saving}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveInfo}
            disabled={!isDirty || saving}
            className="bg-[#4f7331] hover:bg-[#3f5d27] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-gray-900 font-semibold text-lg">Change Password</h3>

        {awaitingCode ? (
          <>
            <p className="text-xs text-gray-500 mb-6">
              We sent a 6-digit code to <strong>{saved.email}</strong>. It can take a minute to arrive, and it may land in
              your spam folder.
            </p>
            <div className="max-w-xs mb-6">
              <FormField
                label="Verification Code"
                required
                inputMode="numeric"
                value={code}
                onChange={(v) => {
                  setCode(v.replace(/\D/g, "").slice(0, 6));
                  setCodeError("");
                }}
                error={codeError}
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={resetPasswordFlow}
                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={verifying || code.length !== 6}
                className="bg-[#4f7331] hover:bg-[#3f5d27] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? "Verifying…" : "Confirm change"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-6">
              Use at least 8 characters, with a mix of letters, numbers, and a special character. We'll email you a code to
              confirm the change.
            </p>

            <div className="space-y-4 mb-6">
              <FormField
                label="Current Password"
                required
                type="password"
                value={passwordForm.current}
                onChange={(v) => updatePasswordField("current", v)}
                error={passwordErrors.current}
                placeholder="Enter your current password"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="New Password"
                  required
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(v) => updatePasswordField("newPassword", v)}
                  error={passwordErrors.newPassword}
                  placeholder="Create a new password"
                />
                <FormField
                  label="Confirm New Password"
                  required
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(v) => updatePasswordField("confirm", v)}
                  error={passwordErrors.confirm}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            {passwordServerError && <p className="mb-4 text-sm text-red-600">{passwordServerError}</p>}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={resetPasswordFlow}
                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChange}
                disabled={requesting}
                className="bg-[#4f7331] hover:bg-[#3f5d27] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requesting ? "Sending code…" : "Update password"}
              </button>
            </div>
          </>
        )}
      </div>

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
    </div>
  );
}
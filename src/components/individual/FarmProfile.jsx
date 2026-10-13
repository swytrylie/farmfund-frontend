import { useState, useEffect, useRef } from "react";
import { User, Home, Lock, Camera, Eye, EyeOff, CheckCircle2, Award } from "lucide-react";
import { authedRequest } from "../../api";
import {
  ACCEPT,
  listMine,
  uploadCertificate,
  deleteCertificate,
  openCertificate,
  fileProblem,
  bytesText,
  messageFrom as certMessageFrom,
} from "../../lib/certificates";
import { StatusBadge, FileIcon, ReviewLine, CertificateMeta } from "../shared/CertificatesPanel";

const TABS = [
  { key: "personal-info", label: "Personal Info", icon: User },
  { key: "farm-details", label: "Farm Details", icon: Home },
  { key: "certificates", label: "Certificates", icon: Award },
  { key: "account-security", label: "Account & Security", icon: Lock },
];

// The server explains exactly what was wrong (e.g. "Incorrect code. 3 attempts
// left." or "Please wait 42 seconds before requesting another code."). Show
// that, not a generic failure.
const messageFrom = (err, fallback) =>
  (Array.isArray(err?.details) && err.details[0]?.message) || err?.message || fallback;

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
      {children}
    </label>
  );
}

function TextField({ label, value, onChange, error, placeholder, type = "text" }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-white border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function FormActions({ onCancel, onSave, saving, saveLabel = "Save changes" }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-[#4f7331] text-white text-sm font-semibold hover:bg-[#3f6238] transition-colors disabled:opacity-60"
      >
        {saving ? "Saving…" : saveLabel}
      </button>
      <button
        onClick={onCancel}
        className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

function ProfileHero({ user, farm, completeness, avatarUrl, onAvatarChange }) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return (
    <div className="bg-[#f9faf7] border border-gray-200 rounded-2xl p-6 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-6">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="bg-black rounded-full w-16 h-16 flex items-center justify-center text-white text-xl font-bold">
              {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
            </div>
          )}
          {/* Local preview only — no real file-upload service exists yet,
              so this won't survive a page refresh. Honest about that
              limitation rather than pretending it saves anywhere. */}
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
            aria-label="Change profile picture"
          >
            <Camera size={12} className="text-gray-600" />
          </label>
          <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={(e) => onAvatarChange(e.target.files?.[0])} />
        </div>

        <div>
          <p className="font-bold text-gray-900 text-lg">{fullName || "Unnamed"}</p>
          <p className="text-sm text-gray-600">{farm?.name || "No farm set up yet"}</p>
          <p className="text-xs text-gray-400">{farm?.location?.address || ""}</p>
        </div>
      </div>

      <div className="w-full sm:w-56 shrink-0">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-gray-500 uppercase tracking-wider">Profile Completeness</span>
          <span className="font-bold text-gray-900">{completeness}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#4f7331] rounded-full transition-all" style={{ width: `${completeness}%` }} />
        </div>
      </div>
    </div>
  );
}

function PersonalInfoTab({ user, onUserUpdated, showToast, onGoToSecurity }) {
  const original = { firstName: user.firstName, lastName: user.lastName, phone: user.phone || "" };
  const [draft, setDraft] = useState(original);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSaveError("");
  }

  async function handleSave() {
    if (savingRef.current) return;

    const trimmed = { firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), phone: draft.phone.trim() };
    const newErrors = {
      firstName: !trimmed.firstName ? "First name is required." : null,
      lastName: !trimmed.lastName ? "Last name is required." : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    // Only what actually changed is sent. The email is never part of this:
    // changing it needs a code sent to the new address (Account & Security).
    const changes = {};
    for (const key of ["firstName", "lastName", "phone"]) {
      if (trimmed[key] !== original[key]) changes[key] = trimmed[key];
    }
    if (Object.keys(changes).length === 0) {
      showToast("Nothing to save — no changes made.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      const updated = await authedRequest("/api/auth/me", { method: "PATCH", body: changes });
      onUserUpdated((prev) => ({ ...prev, ...updated }));
      showToast("Profile updated successfully!");
    } catch (err) {
      setSaveError(messageFrom(err, "Something went wrong. Please try again."));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(original);
    setErrors({});
    setSaveError("");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Personal Info</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="First Name" value={draft.firstName} onChange={(v) => update("firstName", v)} error={errors.firstName} placeholder="Juan" />
        <TextField label="Last Name" value={draft.lastName} onChange={(v) => update("lastName", v)} error={errors.lastName} placeholder="Dela Cruz" />
        <div>
          <FieldLabel>Email Address</FieldLabel>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full text-gray-700 break-all">{user.email}</div>
          <p className="mt-1 text-xs text-gray-400">
            To change your email, we send a code to the new address.{" "}
            <button type="button" onClick={onGoToSecurity} className="text-[#4f7331] font-semibold hover:underline">
              Change email
            </button>
          </p>
        </div>
        <TextField label="Phone Number" value={draft.phone} onChange={(v) => update("phone", v)} placeholder="09171234567" />
      </div>
      {saveError && <p className="mt-3 text-xs text-red-500">{saveError}</p>}
      <FormActions onCancel={handleCancel} onSave={handleSave} saving={saving} />
    </div>
  );
}

function FarmDetailsTab({ farm, onFarmUpdated, showToast }) {
  const [draft, setDraft] = useState({
    name: farm?.name || "",
    address: farm?.location?.address || "",
    totalAreaHectares: farm?.totalAreaHectares ? String(farm.totalAreaHectares) : "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!draft.name.trim()) {
      setError("Enter a farm name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        name: draft.name.trim(),
        location: { address: draft.address.trim() },
        totalAreaHectares: draft.totalAreaHectares ? Number(draft.totalAreaHectares) : undefined,
      };
      const updated = await authedRequest(`/api/farms/${farm._id}`, { method: "PATCH", body });
      onFarmUpdated(updated);
      showToast("Profile updated successfully!");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft({
      name: farm?.name || "",
      address: farm?.location?.address || "",
      totalAreaHectares: farm?.totalAreaHectares ? String(farm.totalAreaHectares) : "",
    });
    setError("");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Farm Details</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="Farm Name" value={draft.name} onChange={(v) => setDraft((p) => ({ ...p, name: v }))} placeholder="e.g., Dizon Family Farm" />
        <TextField label="Location" value={draft.address} onChange={(v) => setDraft((p) => ({ ...p, address: v }))} placeholder="City, Province" />
        <TextField
          label="Total Farm Size (Hectares)"
          value={draft.totalAreaHectares}
          onChange={(v) => setDraft((p) => ({ ...p, totalAreaHectares: v.replace(/[^\d.]/g, "") }))}
          placeholder="2.5"
        />
      </div>
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      <FormActions onCancel={handleCancel} onSave={handleSave} saving={saving} />
    </div>
  );
}

function ChangePasswordCard({ showToast }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Now a two-step flow — request() verifies the current password and
  // sends a real OTP; nothing about the password itself is changed until
  // verify() confirms that code. awaitingOtp switches this panel into
  // the code-entry view in between.
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function handleRequestChange() {
    const newErrors = {
      currentPassword: !currentPassword ? "Current password is required." : null,
      newPassword:
        newPassword.length < 8
          ? "Password must be at least 8 characters."
          : !/[A-Za-z]/.test(newPassword)
          ? "Password must contain a letter."
          : !/[0-9]/.test(newPassword)
          ? "Password must contain a number."
          : null,
      confirmPassword: confirmPassword !== newPassword ? "Passwords don't match." : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSaving(true);
    try {
      await authedRequest("/api/auth/change-password/request", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      setAwaitingOtp(true);
    } catch (err) {
      setErrors({ currentPassword: messageFrom(err, "Something went wrong. Please try again.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyOtp() {
    if (verifying) return;
    setOtpError("");
    setVerifying(true);
    try {
      await authedRequest("/api/auth/change-password/verify", { method: "POST", body: { code: otpCode } });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpCode("");
      setAwaitingOtp(false);
      showToast("Password updated successfully!");
    } catch (err) {
      setOtpError(messageFrom(err, "Invalid or expired code."));
    } finally {
      setVerifying(false);
    }
  }

  if (awaitingOtp) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-2">Enter Verification Code</h3>
        <p className="text-sm text-gray-500 mb-4">
          We sent a 6-digit code to your email. Enter it below to confirm this password change.
        </p>
        <FieldLabel>Verification Code</FieldLabel>
        <input
          type="text"
          value={otpCode}
          onChange={(e) => {
            setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setOtpError("");
          }}
          placeholder="123456"
          className={`bg-white border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
            otpError ? "border-red-400" : "border-gray-200"
          }`}
        />
        {otpError && <p className="mt-1 text-xs text-red-500">{otpError}</p>}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleVerifyOtp}
            disabled={verifying || otpCode.length !== 6}
            className="px-6 py-2.5 rounded-xl bg-[#4f7331] text-white text-sm font-semibold hover:bg-[#3f6238] transition-colors disabled:opacity-60"
          >
            {verifying ? "Verifying…" : "Confirm Change"}
          </button>
          <button
            onClick={() => {
              setAwaitingOtp(false);
              setOtpCode("");
              setOtpError("");
            }}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Change Password</h3>
      <div className="space-y-4">
        <div>
          <FieldLabel>Current Password</FieldLabel>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`bg-white border rounded-xl px-4 py-2.5 pr-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                errors.currentPassword ? "border-red-400" : "border-gray-200"
              }`}
            />
            <button type="button" onClick={() => setShowCurrent((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>}
        </div>

        <div>
          <FieldLabel>New Password</FieldLabel>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`bg-white border rounded-xl px-4 py-2.5 pr-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                errors.newPassword ? "border-red-400" : "border-gray-200"
              }`}
            />
            <button type="button" onClick={() => setShowNew((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}
        </div>

        <div>
          <FieldLabel>Confirm New Password</FieldLabel>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`bg-white border rounded-xl px-4 py-2.5 pr-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
                errors.confirmPassword ? "border-red-400" : "border-gray-200"
              }`}
            />
            <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>
      </div>

      <button
        onClick={handleRequestChange}
        disabled={saving}
        className="mt-6 px-6 py-2.5 rounded-xl bg-[#4f7331] text-white text-sm font-semibold hover:bg-[#3f6238] transition-colors disabled:opacity-60"
      >
        {saving ? "Sending code…" : "Update Password"}
      </button>
    </div>
  );
}

function ChangeEmailCard({ user, showToast, onEmailChanged }) {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const verifyingRef = useRef(false);

  function resetAll() {
    setNewEmail("");
    setPassword("");
    setFormError("");
    setAwaitingOtp(false);
    setSentTo("");
    setOtpCode("");
    setOtpError("");
  }

  async function handleRequest() {
    if (sendingRef.current) return;
    const email = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (email.toLowerCase() === (user.email || "").toLowerCase()) {
      setFormError("That is already your email address.");
      return;
    }
    if (!password) {
      setFormError("Enter your current password to confirm it's you.");
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setFormError("");
    try {
      await authedRequest("/api/auth/change-email/request", {
        method: "POST",
        body: { newEmail: email, password },
      });
      setSentTo(email);
      setPassword("");
      setAwaitingOtp(true);
    } catch (err) {
      setFormError(messageFrom(err, "Something went wrong. Please try again."));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function handleVerify() {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setVerifying(true);
    setOtpError("");
    try {
      const result = await authedRequest("/api/auth/change-email/verify", { method: "POST", body: { code: otpCode } });
      onEmailChanged(result?.email || sentTo);
      resetAll();
      showToast("Email updated successfully!");
    } catch (err) {
      setOtpError(messageFrom(err, "Invalid or expired code."));
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  }

  if (awaitingOtp) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-2">Confirm Your New Email</h3>
        <p className="text-sm text-gray-500 mb-4">
          We sent a 6-digit code to <strong>{sentTo}</strong>. Enter it below. Your email stays{" "}
          <strong>{user.email}</strong> until you do.
        </p>
        <FieldLabel>Verification Code</FieldLabel>
        <input
          type="text"
          value={otpCode}
          onChange={(e) => {
            setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setOtpError("");
          }}
          placeholder="123456"
          className={`bg-white border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
            otpError ? "border-red-400" : "border-gray-200"
          }`}
        />
        {otpError && <p className="mt-1 text-xs text-red-500">{otpError}</p>}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleVerify}
            disabled={verifying || otpCode.length !== 6}
            className="px-6 py-2.5 rounded-xl bg-[#4f7331] text-white text-sm font-semibold hover:bg-[#3f6238] transition-colors disabled:opacity-60"
          >
            {verifying ? "Verifying…" : "Confirm Email"}
          </button>
          <button
            onClick={resetAll}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-1">Change Email</h3>
      <p className="text-sm text-gray-500 mb-4">
        Your email is <strong>{user.email}</strong>. We'll send a code to the new address to make sure it's yours.
      </p>
      <div className="space-y-4">
        <div>
          <FieldLabel>New Email Address</FieldLabel>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => {
              setNewEmail(e.target.value);
              setFormError("");
            }}
            placeholder="you@example.com"
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
          />
        </div>
        <div>
          <FieldLabel>Current Password</FieldLabel>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormError("");
              }}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30"
            />
            <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>
      {formError && <p className="mt-3 text-xs text-red-500">{formError}</p>}
      <button
        onClick={handleRequest}
        disabled={sending}
        className="mt-6 px-6 py-2.5 rounded-xl bg-[#4f7331] text-white text-sm font-semibold hover:bg-[#3f6238] transition-colors disabled:opacity-60"
      >
        {sending ? "Sending code…" : "Send Code"}
      </button>
    </div>
  );
}

function AccountSecurityTab({ user, showToast, onEmailChanged }) {
  return (
    <div className="space-y-6">
      <ChangePasswordCard showToast={showToast} />
      <ChangeEmailCard user={user} showToast={showToast} onEmailChanged={onEmailChanged} />
    </div>
  );
}

function todayText() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function DeleteCertificateModal({ cert, busy, error, onConfirm, onCancel }) {
  const cancel = () => {
    if (!busy) onCancel();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={cancel}>
      <div
        role="dialog"
        aria-label="Delete certificate"
        className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-900">Delete this certificate?</h3>
        <p className="text-sm text-gray-500 mt-1">
          “{cert.title}” will be removed for good. Your cooperative and the FarmFund admin will no longer see it.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={cancel}
            disabled={busy}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-5 py-2 rounded-xl bg-[#8b0000] hover:bg-[#660000] text-white text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CertificatesTab({ showToast }) {
  const [items, setItems] = useState([]);
  const [max, setMax] = useState(20);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0); // changing it clears the file box
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const uploadingRef = useRef(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const deleteRef = useRef(false);

  const [openingId, setOpeningId] = useState(null);
  const openingRef = useRef(false);
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const result = await listMine();
      setItems(result.certificates || []);
      if (result.max) setMax(result.max);
    } catch (err) {
      setLoadError(certMessageFrom(err, "Could not load your certificates."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await listMine();
        if (cancelled) return;
        setItems(result.certificates || []);
        if (result.max) setMax(result.max);
      } catch (err) {
        if (!cancelled) setLoadError(certMessageFrom(err, "Could not load your certificates."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const full = items.length >= max;

  async function handleUpload() {
    if (uploadingRef.current) return;
    const t = title.trim();
    const i = issuer.trim();
    const newErrors = {
      title: !t ? "Enter a title." : t.length < 3 ? "The title must be at least 3 characters." : t.length > 100 ? "The title must be 100 characters or fewer." : /[<>]/.test(t) ? "The title can't contain < or >." : null,
      issuer: i.length > 100 ? "Must be 100 characters or fewer." : /[<>]/.test(i) ? "Can't contain < or >." : null,
      issuedOn: issuedOn && issuedOn > todayText() ? "The date can't be in the future." : null,
      file: fileProblem(file) || null,
    };
    setErrors(newErrors);
    setFormError("");
    if (Object.values(newErrors).some(Boolean)) return;

    const form = new FormData();
    form.append("title", t);
    if (i) form.append("issuer", i);
    if (issuedOn) form.append("issuedOn", issuedOn);
    form.append("file", file);

    uploadingRef.current = true;
    setUploading(true);
    try {
      const result = await uploadCertificate(form);
      setItems((prev) => [result.certificate, ...prev]);
      setTitle("");
      setIssuer("");
      setIssuedOn("");
      setFile(null);
      setFileKey((k) => k + 1);
      setErrors({});
      showToast("Certificate uploaded!");
    } catch (err) {
      setFormError(certMessageFrom(err, "The upload failed. Please try again."));
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  }

  async function handleView(cert) {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpeningId(cert.id);
    setNotice("");
    try {
      const opened = await openCertificate(cert.id);
      if (!opened) setNotice("Your browser blocked the new tab. Allow pop-ups for this site and try again.");
    } catch (err) {
      setNotice(certMessageFrom(err, "Could not open that certificate."));
    } finally {
      openingRef.current = false;
      setOpeningId(null);
    }
  }

  async function handleDelete() {
    if (deleteRef.current || !deleting) return;
    deleteRef.current = true;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await deleteCertificate(deleting.id);
      setItems((prev) => prev.filter((c) => c.id !== deleting.id));
      setDeleting(null);
      showToast("Certificate deleted.");
    } catch (err) {
      if (err && err.status === 404) {
        setItems((prev) => prev.filter((c) => c.id !== deleting.id)); // already gone
        setDeleting(null);
      } else {
        setDeleteError(certMessageFrom(err, "Could not delete it. Please try again."));
      }
    } finally {
      deleteRef.current = false;
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-1">Upload a Certificate</h3>
        <p className="text-sm text-gray-500 mb-4">
          Add a training certificate, permit or registration. Your cooperative and the FarmFund admin can view it, and the
          FarmFund admin will verify it. PDF, JPG or PNG, up to 2 MB.
        </p>

        {full ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            You have reached the limit of {max} certificates. Delete one to add another.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <TextField
                  label="Title *"
                  value={title}
                  onChange={(v) => {
                    setTitle(v);
                    setErrors((p) => ({ ...p, title: undefined }));
                  }}
                  error={errors.title}
                  placeholder="e.g., Organic Farming Training"
                />
              </div>
              <TextField
                label="Issued by (optional)"
                value={issuer}
                onChange={(v) => {
                  setIssuer(v);
                  setErrors((p) => ({ ...p, issuer: undefined }));
                }}
                error={errors.issuer}
                placeholder="e.g., Department of Agriculture"
              />
              <TextField
                label="Date issued (optional)"
                type="date"
                value={issuedOn}
                onChange={(v) => {
                  setIssuedOn(v);
                  setErrors((p) => ({ ...p, issuedOn: undefined }));
                }}
                error={errors.issuedOn}
              />
              <div className="sm:col-span-2">
                <FieldLabel>File *</FieldLabel>
                <input
                  key={fileKey}
                  type="file"
                  accept={ACCEPT}
                  aria-label="Certificate file"
                  disabled={uploading}
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setErrors((p) => ({ ...p, file: undefined }));
                  }}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-[#f4f8f3] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#3f6238] hover:file:bg-[#e8f0e4]"
                />
                {file && !errors.file && (
                  <p className="mt-1 text-xs text-gray-400">
                    {file.name} · {bytesText(file.size)}
                  </p>
                )}
                {errors.file && <p className="mt-1 text-xs text-red-500">{errors.file}</p>}
              </div>
            </div>
            {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2.5 rounded-xl bg-[#4f7331] text-white text-sm font-semibold hover:bg-[#3f6238] transition-colors disabled:opacity-60"
              >
                {uploading ? "Uploading…" : "Upload Certificate"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">My Certificates</h3>
          {!loading && !loadError && (
            <span className="text-xs text-gray-400">
              {items.length} of {max}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
        ) : loadError ? (
          <p className="text-sm text-red-600 text-center py-6">
            {loadError}{" "}
            <button onClick={load} className="font-semibold underline">
              Try again
            </button>
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No certificates yet. Upload your first one above.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((c) => (
              <li key={c.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FileIcon type={c.fileType} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 break-words min-w-0">{c.title}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <CertificateMeta cert={c} />
                    <ReviewLine cert={c} />
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleView(c)}
                        disabled={openingId !== null}
                        aria-label={`View ${c.title}`}
                        className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50"
                      >
                        {openingId === c.id ? "Opening…" : "View"}
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError("");
                          setDeleting(c);
                        }}
                        aria-label={`Delete ${c.title}`}
                        className="border border-gray-300 text-[#c62828] hover:bg-[#fbe9e7] px-4 py-1.5 rounded-xl text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {notice && (
          <p role="status" className="mt-3 text-xs text-red-600 font-medium">
            {notice}
          </p>
        )}
      </div>

      {deleting && (
        <DeleteCertificateModal
          cert={deleting}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

export default function FarmProfile() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [user, setUser] = useState(null);
  const [farm, setFarm] = useState(null);
  const [activeTab, setActiveTab] = useState("personal-info");
  const [toastMessage, setToastMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const [me, farms] = await Promise.all([
          authedRequest("/api/auth/me"),
          authedRequest("/api/farms"),
        ]);
        if (cancelled) return;
        setUser(me);
        setFarm(farms[0] || null);
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

  function handleAvatarChange(file) {
    if (!file) return;
    if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    setAvatarUrl(URL.createObjectURL(file));
  }
  useEffect(() => () => { if (avatarUrl) URL.revokeObjectURL(avatarUrl); }, [avatarUrl]);

  function showToast(message) {
    setToastMessage(message);
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Farm Profile</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">Loading profile…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Farm Profile</h2>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{loadError}</div>
      </div>
    );
  }

  // Completeness only counts fields that genuinely exist on the real
  // User/Farm models — not the larger mock field set this page used to have.
  const fields = [user.firstName, user.lastName, user.email, user.phone, farm?.name, farm?.location?.address, farm?.totalAreaHectares];
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Farm Profile</h2>

      <ProfileHero user={user} farm={farm} completeness={completeness} avatarUrl={avatarUrl} onAvatarChange={handleAvatarChange} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-left transition-colors ${
                  isActive ? "bg-[#4f7331] text-white font-semibold" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          {activeTab === "personal-info" && (
            <PersonalInfoTab user={user} onUserUpdated={setUser} showToast={showToast} onGoToSecurity={() => setActiveTab("account-security")} />
          )}
          {activeTab === "farm-details" &&
            (farm ? (
              <FarmDetailsTab farm={farm} onFarmUpdated={setFarm} showToast={showToast} />
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm text-center text-gray-400 text-sm">
                No farm set up yet — create one from Income & Expenses first.
              </div>
            ))}
          {activeTab === "certificates" && <CertificatesTab showToast={showToast} />}
          {activeTab === "account-security" && (
            <AccountSecurityTab user={user} showToast={showToast} onEmailChanged={(email) => setUser((prev) => ({ ...prev, email }))} />
          )}
        </div>
      </div>

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
    </div>
  );
}
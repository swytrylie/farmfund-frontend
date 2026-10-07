import { useState, useEffect, useRef } from "react";
import { User, Home, Lock, Camera, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { authedRequest } from "../../api";

const TABS = [
  { key: "personal-info", label: "Personal Info", icon: User },
  { key: "farm-details", label: "Farm Details", icon: Home },
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
          {activeTab === "account-security" && (
            <AccountSecurityTab user={user} showToast={showToast} onEmailChanged={(email) => setUser((prev) => ({ ...prev, email }))} />
          )}
        </div>
      </div>

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
    </div>
  );
}
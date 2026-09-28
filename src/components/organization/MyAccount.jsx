import { useState, useEffect } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import {
  getMyAccount,
  saveMyAccount,
  updatePassword,
  MOCK_CURRENT_PASSWORD,
} from "../../mocks/organization/orgMyAccount.mock";

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

function FormField({ label, required, value, onChange, error, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-[#f4f4f4] border rounded-xl px-4 py-2.5 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]/30 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function validateNamePart(value, label, required) {
  if (!value.trim()) return required ? `${label} is required.` : null;
  if (!NAME_REGEX.test(value))
    return `${label} can only contain letters, spaces, hyphens, and apostrophes.`;
  if (value.trim().length < 2) return `${label} must be at least 2 characters.`;
  if (value.length > 50) return `${label} must be 50 characters or fewer.`;
  return null;
}

const EMPTY_PASSWORD_FORM = { current: "", newPassword: "", confirm: "" };

export default function MyAccount() {
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    getMyAccount().then((data) => {
      if (!cancelled) {
        setSaved(data);
        setForm(data);
        setAvatarUrl(data.avatarUrl);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Clean up the object URL when a new one replaces it or the page unmounts
  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-900">My Account</h2>
        <div className="mt-6 text-center text-gray-400 text-sm py-10">
          Loading account…
        </div>
      </div>
    );
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(saved);
  const fullName = `${saved.firstName} ${saved.lastName}`.trim();
  const initials = `${saved.firstName?.[0] ?? ""}${saved.lastName?.[0] ?? ""}`.toUpperCase();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function updateNamePart(field, rawValue) {
    update(field, rawValue.replace(/[^a-zA-Z\s'-]/g, ""));
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    setAvatarUrl(URL.createObjectURL(file));
  }

  function handleCancelInfo() {
    setForm(saved);
    setErrors({});
  }

  async function handleSaveInfo() {
    const newErrors = {
      lastName: validateNamePart(form.lastName, "Last name", true),
      firstName: validateNamePart(form.firstName, "First name", true),
      middleName: validateNamePart(form.middleName, "Middle name", false),
      email: !form.email.trim()
        ? "Email address is required."
        : !EMAIL_REGEX.test(form.email)
        ? "Enter a valid email address."
        : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    await saveMyAccount(form);
    setSaved(form);
    setToastMessage("Personal information updated successfully");
  }

  function updatePasswordField(field, value) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleCancelPassword() {
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordErrors({});
  }

  async function handleUpdatePassword() {
    const newErrors = {
      current: !passwordForm.current
        ? "Current password is required."
        : passwordForm.current !== MOCK_CURRENT_PASSWORD
        ? "That doesn't match your current password."
        : null,
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

    await updatePassword(passwordForm);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setToastMessage("Password updated successfully");
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">My Account</h2>
      <p className="mt-1 text-gray-500">Your personal details and login security</p>

      {/* Avatar summary card */}
      <div className="mt-6 bg-[#f5f8f3] border border-[#d8e5d2] rounded-2xl p-6 mb-6 flex items-center gap-6">
        <div className="w-20 h-20 bg-[#2d4027] text-white rounded-full flex items-center justify-center relative shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-2xl font-bold">{initials}</span>
          )}
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 bg-white border border-gray-300 p-1.5 rounded-full shadow-sm cursor-pointer hover:bg-gray-50"
          >
            <Camera size={14} className="text-gray-600" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{fullName}</p>
          <p className="text-sm font-medium text-gray-600">{saved.role}</p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900 font-semibold text-lg">Personal Information</h3>
          <span className="bg-[#e8f5e9] text-[#2e7d32] text-xs font-semibold px-3 py-1 rounded-full">
            {saved.role}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <FormField
            label="Last Name"
            required
            value={form.lastName}
            onChange={(v) => updateNamePart("lastName", v)}
            error={errors.lastName}
            placeholder="Einstein"
          />
          <FormField
            label="First Name"
            required
            value={form.firstName}
            onChange={(v) => updateNamePart("firstName", v)}
            error={errors.firstName}
            placeholder="Albert"
          />
          <FormField
            label="Middle Name (optional)"
            value={form.middleName}
            onChange={(v) => updateNamePart("middleName", v)}
            error={errors.middleName}
          />
          <FormField
            label="Email Address"
            required
            type="email"
            value={form.email}
            onChange={(v) => update("email", v)}
            error={errors.email}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleCancelInfo}
            disabled={!isDirty}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveInfo}
            className="bg-[#4f7331] hover:bg-[#3f5d27] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Save changes
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-gray-900 font-semibold text-lg">Change Password</h3>
        <p className="text-xs text-gray-500 mb-6">
          Use at least 8 characters, with a mix of letters, numbers, and a
          special character.
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

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleCancelPassword}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdatePassword}
            className="bg-[#4f7331] hover:bg-[#3f5d27] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Update password
          </button>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}
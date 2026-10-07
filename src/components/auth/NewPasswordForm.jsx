import { useEffect, useRef, useState } from "react";
import { Lock, CheckCircle } from "lucide-react";
import FormInput from "./FormInput";
import PasswordStrengthField from "./PasswordStrengthField";
import { validatePassword, validateConfirmPassword } from "../../lib/validation";
import { apiRequest } from "../../api";
import { getPendingReset, clearPendingReset } from "../../lib/passwordReset";

// The server explains exactly what was wrong; show that, not a generic failure.
const messageFrom = (err, fallback) =>
  (Array.isArray(err?.details) && err.details[0]?.message) || err?.message || fallback;

export default function NewPasswordForm({ onSwitchMode }) {
  const [data, setData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // Brief confirmation that OTP verification succeeded, shown once on arrival
  const [showVerifiedNotice, setShowVerifiedNotice] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowVerifiedNotice(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const update = (field) => (e) => {
    const value = e.target.value;
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError("");
  };

  // "Use suggested strong password": fills BOTH fields and reveals them so
  // the person can see and save the generated password.
  const handleUseSuggested = (generated) => {
    setData({ password: generated, confirmPassword: generated });
    setErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }));
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (savingRef.current) return;

    const errs = {};
    const passwordError = validatePassword(data.password);
    if (passwordError) errs.password = passwordError;
    const confirmError = validateConfirmPassword(
      data.confirmPassword,
      data.password
    );
    if (confirmError) errs.confirmPassword = confirmError;

    setErrors(errs);
    setServerError("");
    if (Object.keys(errs).length > 0) return;

    // The reset ticket from the code screen lives only in memory, so a page
    // refresh in between loses it — in that case, start over.
    const pending = getPendingReset();
    if (!pending) {
      setServerError("Your reset session has expired. Please start again.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: { email: pending.email, resetToken: pending.resetToken, newPassword: data.password },
      });
      clearPendingReset();
      setStatusMessage("Password updated! Redirecting you to log in...");
      setTimeout(() => onSwitchMode("login"), 1200);
    } catch (err) {
      setServerError(messageFrom(err, "Something went wrong. Please try again."));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-white text-center">
        Create New Password
      </h2>
      <p className="mt-2 text-center text-white/70">
        Your new password must be different from previous ones.
      </p>

      {showVerifiedNotice && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#42BD41]/15 border border-[#42BD41]/40 py-2 px-3">
          <CheckCircle size={16} className="text-[#8fe28f] shrink-0" />
          <p className="text-xs text-[#8fe28f]">OTP verified successfully!</p>
        </div>
      )}

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <PasswordStrengthField
          icon={Lock}
          placeholder="New Password"
          value={data.password}
          onChange={update("password")}
          error={errors.password}
          visible={showPassword}
          onToggleVisible={() => setShowPassword((p) => !p)}
          onUseSuggested={handleUseSuggested}
        />

        <FormInput
          icon={Lock}
          placeholder="Confirm New Password"
          value={data.confirmPassword}
          onChange={update("confirmPassword")}
          error={errors.confirmPassword}
          showToggle
          visible={showConfirmPassword}
          onToggleVisible={() => setShowConfirmPassword((p) => !p)}
        />

        {serverError && (
          <p className="text-sm text-red-300 text-center">
            {serverError}{" "}
            {/expired|start again/i.test(serverError) && (
              <button type="button" onClick={() => onSwitchMode("forgot-password")} className="font-bold underline">
                Start again
              </button>
            )}
          </p>
        )}

        {statusMessage && (
          <p className="text-sm text-[#8fe28f] text-center">{statusMessage}</p>
        )}

        <button
          type="submit"
          disabled={saving || !!statusMessage}
          className="w-full py-4 rounded-lg bg-[#42BD41] text-white font-bold text-lg hover:bg-[#379637] active:bg-[#2f7f2f] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Reset Password"}
        </button>
      </form>

      <p className="mt-6 text-center text-white/90">
        Remember your password?{" "}
        <button
          onClick={() => onSwitchMode("login")}
          className="font-bold text-white hover:underline"
        >
          Log in
        </button>
      </p>
    </>
  );
}
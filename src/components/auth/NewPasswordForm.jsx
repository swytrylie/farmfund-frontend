import { useEffect, useState } from "react";
import { Lock, CheckCircle } from "lucide-react";
import FormInput from "./FormInput";
import { validatePassword, validateConfirmPassword } from "../../lib/validation";

export default function NewPasswordForm({ onSwitchMode }) {
  const [data, setData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

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
  };

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    const passwordError = validatePassword(data.password);
    if (passwordError) errs.password = passwordError;
    const confirmError = validateConfirmPassword(
      data.confirmPassword,
      data.password
    );
    if (confirmError) errs.confirmPassword = confirmError;

    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      // TODO: replace with a real API call once the backend exists
      console.log("New password submitted:", data.password);
      setStatusMessage("Password updated! Redirecting you to log in...");
      setTimeout(() => onSwitchMode("login"), 1200);
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
        <FormInput
          icon={Lock}
          placeholder="New Password"
          value={data.password}
          onChange={update("password")}
          error={errors.password}
          showToggle
          visible={showPassword}
          onToggleVisible={() => setShowPassword((p) => !p)}
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

        {statusMessage && (
          <p className="text-sm text-[#8fe28f] text-center">{statusMessage}</p>
        )}

        <button
          type="submit"
          className="w-full py-4 rounded-lg bg-[#42BD41] text-white font-bold text-lg hover:bg-[#379637] active:bg-[#2f7f2f] transition-colors"
        >
          Reset Password
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
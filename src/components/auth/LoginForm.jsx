import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import FormInput from "./FormInput";
import { validateLoginForm } from "../../lib/validation";
import { MAX_LOGIN_ATTEMPTS } from "../../lib/lockout";
import { TEST_LOGIN_EMAIL, TEST_LOGIN_PASSWORD } from "../../lib/auth";

// onFailedAttempt is called for any submit that doesn't match the fixed test
// credentials, since there's no real backend yet — this simulates "wrong
// password" so the lockout flow can still be tested end to end.
// onLoginSuccess is called when the test credentials are entered exactly.
export default function LoginForm({
  onSwitchMode,
  attemptsRemaining = MAX_LOGIN_ATTEMPTS,
  onFailedAttempt,
  onLoginSuccess,
}) {
  const [data, setData] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const update = (field) => (e) => {
    const value = field === "remember" ? e.target.checked : e.target.value;
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateLoginForm(data);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      // TODO: replace with a real API call once the backend exists.
      console.log("Login submitted:", data);
      const isTestCredentials =
        data.email.trim().toLowerCase() === TEST_LOGIN_EMAIL &&
        data.password === TEST_LOGIN_PASSWORD;

      if (isTestCredentials) {
        onLoginSuccess?.();
      } else {
        onFailedAttempt?.();
      }
    }
  }

  const hasFailedBefore = attemptsRemaining < MAX_LOGIN_ATTEMPTS;

  return (
    <>
      <h2 className="text-3xl font-bold text-white text-center">Hi, Welcome!</h2>
      <p className="mt-1 text-center text-xs text-white/40">
        (Dev) Try {TEST_LOGIN_EMAIL} / {TEST_LOGIN_PASSWORD}
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <FormInput
          icon={Mail}
          type="email"
          placeholder="Email"
          value={data.email}
          onChange={update("email")}
          error={errors.email}
        />

        <FormInput
          icon={Lock}
          placeholder="Password"
          value={data.password}
          onChange={update("password")}
          error={errors.password}
          showToggle
          visible={showPassword}
          onToggleVisible={() => setShowPassword((p) => !p)}
        />

        <div className="flex items-center justify-between text-sm pt-1">
          <label className="flex items-center gap-2 text-white/90 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.remember}
              onChange={update("remember")}
              className="w-5 h-5 rounded border-white/40 bg-white/10 accent-[#42BD41]"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => onSwitchMode("forgot-password")}
            className="text-white/90 hover:text-white transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        {hasFailedBefore && (
          <p className="text-sm text-red-300 text-center">
            Incorrect email or password. {attemptsRemaining} attempt
            {attemptsRemaining === 1 ? "" : "s"} remaining.
          </p>
        )}

        <button
          type="submit"
          className="w-full py-4 rounded-lg bg-[#42BD41] text-white font-bold text-lg hover:bg-[#379637] active:bg-[#2f7f2f] transition-colors"
        >
          Log In
        </button>
      </form>

      <p className="mt-6 text-center text-white/90">
        Don't have an account?{" "}
        <button
          onClick={() => onSwitchMode("signup-role")}
          className="font-bold text-white hover:underline"
        >
          Sign up
        </button>
      </p>
    </>
  );
}
import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import FormInput from "./FormInput";
import { validateLoginForm } from "../../lib/validation";
import { apiRequest } from "../../api";

export default function LoginForm({
  onSwitchMode,
  onFailedAttempt,
  onLoginSuccess,
}) {
  const [data, setData] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => {
    const value = field === "remember" ? e.target.checked : e.target.value;
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError("");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const validationErrors = validateLoginForm(data);
    setErrors(validationErrors);
    setServerError("");
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: data.email.trim(), password: data.password },
      });
      // result is { accessToken, user }
      onLoginSuccess?.(result);
    } catch (err) {
      if (err.status === 403) {
        // Server says the account is locked: open the locked screen
        onFailedAttempt?.({ locked: true });
      } else {
        setServerError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-white text-center">Hi, Welcome!</h2>

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

        {serverError && (
          <p className="text-sm text-red-300 text-center">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-lg bg-[#42BD41] text-white font-bold text-lg hover:bg-[#379637] active:bg-[#2f7f2f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in…" : "Log In"}
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
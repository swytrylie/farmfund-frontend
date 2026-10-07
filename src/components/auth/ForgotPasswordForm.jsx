import { useRef, useState } from "react";
import { Mail } from "lucide-react";
import FormInput from "./FormInput";
import { validateForgotForm } from "../../lib/validation";
import { apiRequest } from "../../api";

// The server explains exactly what was wrong; show that, not a generic failure.
const messageFrom = (err, fallback) =>
  (Array.isArray(err?.details) && err.details[0]?.message) || err?.message || fallback;

export default function ForgotPasswordForm({ onSwitchMode }) {
  const [data, setData] = useState({ email: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  const update = (field) => (e) => {
    const value = e.target.value;
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError("");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;

    const validationErrors = validateForgotForm(data);
    setErrors(validationErrors);
    setServerError("");
    if (Object.keys(validationErrors).length > 0) return;

    submittingRef.current = true;
    setLoading(true);
    try {
      const email = data.email.trim();
      // The server answers the same way whether or not an account uses this
      // email, so this screen never reveals who has an account.
      await apiRequest("/api/auth/forgot-password", { method: "POST", body: { email } });
      onSwitchMode("otp", email);
    } catch (err) {
      setServerError(messageFrom(err, "Something went wrong. Please try again."));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-white text-center">Forgot Password?</h2>
      <p className="mt-2 text-center text-white/70">
        Enter your email and we'll send you a code to reset your password.
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

        {serverError && <p className="text-sm text-red-300 text-center">{serverError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-lg bg-[#42BD41] text-white font-bold text-lg hover:bg-[#379637] active:bg-[#2f7f2f] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Sending code…" : "Send Code"}
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
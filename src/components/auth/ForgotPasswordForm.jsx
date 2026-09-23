import { useState } from "react";
import { Mail } from "lucide-react";
import FormInput from "./FormInput";
import { validateForgotForm } from "../../lib/validation";

export default function ForgotPasswordForm({ onSwitchMode }) {
  const [data, setData] = useState({ email: "" });
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => {
    const value = e.target.value;
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateForgotForm(data);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      // TODO: replace with a real API call once the backend exists
      console.log("Password reset requested for:", data.email);
      onSwitchMode("otp", data.email);
    }
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-white text-center">Forgot Password?</h2>
      <p className="mt-2 text-center text-white/70">
        Enter your email to reset your password.
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
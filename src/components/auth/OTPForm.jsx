import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;
const TEST_OTP_CODE = "123456"; // Temporary fixed code until a real backend generates one

export default function OTPForm({ email, onSwitchMode }) {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resendNotice, setResendNotice] = useState("");
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  // Countdown ticks every second, stops at 0
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  function formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  // Mock verification: checks against a fixed test code until a real backend exists.
  // Shows a brief "Verifying..." state, then hands off to the new-password screen.
  function runMockVerification(codeDigits = digits) {
    setIsVerifying(true);
    setError("");
    setTimeout(() => {
      setIsVerifying(false);
      if (codeDigits.join("") === TEST_OTP_CODE) {
        onSwitchMode("new-password", email);
      } else {
        setError(`Incorrect code. (Hint: try ${TEST_OTP_CODE} for now.)`);
      }
    }, 1000);
  }

  function handleChange(index, rawValue) {
    if (isVerifying) return;

    const value = rawValue.replace(/[^0-9]/g, "").slice(-1); // keep only the last digit typed
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-proceed to verification once all 6 boxes are filled
    if (value && index === CODE_LENGTH - 1 && next.every((d) => d)) {
      runMockVerification(next);
    }
  }

  function handleKeyDown(index, e) {
    if (isVerifying) return;
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleVerifyClick(e) {
    e.preventDefault();
    if (isVerifying) return;
    // Manual click works too, regardless of whether all boxes are technically filled —
    // this is mock verification, so we don't block on real validation here.
    runMockVerification();
  }

  function handleResend() {
    if (secondsLeft > 0) return;
    // TODO: trigger a real resend-code API call here
    setDigits(Array(CODE_LENGTH).fill(""));
    setSecondsLeft(RESEND_SECONDS);
    setError("");
    inputRefs.current[0]?.focus();

    setResendNotice("New mock OTP sent to your email!");
    setTimeout(() => setResendNotice(""), 3000);
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-white text-center">Enter OTP</h2>
      <p className="mt-2 text-center text-white">
        Enter the 6-digit code sent to:
        <br />
        <span className="text-[#42BD41] font-semibold">
          {email || "your email"}
        </span>
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleVerifyClick} noValidate>
        {/* 6-digit code grid */}
        <div className="flex justify-center gap-2.5">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              placeholder="-"
              value={digit}
              disabled={isVerifying}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-14 rounded-lg bg-white border text-center text-xl font-semibold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#42BD41] focus:border-transparent disabled:opacity-60 ${
                error ? "border-red-400" : "border-white/40"
              }`}
            />
          ))}
        </div>
        {error && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-red-500/15 border border-red-400/40 py-2 px-3 -mt-1">
            <AlertCircle size={16} className="text-red-300 shrink-0" />
            <p className="text-xs text-red-200">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isVerifying}
          className="w-full py-4 rounded-lg bg-[#42BD41] text-white font-bold text-lg hover:bg-[#379637] active:bg-[#2f7f2f] transition-colors disabled:opacity-90 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span className="animate-pulse">Verifying...</span>
            </>
          ) : (
            "Verify"
          )}
        </button>
      </form>

      {/* Resend controls */}
      <div className="mt-5 text-center">
        <p className="text-white/90 text-sm">Didn't receive the code?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={secondsLeft > 0}
          className={`text-sm font-bold mt-1 transition-colors ${
            secondsLeft > 0
              ? "text-white/40 cursor-not-allowed"
              : "text-white hover:underline"
          }`}
        >
          Resend Code
        </button>
        <p className="text-white/60 text-xs mt-1">{formatTime(secondsLeft)}</p>
        {resendNotice && (
          <p className="mt-2 text-sm text-[#8fe28f]">{resendNotice}</p>
        )}
      </div>

      <p className="mt-5 text-center text-white/90">
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
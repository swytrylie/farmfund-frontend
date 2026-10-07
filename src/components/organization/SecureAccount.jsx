import { useEffect, useRef, useState } from "react";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { apiRequest } from "../../api";

// The server explains exactly what was wrong; show that, not a generic failure.
const messageFrom = (err, fallback) =>
  (Array.isArray(err?.details) && err.details[0]?.message) || err?.message || fallback;

// Opened from the "Your FarmFund email address was changed" email, which goes
// to the OLD address. Opening the link changes nothing by itself (email
// scanners open links) — only the red button does.
export default function SecureAccount() {
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState("ask"); // ask | working | secured | thisWasMe
  const [restoredEmail, setRestoredEmail] = useState("");
  const [error, setError] = useState("");
  const workingRef = useRef(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"));
  }, []);

  async function handleSecure() {
    if (workingRef.current) return;
    if (!token) {
      setError("This link is missing its code. Please use the exact link from the email.");
      return;
    }
    workingRef.current = true;
    setStatus("working");
    setError("");
    try {
      const result = await apiRequest("/api/auth/email-change/undo", { method: "POST", body: { token } });
      setRestoredEmail(result?.email || "");
      setStatus("secured");
    } catch (err) {
      setError(messageFrom(err, "Something went wrong. Please try again."));
      setStatus("ask");
    } finally {
      workingRef.current = false;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        {status === "secured" ? (
          <div className="text-center">
            <CheckCircle2 size={44} className="mx-auto text-green-600" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Your account is secured</h1>
            <p className="mt-3 text-sm text-gray-600">
              Your email is back to <strong className="break-all">{restoredEmail}</strong>. Every device was signed out,
              and the old password no longer works.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Next, go to the login page and choose <strong>Forgot password</strong> to set a new one. The code will be
              sent to this email.
            </p>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="mt-6 w-full py-3 rounded-xl bg-[#4f7331] text-white font-semibold hover:bg-[#3f6238] transition-colors"
            >
              Go to log in
            </button>
          </div>
        ) : status === "thisWasMe" ? (
          <div className="text-center">
            <CheckCircle2 size={44} className="mx-auto text-green-600" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Thanks for confirming</h1>
            <p className="mt-3 text-sm text-gray-600">Nothing was changed. You can close this page.</p>
          </div>
        ) : (
          <div>
            <ShieldAlert size={44} className="mx-auto text-red-600" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900 text-center">Was this you?</h1>
            <p className="mt-3 text-sm text-gray-600 text-center">
              The email address on your FarmFund account was recently changed. If you made this change, you don't need
              to do anything.
            </p>

            {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}

            <button
              onClick={handleSecure}
              disabled={status === "working"}
              className="mt-6 w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-70"
            >
              {status === "working" ? "Securing…" : "No, secure my account"}
            </button>
            <button
              onClick={() => setStatus("thisWasMe")}
              disabled={status === "working"}
              className="mt-3 w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-70"
            >
              Yes, this was me
            </button>

            <p className="mt-5 text-xs text-gray-400 text-center leading-relaxed">
              If this wasn't you, the red button puts your old email back, signs out every device, and locks the
              current password so you can set a new one with "Forgot password". If you can't use this page, contact an
              administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
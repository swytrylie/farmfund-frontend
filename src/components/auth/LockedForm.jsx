import { useState } from "react";
import { Lock, CheckCircle2 } from "lucide-react";
import { apiRequest } from "../../api";
import {
  formatLockoutTime,
  validateAdminMessage,
  MESSAGE_MAX,
} from "../../lib/lockout";

export default function LockedForm({
  secondsLeft,
  email,
  requestSent,
  onReturnToLogin,
  onMessageSent,
}) {
  const [writing, setWriting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    if (sending) return;
    const problem = validateAdminMessage(message);
    if (problem) {
      setError(problem);
      return;
    }
    if (!email) {
      setError("This is only a preview. Log in with a real locked account to message the admin.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const result = await apiRequest("/api/auth/lock-contact", {
        method: "POST",
        body: { email, message: message.trim() },
      });
      if (result?.sent) {
        onMessageSent?.();
        setWriting(false);
      } else {
        setError("Your account is no longer locked. Go back and try logging in.");
      }
    } catch (err) {
      setError(err.message || "Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Lock size={44} strokeWidth={1.5} className="text-red-500 mx-auto" />

      <h2 className="mt-3 text-3xl font-bold text-white text-center">
        Account Temporarily Locked
      </h2>

      <p className="mt-3 text-center text-white/70 text-sm max-w-sm mx-auto leading-relaxed">
        Too many unsuccessful login attempts have been detected. For your
        security, your account has been temporarily locked.
      </p>

      <div className="my-4 bg-red-950/40 border border-red-500/30 rounded-xl p-5 text-center">
        <p className="text-xs uppercase tracking-widest text-red-300/70">
          Try again in
        </p>
        <p
          data-testid="lock-timer"
          className="mt-1 text-red-400 font-mono text-4xl font-bold"
        >
          {formatLockoutTime(secondsLeft)}
        </p>
      </div>

      <p className="text-center text-white/60 text-sm">
        Your account will automatically unlock when the timer reaches zero.
      </p>

      {/* Contact the admin */}
      <div className="mt-4 text-center">
        {requestSent ? (
          <div
            data-testid="lock-sent"
            className="mx-auto max-w-sm flex items-start gap-2 rounded-lg bg-green-500/15 border border-green-400/30 px-4 py-3 text-left text-sm text-green-100"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-300" />
            <span>
              Your message was sent to the admin. Once they unlock your account
              you can log in right away.
            </span>
          </div>
        ) : writing ? (
          <form onSubmit={handleSend} className="text-left" noValidate>
            <label
              htmlFor="lock-message"
              className="block text-sm font-semibold text-white/90 mb-1.5"
            >
              Tell the admin what happened
            </label>
            <textarea
              id="lock-message"
              data-testid="lock-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError("");
              }}
              rows={3}
              maxLength={MESSAGE_MAX}
              autoFocus
              placeholder="For example: I forgot my password and tried a few times."
              className="w-full resize-none rounded-lg bg-white/10 border border-white/25 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#42BD41]"
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-red-300" role="alert" data-testid="lock-error">
                {error}
              </span>
              <span className="text-white/50">
                {message.length}/{MESSAGE_MAX}
              </span>
            </div>
            <div className="mt-3 flex gap-3">
              <button
                type="submit"
                data-testid="lock-send"
                disabled={sending}
                className="flex-1 py-2.5 rounded-lg bg-[#42BD41] hover:bg-[#379637] text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send to admin"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setWriting(false);
                  setError("");
                }}
                disabled={sending}
                className="px-4 py-2.5 rounded-lg border border-white/30 text-white/80 hover:bg-white/10 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-white/70">
            If you think this is an error,{" "}
            <button
              type="button"
              data-testid="lock-contact"
              onClick={() => setWriting(true)}
              className="font-semibold text-white underline underline-offset-2 hover:text-[#8be08a] transition-colors"
            >
              contact the admin
            </button>
            .
          </p>
        )}
      </div>

      <button
        onClick={onReturnToLogin}
        className="mt-5 w-full py-3.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-lg transition-colors"
      >
        Return to Login
      </button>
    </>
  );
}
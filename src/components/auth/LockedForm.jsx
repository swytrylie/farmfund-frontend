import { Lock } from "lucide-react";
import { formatLockoutTime } from "../../lib/lockout";

export default function LockedForm({
  secondsLeft,
  onReturnToLogin,
  onSimulateEscalation,
}) {
  return (
    <>
      <Lock size={48} strokeWidth={1.5} className="text-red-500 mx-auto" />

      <h2 className="mt-4 text-3xl font-bold text-white text-center">
        Account Temporarily Locked
      </h2>

      <p className="mt-3 text-center text-white/70 text-sm max-w-sm mx-auto leading-relaxed">
        Too many unsuccessful login attempts have been detected. For your
        security, your account has been temporarily locked.
      </p>

      <div className="my-6 bg-red-950/40 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-red-300/70">
          Try again in
        </p>
        <p className="mt-1 text-red-400 font-mono text-4xl font-bold">
          {formatLockoutTime(secondsLeft)}
        </p>
      </div>

      <p className="text-center text-white/60 text-sm">
        Your account will automatically unlock when the timer reaches zero.
      </p>

      <button
        onClick={onReturnToLogin}
        className="mt-6 w-full py-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-lg transition-colors"
      >
        Return to Login
      </button>

      {/* Dev-only control for testing tier escalation — remove before shipping */}
      {onSimulateEscalation && (
        <button
          onClick={onSimulateEscalation}
          className="mt-4 block mx-auto text-xs text-white/40 hover:text-white/70 underline transition-colors"
        >
          (Dev) Simulate another failed attempt while locked
        </button>
      )}
    </>
  );
}
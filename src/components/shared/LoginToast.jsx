import { useEffect, useState } from "react";
import { CheckCircle2, Clock, X } from "lucide-react";

// A short message at the top of the page. The green one says "you're logged
// in" right after a successful login and goes away by itself. The amber one
// (tone="warning") says why someone was signed out; pass seconds={0} to keep
// it on screen until they close it or sign in again.
export default function LoginToast({ message, onClose, seconds = 4, tone = "success" }) {
  const [shown, setShown] = useState(false);

  // Fade in on the next frame, then dismiss after `seconds`.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    const timer = seconds > 0 ? setTimeout(onClose, seconds * 1000) : null;
    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
    // Only restart when a new message arrives, not when the parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, seconds]);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={tone === "warning" ? "idle-notice" : "login-toast"}
      className={`fixed top-5 left-1/2 z-[80] max-w-[92vw] -translate-x-1/2 transition-all duration-300 ${
        shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      }`}
    >
      <div
        className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
          tone === "warning" ? "bg-amber-600" : "bg-green-600"
        }`}
      >
        {tone === "warning" ? <Clock size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
        <span>{message}</span>
        <button onClick={onClose} aria-label="Dismiss" className="ml-1 shrink-0 text-white/80 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
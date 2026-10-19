import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

// A short "you're logged in" message that appears at the top of the page right
// after a successful login (farmer or cooperative) and goes away by itself.
export default function LoginToast({ message, onClose, seconds = 4 }) {
  const [shown, setShown] = useState(false);

  // Fade in on the next frame, then dismiss after `seconds`.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    const timer = setTimeout(onClose, seconds * 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
    // Only restart when a new message arrives, not when the parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, seconds]);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="login-toast"
      className={`fixed top-5 left-1/2 z-[80] max-w-[92vw] -translate-x-1/2 transition-all duration-300 ${
        shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center gap-2.5 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
        <CheckCircle2 size={18} className="shrink-0" />
        <span>{message}</span>
        <button onClick={onClose} aria-label="Dismiss" className="ml-1 shrink-0 text-white/80 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
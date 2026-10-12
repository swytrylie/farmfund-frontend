import { useEffect, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import { apiRequest } from "../../api";

const CHECK_MS = 30000;

function backText(until) {
  const d = new Date(until);
  if (!until || Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// Shown to farmers and cooperatives while maintenance mode is on. It asks the
// server every 30 seconds (and on the button) and lets the app back in the
// moment maintenance ends.
export default function MaintenanceScreen({ until, onRecovered }) {
  const [endsAt, setEndsAt] = useState(until || null);
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState("");
  const alive = useRef(true);
  const busy = useRef(false);

  async function check() {
    if (busy.current) return;
    busy.current = true;
    if (alive.current) setChecking(true);
    try {
      const status = await apiRequest("/api/system/status");
      if (!alive.current) return;
      if (status && status.maintenance && status.maintenance.active === false) {
        onRecovered?.();
        return;
      }
      setEndsAt((status && status.maintenance && status.maintenance.until) || null);
      setNote("Still down for maintenance.");
    } catch {
      if (alive.current) setNote("Could not check right now. We'll try again shortly.");
    } finally {
      busy.current = false;
      if (alive.current) setChecking(false);
    }
  }

  useEffect(() => {
    alive.current = true;
    const timer = setInterval(check, CHECK_MS);
    return () => {
      alive.current = false;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const back = backText(endsAt);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4] p-6">
      <div role="alert" className="bg-white rounded-3xl shadow-lg border border-gray-200 max-w-md w-full p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
          <Wrench size={26} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Down for maintenance</h1>
        <p className="text-sm text-gray-600 mt-3">
          FarmFund is being updated right now. Your data is safe, and everything will be back shortly.
        </p>
        <p className="text-sm font-semibold text-gray-800 mt-4">
          {back ? `We expect to be back by ${back}.` : "Please check back in a little while."}
        </p>
        <button
          onClick={check}
          disabled={checking}
          className="mt-6 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {checking ? "Checking…" : "Check again"}
        </button>
        {note && <p className="text-xs text-gray-400 mt-3">{note}</p>}
      </div>
    </div>
  );
}
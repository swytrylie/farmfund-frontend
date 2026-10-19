import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { authedRequest } from "../../api";
import {
  idleStatus,
  pingDelay,
  readSharedActivity,
  writeSharedActivity,
} from "../../lib/idle";

// Things that count as "the person is here".
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "wheel", "touchstart", "click"];

/**
 * Signs the person out after 10 minutes of doing nothing. Render it only while
 * someone is signed in (farmer, cooperative or admin).
 *
 *  - Real activity is noted, shared with other tabs, and reported to the server
 *    (at most every 30 seconds) so the server's own idle timer stays in step.
 *  - In the last minute a box asks "Are you still there?". Only its button (or
 *    activity in another tab) keeps the session; moving the mouse does not, so
 *    the box can't vanish by accident while nobody is looking.
 *  - At zero it calls onTimeout, which signs out and tells the person why.
 */
export default function IdleGuard({ onTimeout, onSignOut }) {
  const [secondsLeft, setSecondsLeft] = useState(null); // null = no warning showing
  const handlers = useRef({ onTimeout, onSignOut });
  const api = useRef({});

  useEffect(() => {
    handlers.current = { onTimeout, onSignOut };
  });

  useEffect(() => {
    let last = Date.now(); // this tab's last real activity
    let lastPing = 0;
    let trailing = null;
    let warning = false;
    let finished = false;

    function sendPing() {
      if (trailing) {
        clearTimeout(trailing);
        trailing = null;
      }
      lastPing = Date.now();
      // Failures are not shown: if the session is really over, the request
      // layer signs the person out by itself.
      authedRequest("/api/auth/activity", { method: "POST" }).catch(() => {});
    }

    function reportActivity() {
      const wait = pingDelay(lastPing, Date.now());
      if (wait === 0) sendPing();
      else if (!trailing) trailing = setTimeout(sendPing, wait);
    }

    function mark() {
      if (finished) return;
      if (warning) return; // during the warning only the button counts
      const now = Date.now();
      if (now - last < 1000) return; // a moving mouse fires constantly
      last = now;
      writeSharedActivity(now);
      reportActivity();
    }

    function tick() {
      if (finished) return;
      const status = idleStatus(Math.max(last, readSharedActivity()), Date.now());
      if (status.state === "expired") {
        finished = true;
        warning = false;
        setSecondsLeft(null);
        handlers.current.onTimeout();
        return;
      }
      warning = status.state === "warning";
      setSecondsLeft(warning ? status.secondsLeft : null);
    }

    // "Stay signed in": counts even though the warning is open.
    api.current.stay = () => {
      if (finished) return;
      last = Date.now();
      writeSharedActivity(last);
      sendPing();
      warning = false;
      setSecondsLeft(null);
    };

    const onActivity = () => mark();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", tick);
    const timer = setInterval(tick, 1000);

    // Opening or reloading the page is itself activity.
    writeSharedActivity(last);
    sendPing();

    return () => {
      finished = true;
      clearInterval(timer);
      if (trailing) clearTimeout(trailing);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity, { capture: true }));
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  if (secondsLeft === null) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="idle-title"
        aria-describedby="idle-text"
        data-testid="idle-warning"
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Clock size={24} />
        </div>
        <h2 id="idle-title" className="text-lg font-semibold text-gray-900">
          Are you still there?
        </h2>
        <p id="idle-text" className="mt-1 text-sm text-gray-600">
          For your security you will be signed out in{" "}
          <span data-testid="idle-seconds" className="font-semibold text-gray-900">
            {secondsLeft}
          </span>{" "}
          {secondsLeft === 1 ? "second" : "seconds"} because there has been no activity.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            data-testid="idle-stay"
            autoFocus
            onClick={() => api.current.stay?.()}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Stay signed in
          </button>
          <button
            data-testid="idle-signout"
            onClick={() => handlers.current.onSignOut()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out now
          </button>
        </div>
      </div>
    </div>
  );
}
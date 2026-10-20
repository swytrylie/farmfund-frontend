import { useEffect, useRef, useState } from "react";
import { TrendingUp, CreditCard, Lightbulb } from "lucide-react";
import AuthPanel from "./AuthPanel";
import { apiRequest } from "../../api";
import {
  LOCK_POLL_MS,
  clearStoredLock,
  lockFromServer,
  readStoredLock,
  secondsLeftUntil,
  storeLock,
} from "../../lib/lockout";

const features = [
  { icon: TrendingUp, label: "Real-time income & expense tracking" },
  { icon: CreditCard, label: "Loan and repayment management" },
  { icon: Lightbulb, label: "AI Farm Advisor recommendations" },
];

export default function FarmFund({ onLoginSuccess }) {
  // The lock saved in this browser (if one is still running): after a page
  // refresh the locked screen comes straight back, with the real time left.
  const [lock, setLock] = useState(() => readStoredLock());
  // "none" = plain landing page, everything else is an AuthPanel state
  const [view, setView] = useState(() => (readStoredLock() ? "locked" : "none"));
  // Carries the email forward into the OTP screen, set whenever a form navigates there
  const [otpEmail, setOtpEmail] = useState("");
  // Carries the chosen role from role-selection into the signup form
  const [accountType, setAccountType] = useState("");
  // Carries the organization's name into the pending-approval screen
  const [organizationName, setOrganizationName] = useState("");

  // ---- Lockout ----
  // The server decides when a lock ends. The countdown is "end time minus now",
  // recalculated every second, so it can never drift or restart.
  const [now, setNow] = useState(() => Date.now());
  const [loginNotice, setLoginNotice] = useState("");
  const lockRef = useRef(lock);
  lockRef.current = lock;
  const lockoutSecondsLeft = lock ? secondsLeftUntil(lock.endsAt, now) : 0;

  function handleSwitchMode(nextMode, payload) {
    // Organization signup logs straight into the Org Dashboard, reusing
    // the SAME onLoginSuccess prop App.jsx already gives real logins.
    // payload is now a genuine { accessToken, user } session object from
    // SignupForm's real register()+login() calls, not a mocked one — passed
    // straight through rather than wrapped here.
    // We return early instead of calling setView, since we're leaving
    // FarmFund/AuthPanel entirely rather than switching to another of its
    // internal views.
    if (nextMode === "org-signup-success" && payload) {
      onLoginSuccess(payload);
      return;
    }

    setView(nextMode);
    if (nextMode === "otp" && payload) setOtpEmail(payload);
    if (nextMode === "account-success" && payload) setAccountType(payload);
    if (nextMode === "submitted-organization" && payload)
      setOrganizationName(payload);
  }

  function handleSelectRole(role) {
    setAccountType(role);
    setView("signup");
  }

  function showLock(next) {
    if (!next.preview) storeLock(next);
    setLock(next);
    setNow(Date.now());
    setView("locked");
  }

  // The lock is over (the timer ran out, or an admin unlocked the account).
  function endLock(message) {
    clearStoredLock();
    setLock(null);
    setLoginNotice(message);
    setView("login");
  }

  // Called by LoginForm when the server says the account is locked. The answer
  // carries how many seconds are left, which is what the screen counts down.
  function handleFailedAttempt(info) {
    if (!info?.locked) return;
    const fromServer = lockFromServer(info.details, info.email);
    const stored = readStoredLock();
    const sameAsStored = stored && stored.email === info.email;
    showLock(
      fromServer ||
        (sameAsStored
          ? stored
          : { email: info.email || "", endsAt: Date.now() + 15 * 60 * 1000, minutes: 15, requestSent: false })
    );
  }

  // The person wrote to the admin: remember it, so a refresh still says so.
  function handleLockMessageSent() {
    const next = { ...lockRef.current, requestSent: true };
    setLock(next);
    if (!next.preview) storeLock(next);
  }

  // Ticks the countdown once per second while locked
  useEffect(() => {
    if (view !== "locked") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [view]);

  // The moment the countdown reaches zero, back to the login form
  useEffect(() => {
    if (view === "locked" && lock && lockoutSecondsLeft === 0) {
      endLock("Your lock has ended. You can try logging in again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, lock, lockoutSecondsLeft]);

  // While the locked screen is open, ask the server every 30 seconds whether
  // the account is still locked: an admin may have unlocked it, and the
  // server's clock is the one that counts.
  const lockEmail = lock && !lock.preview ? lock.email : "";
  useEffect(() => {
    if (view !== "locked" || !lockEmail) return;
    let cancelled = false;

    async function check() {
      try {
        const status = await apiRequest("/api/auth/lock-status", {
          method: "POST",
          body: { email: lockEmail },
        });
        if (cancelled) return;
        if (!status.locked) {
          endLock("Your account has been unlocked. You can log in now.");
          return;
        }
        const fresh = lockFromServer(status, lockEmail);
        const current = lockRef.current;
        if (!fresh || !current) return;
        const next = {
          ...current,
          requestSent: current.requestSent || fresh.requestSent,
          minutes: fresh.minutes || current.minutes,
          // only move the end time when it really differs (not for a second of network delay)
          endsAt: Math.abs(fresh.endsAt - current.endsAt) > 2000 ? fresh.endsAt : current.endsAt,
        };
        setLock(next);
        storeLock(next);
      } catch {
        // could not ask (offline?): the countdown keeps going on its own
      }
    }

    check();
    const timer = setInterval(check, LOCK_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, lockEmail]);

  return (
    <section
      className="relative w-full min-h-screen flex items-center bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(6,20,10,0.92) 0%, rgba(6,20,10,0.82) 30%, rgba(6,20,10,0.45) 60%, rgba(6,20,10,0.15) 100%), url('/images/farmland-aerial.jpg')",
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-24 md:py-16 grid grid-cols-1 lg:grid-cols-12">
        {/* Hero copy: confined to the left 7/12 columns so it never sits under the panel */}
        <div className="lg:col-span-7">
          <div className="max-w-xl">
            {/* Heading */}
            <h1 className="font-extrabold leading-[1.05] tracking-tight text-4xl sm:text-5xl lg:text-6xl">
              <span className="block text-white">Your Farm.</span>
              <span className="block text-white">
                Your <span className="text-[#42BD41]">Finances.</span>
              </span>
              <span className="block text-white">Under Control.</span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-base sm:text-lg text-white/75 leading-relaxed max-w-md">
              Track income, manage expenses, monitor loans, and get
              AI-powered insights — all designed for farmers.
            </p>

            {/* Feature list */}
            <ul className="mt-9 space-y-5">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-4">
                  <span className="flex-shrink-0 w-11 h-11 rounded-full border-2 border-[#42BD41] flex items-center justify-center">
                    <Icon
                      size={20}
                      strokeWidth={2.25}
                      className="text-[#42BD41]"
                    />
                  </span>
                  <span className="text-white font-medium text-base sm:text-lg leading-snug">
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setLoginNotice("");
                  setView("login");
                }}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-[#42BD41] text-white font-bold text-base shadow-lg shadow-black/20 hover:bg-[#379637] active:bg-[#2f7f2f] transition-colors duration-200"
              >
                Log In
              </button>
              <button
                onClick={() => setView("signup-role")}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-white text-gray-900 font-bold text-base shadow-lg shadow-black/10 hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

        {/* Right 5/12 columns reserved as breathing room for the auth panel */}
        <div className="hidden lg:block lg:col-span-5" />
      </div>

      {/* Glassmorphic auth panel, only rendered when view isn't "none" */}
      {view !== "none" && (
        <AuthPanel
          mode={view}
          otpEmail={otpEmail}
          accountType={accountType}
          organizationName={organizationName}
          onSelectRole={handleSelectRole}
          onClose={() => setView("none")}
          onSwitchMode={handleSwitchMode}
          onFailedAttempt={handleFailedAttempt}
          onLoginSuccess={(data) => {
            clearStoredLock();
            onLoginSuccess(data);
          }}
          lockoutSecondsLeft={lockoutSecondsLeft}
          lockEmail={lock ? lock.email : ""}
          lockRequestSent={Boolean(lock && lock.requestSent)}
          onLockMessageSent={handleLockMessageSent}
          loginNotice={loginNotice}
        />
      )}
    </section>
  );
}
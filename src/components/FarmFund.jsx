import { useEffect, useState } from "react";
import { TrendingUp, CreditCard, Lightbulb } from "lucide-react";
import AuthPanel from "./AuthPanel";
import DevNavBar from "./DevNavBar";
import {
  LOCKOUT_TIER_SECONDS,
  MAX_LOGIN_ATTEMPTS,
  nextLockoutTier,
} from "../lib/lockout";

const features = [
  { icon: TrendingUp, label: "Real-time income & expense tracking" },
  { icon: CreditCard, label: "Loan and repayment management" },
  { icon: Lightbulb, label: "AI Farm Advisor recommendations" },
];

export default function FarmFund({ onLoginSuccess }) {
  // "none" = plain landing page, everything else is an AuthPanel state
  const [view, setView] = useState("none");
  // Carries the email forward into the OTP screen, set whenever a form navigates there
  const [otpEmail, setOtpEmail] = useState("");
  // Carries the chosen role from role-selection into the signup form
  const [accountType, setAccountType] = useState("");
  // Carries the organization's name into the pending-approval screen
  const [organizationName, setOrganizationName] = useState("");

  // ---- Lockout state ----
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTier, setLockoutTier] = useState(0); // 0 = not locked
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);

  function handleSwitchMode(nextMode, payload) {
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

  function startLockout(tier) {
    setLockoutTier(tier);
    setLockoutSecondsLeft(LOCKOUT_TIER_SECONDS[tier]);
    setView("locked");
  }

    // Called by LoginForm when the server reports the account is locked.
  // The backend locks for 15 minutes, which matches lockout tier 1.
  function handleFailedAttempt(info) {
    if (info?.locked) startLockout(1);
  }

  // Dev-only control: simulate another failed attempt while already locked,
  // escalating the tier and extending the timer.
  function handleSimulateEscalation() {
    setLockoutTier((prevTier) => {
      const tier = nextLockoutTier(prevTier || 1);
      setLockoutSecondsLeft(LOCKOUT_TIER_SECONDS[tier]);
      return tier;
    });
  }

  // Ticks the countdown once per second while locked
  useEffect(() => {
    if (view !== "locked") return;
    const timer = setInterval(() => {
      setLockoutSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [view]);

  // Auto-unlock the moment the countdown hits zero
  useEffect(() => {
    if (view === "locked" && lockoutSecondsLeft === 0) {
      setView("login");
      setLockoutTier(0);
      setFailedAttempts(0);
    }
  }, [view, lockoutSecondsLeft]);

  // Dev nav: jumping straight to "locked" seeds a tier-1 timer if none is running yet
  function handleDevNavigate(key) {
    if (key === "locked") {
      startLockout(lockoutTier || 1);
    } else {
      setView(key);
    }
  }

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
                onClick={() => setView("login")}
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
          attemptsRemaining={MAX_LOGIN_ATTEMPTS - failedAttempts}
          onFailedAttempt={handleFailedAttempt}
          onLoginSuccess={onLoginSuccess}
          lockoutSecondsLeft={lockoutSecondsLeft}
          onSimulateEscalation={handleSimulateEscalation}
        />
      )}

      {/* Dev-only floating nav for quickly testing every view state */}
      <DevNavBar currentView={view} onNavigate={handleDevNavigate} />
    </section>
  );
}
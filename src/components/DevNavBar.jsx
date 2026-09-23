// Floating dev-only control panel for jumping straight to any view state
// while testing. Not meant to ship to production — remove before launch.

const VIEWS = [
  { key: "none", label: "Landing" },
  { key: "login", label: "Login" },
  { key: "signup-role", label: "Sign up" },
  { key: "forgot-password", label: "Forgot" },
  { key: "otp", label: "OTP" },
  { key: "new-password", label: "New PW" },
  { key: "account-success", label: "Success" },
  { key: "submitted-organization", label: "Submitted Org" },
  { key: "locked", label: "Locked" },
];

export default function DevNavBar({ currentView, onNavigate }) {
  return (
    <div className="fixed bottom-4 left-4 z-[60] max-w-[92vw] bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-2">
      <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1.5">
        Dev Nav
      </p>
      <div className="flex flex-wrap gap-1.5">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => onNavigate(v.key)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              currentView === v.key
                ? "bg-[#42BD41] text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            [ {v.label} ]
          </button>
        ))}
      </div>
    </div>
  );
}
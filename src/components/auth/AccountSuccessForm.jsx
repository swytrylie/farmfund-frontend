import { Check } from "lucide-react";

export default function AccountSuccessForm({ accountType, onContinue }) {
  const isOrganization = accountType === "organization";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-28 h-28 rounded-full bg-[#D4F5C9] flex items-center justify-center">
        <Check className="text-emerald-600" size={64} strokeWidth={3} />
      </div>

      <h2 className="mt-8 text-3xl font-bold text-white">Account created</h2>

      <p className="mt-3 text-white/70 text-sm leading-relaxed max-w-xs">
        Your {isOrganization ? "organization" : "individual"} account is
        ready. You can log in now to start tracking borrowers and loans.
      </p>

      <button
        onClick={onContinue}
        className="mt-8 w-full py-3.5 rounded-lg bg-[#5bc252] hover:bg-green-600 text-white font-bold text-base transition-colors"
      >
        Continue to log in
      </button>
    </div>
  );
}
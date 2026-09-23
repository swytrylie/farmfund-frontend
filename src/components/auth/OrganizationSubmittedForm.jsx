import { History, Clock } from "lucide-react";

export default function OrganizationSubmittedForm({ organizationName, onBackToLogin }) {
  const displayName = organizationName?.trim() || "Kasama Farmers Association";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-28 h-28 bg-[#FEF3C7] rounded-full flex items-center justify-center mx-auto mb-6">
        <History className="text-amber-500" size={56} />
      </div>

      <h2 className="text-3xl font-bold text-white">Registration submitted</h2>

      <p className="mt-3 text-white/80 text-sm leading-relaxed max-w-sm">
        {displayName} is now pending acknowledgment. You'll be notified by
        email once your organization is verified and you can log in as
        Owner.
      </p>

      <span className="bg-amber-100/90 rounded-full px-4 py-1.5 inline-flex items-center gap-2 mx-auto my-4">
        <Clock className="text-amber-700" size={16} />
        <span className="text-xs font-semibold text-amber-800">
          Pending Acknowledgement
        </span>
      </span>

      <button
        onClick={onBackToLogin}
        className="w-full py-3 rounded-lg bg-[#5bc252] hover:bg-green-600 text-white font-semibold mt-4 transition-colors"
      >
        Back to login
      </button>
    </div>
  );
}
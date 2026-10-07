import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { personName } from "../../lib/repaymentData";
import { REMINDER_TYPE_LABEL } from "../../lib/reminderData";

function DeliveryIcon({ status }) {
  return status === "sent" ? (
    <span title="Sent">
      <CheckCircle2 size={14} className="text-gray-400" />
    </span>
  ) : (
    <span title="Failed to send">
      <AlertCircle size={14} className="text-red-500" />
    </span>
  );
}

const shortDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Shows the most recent reminders as a popup, matching the individual
// dashboard's NotificationBell pattern. Reminders come from OrgDashboard as
// shared state — the same data the full Payment Reminders page reads, so
// the two always agree.
//
// The red dot has one meaning: one of the most recent reminders failed to
// send and may need another try. (There's no "unread" tracking — these are
// reminders the cooperative's own staff sent, so there's nothing new to
// notice about a successful one.)
export default function ReminderBell({ reminders = [], onViewAll }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const recentReminders = [...reminders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const needsAttention = recentReminders.some((r) => r.status === "failed");

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleViewAll() {
    setIsOpen(false);
    onViewAll();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => setIsOpen((open) => !open)} className="relative" aria-label="Payment reminders">
        <Bell className="w-6 h-6 text-slate-800 cursor-pointer hover:text-emerald-700 transition-colors" />
        {needsAttention && (
          <span
            data-testid="failed-dot"
            title="A recent reminder failed to send"
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-9 right-0 z-50 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-[#2d4027] p-4 text-white font-bold text-base">Payment Reminders</div>

          <div className="px-3 py-2 space-y-1.5 max-h-72 overflow-y-auto">
            {recentReminders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No reminders sent yet.</p>
            ) : (
              recentReminders.map((r) => (
                <div key={r._id} className="flex items-start gap-2.5 rounded-xl p-2.5 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{personName(r.loan?.farmer)}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {REMINDER_TYPE_LABEL[r.type] || r.type} · {shortDate(r.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 mt-0.5">
                    <DeliveryIcon status={r.status} />
                  </span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleViewAll}
            className="w-full text-center py-3 text-sm text-gray-700 font-semibold border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            View all reminders
          </button>
        </div>
      )}
    </div>
  );
}
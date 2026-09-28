import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, Clock } from "lucide-react";

function DeliveryIcon({ status }) {
  return status === "delivered" ? (
    <CheckCircle2 size={14} className="text-gray-400" />
  ) : (
    <Clock size={14} className="text-amber-500" />
  );
}

// Shows the most recent reminders as a popup, matching the individual
// dashboard's NotificationBell pattern. Reminders come from OrgDashboard
// as shared state — the same data the full Payment Reminders page
// reads/writes, so sending a reminder from either place stays in sync with
// what the other shows. `unread` is separate from `status`: status is
// about whether the BORROWER received it (delivered/pending), unread is
// about whether the STAFF member has looked at it here.
export default function ReminderBell({ reminders, onMarkAllRead, onViewAll }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const unreadCount = reminders.filter((r) => r.unread).length;
  const recentReminders = reminders.slice(0, 5);

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
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="relative"
        aria-label="Payment reminders"
      >
        <Bell className="w-6 h-6 text-slate-800 cursor-pointer hover:text-emerald-700 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-9 right-0 z-50 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-[#2d4027] p-4 text-white font-bold text-base">
            Payment Reminders
          </div>

          <div className="px-4 pt-3 text-right">
            <button
              onClick={onMarkAllRead}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Mark as all read
            </button>
          </div>

          <div className="px-3 py-2 space-y-1.5 max-h-72 overflow-y-auto">
            {recentReminders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No reminders sent yet.
              </p>
            ) : (
              recentReminders.map((r) => (
                <div
                  key={r.id}
                  className="relative flex items-start gap-2.5 rounded-xl p-2.5 pl-4 hover:bg-gray-50 transition-colors"
                >
                  {r.unread && (
                    <span className="absolute top-3.5 left-1.5 w-1.5 h-1.5 rounded-full bg-green-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {r.borrower}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{r.type}</p>
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
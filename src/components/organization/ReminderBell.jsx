import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, AlertCircle, Megaphone, ReceiptText, Landmark } from "lucide-react";
import { personName } from "../../lib/repaymentData";
import { REMINDER_TYPE_LABEL } from "../../lib/reminderData";
import { formatAnnouncementDate } from "../../lib/announcements";

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

// The cooperative's bell. Two things live in it:
//  - announcements from the FarmFund team (click one to read it), and
//  - the payment reminders the cooperative's own staff sent, matching the
//    individual dashboard's NotificationBell pattern.
// Reminders come from OrgDashboard as shared state — the same data the full
// Payment Reminders page reads, so the two always agree. Announcements come
// from OrgDashboard too, the same list the Announcements page shows.
//
// The red dot means one of two things: an announcement hasn't been opened
// yet, or one of the most recent reminders failed to send and may need
// another try. (A successful reminder has nothing new to notice — the
// cooperative's own staff sent it.)
export default function ReminderBell({
  reminders = [],
  onViewAll,
  announcements = [],
  unreadAnnouncements = 0,
  onOpenAnnouncement,
  onViewAllAnnouncements,
  proofAlerts = [],
  unreadProofAlerts = 0,
  onOpenProofAlert,
  loanAlerts = [],
  unreadLoanAlerts = 0,
  onOpenLoanAlert,
  onOpen,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const recentReminders = [...reminders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentAnnouncements = announcements.slice(0, 3);
  const needsAttention = recentReminders.some((r) => r.status === "failed");
  const recentProofAlerts = proofAlerts.slice(0, 4);
  const recentLoanAlerts = loanAlerts.slice(0, 4);
  const showDot = needsAttention || unreadProofAlerts > 0 || unreadLoanAlerts > 0 || unreadAnnouncements > 0;
  const dotTitle = needsAttention
    ? "A recent reminder failed to send"
    : unreadProofAlerts > 0
    ? "A farmer sent a payment proof to review"
    : unreadLoanAlerts > 0
    ? "A new loan request is waiting for you"
    : "You have unread announcements";

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle() {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) onOpen?.(); // pick up anything sent since the page loaded
  }

  function handleViewAll() {
    setIsOpen(false);
    onViewAll();
  }

  function handleViewAllAnnouncements() {
    setIsOpen(false);
    onViewAllAnnouncements?.();
  }

  function handleOpenProofAlert(n) {
    setIsOpen(false);
    onOpenProofAlert?.(n);
  }

  function handleOpenLoanAlert(n) {
    setIsOpen(false);
    onOpenLoanAlert?.(n);
  }

  function handleOpenAnnouncement(a) {
    setIsOpen(false);
    onOpenAnnouncement?.(a);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={handleToggle} className="relative" aria-label="Notifications">
        <Bell className="w-6 h-6 text-slate-800 cursor-pointer hover:text-emerald-700 transition-colors" />
        {showDot && (
          <span
            data-testid={needsAttention ? "failed-dot" : unreadProofAlerts > 0 ? "proof-dot" : unreadLoanAlerts > 0 ? "loan-dot" : "unread-dot"}
            title={dotTitle}
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-9 right-0 z-50 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-[#2d4027] p-4 text-white font-bold text-base">Notifications</div>

          <div className="max-h-[26rem] overflow-y-auto">
            <p className="px-4 pt-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Loan Requests</p>
            <div className="px-3 py-2 space-y-1.5">
              {recentLoanAlerts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No loan requests yet.</p>
              ) : (
                recentLoanAlerts.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open loan request from ${n.details?.farmerName || "a farmer"}`}
                    onClick={() => handleOpenLoanAlert(n)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleOpenLoanAlert(n);
                      }
                    }}
                    className="relative flex items-start gap-2.5 rounded-xl p-2.5 cursor-pointer bg-[#eff6ff] hover:bg-[#e3eefd] transition-colors"
                  >
                    {n.unread && <span className="absolute top-3 left-1 w-2 h-2 rounded-full bg-blue-500" />}
                    <span className="shrink-0 ml-2 p-1.5 rounded-lg bg-[#dbeafe] text-[#1d4ed8]">
                      <Landmark size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatAnnouncementDate(n.at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="px-4 pt-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100">Payment Proofs</p>
            <div className="px-3 py-2 space-y-1.5">
              {recentProofAlerts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No payment proofs yet.</p>
              ) : (
                recentProofAlerts.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open payment proof from ${n.details?.farmerName || "a farmer"}`}
                    onClick={() => handleOpenProofAlert(n)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleOpenProofAlert(n);
                      }
                    }}
                    className="relative flex items-start gap-2.5 rounded-xl p-2.5 cursor-pointer bg-[#fff8ec] hover:bg-[#fff1d9] transition-colors"
                  >
                    {n.unread && <span className="absolute top-3 left-1 w-2 h-2 rounded-full bg-amber-500" />}
                    <span className="shrink-0 ml-2 p-1.5 rounded-lg bg-[#fde8c4] text-[#8a5a12]">
                      <ReceiptText size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatAnnouncementDate(n.at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="px-4 pt-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100">Announcements</p>
            <div className="px-3 py-2 space-y-1.5">
              {recentAnnouncements.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No announcements yet.</p>
              ) : (
                recentAnnouncements.map((a) => (
                  <div
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open announcement ${a.title}`}
                    onClick={() => handleOpenAnnouncement(a)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleOpenAnnouncement(a);
                      }
                    }}
                    className="relative flex items-start gap-2.5 rounded-xl p-2.5 cursor-pointer bg-[#f4f8f3] hover:bg-[#eef5ec] transition-colors"
                  >
                    {a.unread && <span className="absolute top-3 left-1 w-2 h-2 rounded-full bg-green-500" />}
                    <span className="shrink-0 ml-2 p-1.5 rounded-lg bg-[#e0ebda] text-[#2d4027]">
                      <Megaphone size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-500 truncate">{formatAnnouncementDate(a.at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={handleViewAllAnnouncements}
              className="w-full text-center py-2.5 text-xs text-gray-600 font-semibold border-y border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              View all announcements
            </button>

            <p className="px-4 pt-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment Reminders</p>
            <div className="px-3 py-2 space-y-1.5">
              {recentReminders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No reminders sent yet.</p>
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
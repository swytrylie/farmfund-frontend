import { useEffect, useRef, useState } from "react";
import { Bell, CreditCard, AlertTriangle, Calendar, Droplet, Megaphone, X } from "lucide-react";
import { FILTERS } from "../../lib/alertEngine";
import { formatAnnouncementDate } from "../../lib/announcements";

// The alert categories plus announcements from the FarmFund team.
const CATEGORIES = [...FILTERS, "Announcements"];

// Same icon/color mapping as the full Alerts page (by iconKey), just with
// bell-specific card styling since this is a compact popup, not a full page.
const ICON_CONFIG = {
  loan: {
    Icon: CreditCard,
    card: "bg-[#fdf2f2] border border-red-100",
    iconWrap: "bg-red-100 text-red-500",
    tag: "bg-red-100 text-red-700",
  },
  budget: {
    Icon: AlertTriangle,
    card: "bg-[#fefce8] border border-yellow-100",
    iconWrap: "bg-yellow-100 text-yellow-600",
    tag: "bg-yellow-100 text-yellow-800",
  },
  season: {
    Icon: Calendar,
    card: "bg-[#f0fdf4] border border-green-100",
    iconWrap: "bg-green-100 text-green-700",
    tag: "bg-green-100 text-green-800",
  },
  weather: {
    Icon: Droplet,
    card: "bg-[#eff6ff] border border-blue-100",
    iconWrap: "bg-blue-100 text-blue-600",
    tag: "bg-blue-100 text-blue-800",
  },
};

export default function NotificationBell({
  alerts,
  onDismissAlert,
  onMarkAllAlertsRead,
  onViewAllAlerts,
  announcements = [],
  unreadAnnouncements = 0,
  onOpenAnnouncement,
  onMarkAllAnnouncementsRead,
  onOpen,
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const containerRef = useRef(null);

  // Every alert shown here is, by definition, one that hasn't been
  // dismissed yet — a live condition either currently applies or it
  // doesn't, so there's no separate "unread" state to track on top of that.
  // Announcements do have an unread state (they are messages, not live
  // conditions): the dot shows while any alert exists or any announcement
  // hasn't been opened yet.
  const showDot = alerts.length > 0 || unreadAnnouncements > 0;
  const visibleAlerts =
    activeCategory === "Announcements"
      ? []
      : alerts.filter((a) => activeCategory === "All" || a.categories.includes(activeCategory));
  const visibleAnnouncements =
    activeCategory === "All"
      ? announcements.slice(0, 3)
      : activeCategory === "Announcements"
        ? announcements.slice(0, 10)
        : [];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleViewAllAlerts() {
    setIsNotifOpen(false);
    onViewAllAlerts?.();
  }

  function handleToggle() {
    const opening = !isNotifOpen;
    setIsNotifOpen(opening);
    if (opening) onOpen?.(); // pick up anything sent since the page loaded
  }

  function handleOpenAnnouncement(a) {
    setIsNotifOpen(false);
    onOpenAnnouncement?.(a);
  }

  // "Dismiss all" removes the alerts; announcements are only marked read
  // (they are kept, and the full list is on the Alerts page).
  function handleClearAll() {
    if (activeCategory !== "Announcements") onMarkAllAlertsRead?.();
    if (activeCategory === "All" || activeCategory === "Announcements") onMarkAllAnnouncementsRead?.();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-slate-800 cursor-pointer hover:text-emerald-700 transition-colors" />
        {showDot && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>

      {isNotifOpen && (
        <div className="absolute top-9 right-0 z-50 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header banner */}
          <div className="bg-[#5d7d4f] p-4 text-white font-bold text-lg rounded-t-2xl">
            Alerts & Notifications
          </div>

          {/* Category pills + mark-all-read — same FILTERS list as the full
              Alerts page, imported from the same shared mock file. */}
          <div className="p-4 pb-2">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={
                    cat === activeCategory
                      ? "bg-[#5d7d4f] text-white px-3 py-1 rounded-full text-xs font-semibold"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1 rounded-full text-xs transition-colors"
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="mt-2 text-right">
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {activeCategory === "Announcements" ? "Mark all as read" : "Dismiss all"}
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="px-4 pb-2 space-y-2 max-h-80 overflow-y-auto">
            {visibleAlerts.length === 0 && visibleAnnouncements.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                {activeCategory === "Announcements"
                  ? "No announcements yet."
                  : "No notifications in this category."}
              </p>
            )}
            {visibleAnnouncements.map((a) => (
              <div
                key={`ann-${a.id}`}
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
                className="relative rounded-xl p-3 cursor-pointer bg-[#f4f8f3] border border-green-100 hover:bg-[#eef5ec] transition-colors"
              >
                {a.unread && <span className="absolute top-3 left-2 w-2 h-2 rounded-full bg-green-500" />}
                <div className="flex gap-3 pl-3">
                  <span className="shrink-0 p-2 rounded-lg h-fit bg-[#e0ebda] text-[#2d4027]">
                    <Megaphone size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{a.title}</p>
                    <p className="mt-0.5 text-xs text-gray-600 leading-relaxed line-clamp-2">{a.message}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-gray-400">{formatAnnouncementDate(a.at)}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#dbe7d3] text-[#2d4027]">Announcement</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {visibleAlerts.map((a) => {
              const config = ICON_CONFIG[a.iconKey];
              const Icon = config.Icon;
              return (
                <div
                  key={a.id}
                  className={`relative rounded-xl p-3 ${config.card}`}
                >
                  <button
                    onClick={() => onDismissAlert(a.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    aria-label="Dismiss"
                  >
                    <X size={14} />
                  </button>

                  <div className="flex gap-3 pl-2 pr-4">
                    <span
                      className={`shrink-0 p-2 rounded-lg h-fit ${config.iconWrap}`}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {a.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">
                        {a.body}
                      </p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-gray-400">
                          {a.time}
                        </span>
                        {a.categories.map((cat) => (
                          <span
                            key={cat}
                            className={`text-[10px] px-2 py-0.5 rounded ${config.tag}`}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <button
            onClick={handleViewAllAlerts}
            className="w-full text-center py-3 text-sm text-gray-700 font-semibold border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            View all alerts & announcements
          </button>
        </div>
      )}
    </div>
  );
}
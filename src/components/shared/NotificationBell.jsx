import { useEffect, useRef, useState } from "react";
import { Bell, CreditCard, AlertTriangle, Calendar, Droplet, X } from "lucide-react";
import { FILTERS } from "../../mocks/individual/alerts.mock";

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
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const containerRef = useRef(null);

  const unreadCount = alerts.filter((a) => a.unread).length;
  const visibleAlerts = alerts.filter(
    (a) => activeCategory === "All" || a.categories.includes(activeCategory)
  );

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

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsNotifOpen((open) => !open)}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-slate-800 cursor-pointer hover:text-emerald-700 transition-colors" />
        {unreadCount > 0 && (
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
              {FILTERS.map((cat) => (
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
                onClick={onMarkAllAlertsRead}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Mark as all read
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="px-4 pb-2 space-y-2 max-h-80 overflow-y-auto">
            {visibleAlerts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                No notifications in this category.
              </p>
            )}
            {visibleAlerts.map((a) => {
              const config = ICON_CONFIG[a.iconKey];
              const Icon = config.Icon;
              return (
                <div
                  key={a.id}
                  className={`relative rounded-xl p-3 ${config.card}`}
                >
                  {a.unread && (
                    <span className="absolute top-3 left-1.5 w-2 h-2 rounded-full bg-green-500" />
                  )}

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
            View all alerts
          </button>
        </div>
      )}
    </div>
  );
}
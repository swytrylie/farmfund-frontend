import { useEffect, useRef, useState } from "react";
import { Bell, CreditCard, AlertTriangle, X } from "lucide-react";

const CATEGORIES = ["All", "Loans", "Budget", "Expense", "Weather"];

const INITIAL_NOTIFICATIONS = [
  {
    id: "n1",
    category: "Loans",
    unread: true,
    theme: "red",
    icon: CreditCard,
    header: "Loan payment due in 7 days",
    body: "LANDBANK Agriculture Loan ₱14,200 due on September 5, 2026. Ensure funds are ready.",
    time: "2 hours ago",
  },
  {
    id: "n2",
    category: "Budget",
    unread: true,
    theme: "yellow",
    icon: AlertTriangle,
    header: "Irrigation budget exceeded",
    body: "You've spent 27,400 against a ₱25,000 irrigation budget — 9.6% over. Review spending.",
    time: "Yesterday",
  },
];

// Visual tokens per notification theme, so adding a new themed card later is a one-line addition
const THEME_STYLES = {
  red: {
    card: "bg-[#fdf2f2] border border-red-100",
    iconWrap: "bg-red-100 text-red-500",
    tag: "bg-red-100 text-red-700",
  },
  yellow: {
    card: "bg-[#fefce8] border border-yellow-100",
    iconWrap: "bg-yellow-100 text-yellow-600",
    tag: "bg-yellow-100 text-yellow-800",
  },
};

export default function NotificationBell({ onViewAllAlerts }) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const containerRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const visibleNotifications = notifications.filter(
    (n) => activeCategory === "All" || n.category === activeCategory
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

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function handleDismiss(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleViewAllAlerts() {
    setIsNotifOpen(false);
    onViewAllAlerts?.();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsNotifOpen((open) => !open)}
        className="relative w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>

      {isNotifOpen && (
        <div className="absolute top-12 right-0 z-50 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header banner */}
          <div className="bg-[#5d7d4f] p-4 text-white font-bold text-lg rounded-t-2xl">
            Alerts & Notifications
          </div>

          {/* Category pills + mark-all-read */}
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
                onClick={handleMarkAllRead}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Mark as all read
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="px-4 pb-2 space-y-2 max-h-80 overflow-y-auto">
            {visibleNotifications.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                No notifications in this category.
              </p>
            )}
            {visibleNotifications.map((n) => {
              const styles = THEME_STYLES[n.theme];
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className={`relative rounded-xl p-3 ${styles.card}`}
                >
                  {n.unread && (
                    <span className="absolute top-3 left-1.5 w-2 h-2 rounded-full bg-green-500" />
                  )}

                  <button
                    onClick={() => handleDismiss(n.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    aria-label="Dismiss"
                  >
                    <X size={14} />
                  </button>

                  <div className="flex gap-3 pl-2 pr-4">
                    <span
                      className={`shrink-0 p-2 rounded-lg h-fit ${styles.iconWrap}`}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {n.header}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">
                        {n.body}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">
                          {n.time}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded ${styles.tag}`}
                        >
                          {n.category}
                        </span>
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
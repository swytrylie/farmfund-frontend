import { useState } from "react";
import { CreditCard, AlertTriangle, Calendar, Droplet, X } from "lucide-react";
import { FILTERS } from "../../mocks/individual/alerts.mock";

const ICON_CONFIG = {
  loan: { Icon: CreditCard, bg: "bg-[#fce7f3]", color: "text-red-600" },
  budget: { Icon: AlertTriangle, bg: "bg-[#fef3c7]", color: "text-amber-600" },
  season: { Icon: Calendar, bg: "bg-[#dcfce7]", color: "text-green-700" },
  weather: { Icon: Droplet, bg: "bg-[#dbeafe]", color: "text-blue-600" },
};

function AlertCard({ alert, onDismiss }) {
  const { Icon, bg, color } = ICON_CONFIG[alert.iconKey];

  return (
    <div className="bg-[#f9faf7] border border-gray-200 rounded-2xl p-5 shadow-sm relative flex items-start gap-4 mb-4">
      <button
        onClick={() => onDismiss(alert.id)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>

      <span className={`${bg} ${color} p-3 rounded-full flex items-center justify-center shrink-0`}>
        <Icon size={18} />
      </span>

      <div className="min-w-0 pr-6">
        <p className="font-bold text-gray-900">{alert.title}</p>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">
          {alert.body}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-400">{alert.time}</span>
          {alert.categories.map((cat) => (
            <span
              key={cat}
              className="bg-[#dcfce7] text-[#2d4027] text-xs px-2.5 py-0.5 rounded-md font-medium"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// alerts, onDismissAlert, and onMarkAllAlertsRead now come from Dashboard.jsx
// as shared state — this is the SAME data the notification bell popup reads,
// so dismissing or marking-read here is reflected there too, and vice versa.
export default function Alerts({ alerts, onDismissAlert, onMarkAllAlertsRead }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredAlerts =
    activeFilter === "All"
      ? alerts
      : alerts.filter((a) => a.categories.includes(activeFilter));

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900">
        Alerts & Notifications
      </h2>
      <p className="mt-1 text-gray-500">
        Payments, budgets, and important farm events
      </p>

      {/* Filter pills + Mark as all read */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-sm px-4 py-1.5 rounded-xl cursor-pointer transition-colors text-white ${
                  isActive ? "bg-[#5c8247]" : "bg-[#5c8247]/80 hover:bg-[#5c8247]"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
        <button
          onClick={onMarkAllAlertsRead}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium cursor-pointer"
        >
          Mark as all read
        </button>
      </div>

      {/* Alert list */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
          <p className="text-gray-400 text-sm">
            {alerts.length === 0
              ? "No alerts right now."
              : `No ${activeFilter.toLowerCase()} alerts right now.`}
          </p>
        </div>
      ) : (
        filteredAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onDismiss={onDismissAlert} />
        ))
      )}
    </div>
  );
}
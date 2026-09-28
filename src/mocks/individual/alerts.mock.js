// Single source of truth for alert/notification data, shared by BOTH the
// bell popup (NotificationBell.jsx) and the full Alerts page (Alerts.jsx).
// Previously these were two completely separate, hand-maintained data sets
// — the bell was built earlier and never had "Season" added to it, which
// is exactly why they showed different content. Now both read from here.

const MOCK_DELAY_MS = 300;

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export const FILTERS = ["All", "Loans", "Budget", "Expenses", "Weather", "Season"];

const INITIAL_ALERTS = [
  {
    id: "a1",
    iconKey: "loan",
    title: "Loan payment due in 7 days",
    body: "LANDBANK Agriculture Loan ₱14,200 due on September 5, 2026. Ensure funds are ready.",
    time: "2 hours ago",
    categories: ["Loans"],
    unread: true,
  },
  {
    id: "a2",
    iconKey: "budget",
    title: "Irrigation budget exceeded",
    body: "You've spent 27,400 against a ₱25,000 irrigation budget — 9.6% over. Review spending.",
    time: "Yesterday",
    categories: ["Budget"],
    unread: true,
  },
  {
    id: "a3",
    iconKey: "season",
    title: "Short rains season approaching",
    body: "October planting season begins in 32 days. Review your seed and input budget to prepare.",
    time: "Aug 27",
    categories: ["Season"],
    unread: true,
  },
  {
    id: "a4",
    iconKey: "weather",
    title: "Rainfall advisory",
    body: "Above-normal rainfall forecast for Sep–Oct. Ideal for tomato transplanting. Plan field preparation.",
    time: "Aug 26",
    categories: ["Season", "Weather"],
    unread: true,
  },
];

export async function getAlerts() {
  return delay(INITIAL_ALERTS);
}
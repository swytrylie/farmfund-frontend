import { useState, useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { AUDIENCE_OPTIONS } from "../../mocks/admin/adminNotifications.mock";

function StatusBadge({ status }) {
  return (
    <span className="bg-[#e8f5e9] text-[#2e7d32] px-3 py-1 rounded-full text-xs font-semibold">
      {status === "delivered" ? "Delivered" : "Pending"}
    </span>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2d4027] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

function NewAnnouncementModal({ onSend, onCancel }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState(AUDIENCE_OPTIONS[0]);
  const [errors, setErrors] = useState({});

  function handleSend() {
    const newErrors = {
      title: !title.trim() ? "Title is required." : null,
      message: !message.trim() ? "Message is required." : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    onSend({ title: title.trim(), message: message.trim(), audience });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-2xl font-bold text-gray-900">New Announcement</h3>
        <p className="text-xs text-gray-500 mb-6">
          This will be sent as an in-app notification to the selected
          audience.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="e.g., Scheduled maintenance this weekend"
              className={`bg-[#f4f4f4] border rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41] ${
                errors.title ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrors((prev) => ({ ...prev, message: undefined }));
              }}
              placeholder="Write the announcement..."
              className={`bg-[#f4f4f4] border rounded-xl p-3 text-sm w-full h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#4d6b41] ${
                errors.message ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="bg-[#f4f4f4] border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#4d6b41]"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onCancel}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            Send Announcement
          </button>
        </div>
      </div>
    </div>
  );
}

// announcements and onSendAnnouncement now come from AdminDashboard as
// shared state — the same data the bell popup reads, so sending an
// announcement here shows up there too, and vice versa.
export default function NotificationManagement({ announcements, onSendAnnouncement }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  async function handleSend(payload) {
    await onSendAnnouncement(payload);
    setToastMessage("Announcement sent successfully");
    setIsModalOpen(false);
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Notification Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage system notifications and announcements for
            users
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-12 bg-[#2d4027] hover:bg-[#1f2d1b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors w-fit"
        >
          + New Announcement
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sent Announcements</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="pb-2 font-semibold">Title</th>
              <th className="pb-2 font-semibold">Audience</th>
              <th className="pb-2 font-semibold">Sent</th>
              <th className="pb-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => (
              <tr key={a.id} className="border-t border-gray-50">
                <td className="py-3 pr-4 font-medium text-gray-900">{a.title}</td>
                <td className="py-3 pr-4 text-gray-700">{a.audience}</td>
                <td className="py-3 pr-4 text-gray-600">{a.sent}</td>
                <td className="py-3">
                  <StatusBadge status={a.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <NewAnnouncementModal
          onSend={handleSend}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </div>
  );
}
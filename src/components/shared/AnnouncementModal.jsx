import { useEffect } from "react";
import { Megaphone, X } from "lucide-react";
import { formatAnnouncementDateTime } from "../../lib/announcements";

// The full text of one announcement, opened from the bell or the list.
export default function AnnouncementModal({ item, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Announcement"
        className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <span className="w-10 h-10 rounded-xl bg-[#e0ebda] flex items-center justify-center shrink-0">
            <Megaphone size={18} className="text-[#2d4027]" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-gray-900 break-words">{item.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">From FarmFund · {formatAnnouncementDateTime(item.at)}</p>
          </div>
        </div>

        <div className="mt-6 bg-[#f4f4f4] rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap break-words">
          {item.message}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
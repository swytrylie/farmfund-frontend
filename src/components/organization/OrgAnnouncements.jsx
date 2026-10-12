import { Megaphone } from "lucide-react";
import { formatAnnouncementDate } from "../../lib/announcements";

// Messages from the FarmFund team. The list comes from OrgDashboard (the same
// one the bell reads), so reading one here clears it in the bell too.
export default function OrgAnnouncements({ announcementsState, onOpenAnnouncement }) {
  const { items = [], unreadCount = 0, total = 0, loading = false, error = "", reload, markAllRead } =
    announcementsState || {};

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Announcements</h2>
          <p className="text-sm text-gray-500 mt-1">Messages from the FarmFund team</p>
        </div>
        <button
          onClick={() => markAllRead?.()}
          disabled={unreadCount === 0}
          className="mt-4 md:mt-12 border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors w-fit disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Mark all as read
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
      ) : error && items.length === 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-sm text-red-600">
          {error}{" "}
          <button onClick={() => reload?.()} className="font-semibold underline">
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
          <p className="text-gray-400 text-sm">No announcements yet.</p>
        </div>
      ) : (
        <>
          {items.map((a) => (
            <div
              key={a.id}
              role="button"
              tabIndex={0}
              aria-label={`Open announcement ${a.title}`}
              onClick={() => onOpenAnnouncement(a)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenAnnouncement(a);
                }
              }}
              className="bg-[#f4f8f3] border border-green-100 rounded-2xl p-5 shadow-sm relative flex items-start gap-4 mb-4 cursor-pointer hover:bg-[#eef5ec] transition-colors"
            >
              {a.unread && (
                <span data-testid="unread-dot" className="absolute top-5 left-2 w-2 h-2 rounded-full bg-green-500" />
              )}
              <span className="bg-[#e0ebda] text-[#2d4027] p-3 rounded-full flex items-center justify-center shrink-0">
                <Megaphone size={18} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-gray-900">{a.title}</p>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed line-clamp-2">{a.message}</p>
                <p className="mt-2 text-xs text-gray-400">{formatAnnouncementDate(a.at)}</p>
              </div>
            </div>
          ))}
          {total > items.length && (
            <p className="text-xs text-gray-400 text-center">Showing the latest {items.length} of {total}.</p>
          )}
        </>
      )}
    </div>
  );
}
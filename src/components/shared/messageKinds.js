import { Megaphone, Receipt, ShieldCheck } from "lucide-react";
import { messageKind } from "../../lib/notifications";

// How each kind of message in the bell and on the Alerts page looks. The bell,
// the Alerts page and the message window all read from here, so a new kind is
// added in one place.
export const KIND_UI = {
  announcement: {
    label: "Announcement",
    openLabel: "Open announcement",
    from: "FarmFund",
    Icon: Megaphone,
    card: "bg-[#f4f8f3] border-green-100 hover:bg-[#eef5ec]",
    dot: "bg-green-500",
    iconWrap: "bg-[#e0ebda] text-[#2d4027]",
    tag: "bg-[#dbe7d3] text-[#2d4027]",
    empty: "No announcements yet.",
  },
  payment_reminder: {
    label: "Payment reminder",
    openLabel: "Open reminder",
    from: null, // the cooperative's name
    Icon: Receipt,
    card: "bg-[#fff8ec] border-amber-100 hover:bg-[#fff1d9]",
    dot: "bg-amber-500",
    iconWrap: "bg-amber-100 text-amber-700",
    tag: "bg-amber-100 text-amber-800",
    empty: "No payment reminders yet.",
  },
  certificate_verified: {
    label: "Certificate verified",
    openLabel: "Open certificate notice",
    from: "FarmFund",
    Icon: ShieldCheck,
    card: "bg-[#effaf3] border-emerald-100 hover:bg-[#e3f6ea]",
    dot: "bg-emerald-500",
    iconWrap: "bg-emerald-100 text-emerald-700",
    tag: "bg-emerald-100 text-emerald-800",
    empty: "No certificate notices yet.",
  },
};

export const uiFor = (item) => KIND_UI[messageKind(item)];
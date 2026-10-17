import { useState, useRef } from "react";
import { Eye } from "lucide-react";
import { openCollateralFile, growingText } from "../../lib/loans";
import { bytesText, messageFrom } from "../../lib/certificates";

// What a loan is for and what backs it: the crop (with its growing time) and
// the collateral (with its description and a button to open the proof file).
// Shown to the farmer on their own loan and to the cooperative that lent it.
// Loans made before crops and collateral existed have neither, so nothing shows.
export default function LoanBasis({ loan }) {
  const [opening, setOpening] = useState(false);
  const [message, setMessage] = useState("");
  const busy = useRef(false);

  if (!loan || (!loan.cropLabel && !loan.collateral)) return null;
  const c = loan.collateral;

  async function handleOpen() {
    if (busy.current) return;
    busy.current = true;
    setOpening(true);
    setMessage("");
    try {
      const opened = await openCollateralFile(loan._id);
      if (!opened) setMessage("Your browser blocked the new tab. Allow pop-ups for this site and try again.");
    } catch (err) {
      setMessage(messageFrom(err, "Could not open the collateral proof."));
    } finally {
      busy.current = false;
      setOpening(false);
    }
  }

  return (
    <div className="mt-2 border border-gray-100 rounded-xl p-3 bg-gray-50/60 text-sm" data-testid="loan-basis">
      {loan.cropLabel && (
        <div className="flex items-start justify-between gap-4">
          <span className="text-[11px] text-gray-400 shrink-0 pt-0.5">Crop</span>
          <span className="text-right font-semibold text-gray-900 min-w-0">
            {loan.cropLabel}
            {loan.growingDays ? <span className="block text-xs font-normal text-gray-500">Growing time: {growingText(loan.growingDays)}</span> : null}
          </span>
        </div>
      )}
      {c && (
        <div className={`${loan.cropLabel ? "mt-2 pt-2 border-t border-gray-100" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <span className="text-[11px] text-gray-400 shrink-0 pt-0.5">Collateral</span>
            <span className="text-right font-semibold text-gray-900 min-w-0">{c.label}</span>
          </div>
          {c.description && <p className="mt-1 text-xs text-gray-600 whitespace-pre-wrap break-words">{c.description}</p>}
          {c.hasFile && (
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleOpen}
                disabled={opening}
                aria-label="View collateral proof"
                className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50"
              >
                <Eye size={13} /> {opening ? "Opening…" : "View collateral proof"}
              </button>
              {c.fileName && (
                <span className="text-[11px] text-gray-400 truncate max-w-[14rem]">
                  {c.fileName}
                  {typeof c.bytes === "number" ? ` · ${bytesText(c.bytes)}` : ""}
                </span>
              )}
            </div>
          )}
          {message && (
            <p role="alert" className="mt-1.5 text-[11px] text-red-500">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
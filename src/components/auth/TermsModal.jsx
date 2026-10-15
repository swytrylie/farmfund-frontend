import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { TERMS_SECTIONS, TERMS_UPDATED, TERMS_VERSION } from "../../lib/terms";

// The Terms and Conditions in a pop-up. Opened from the sign-up form's consent
// checkbox. "I agree" ticks that checkbox for the person; "Close" leaves it as
// it was. Esc, the X and a click outside the card also close it, focus moves
// into the pop-up while it is open and back to where it was afterwards, and
// the page behind does not scroll.
export default function TermsModal({ onClose, onAgree }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (opener && typeof opener.focus === "function") opener.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white text-gray-800 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="terms-title" className="text-lg font-bold text-gray-900">
              Terms and Conditions
            </h2>
            <p className="text-xs text-gray-500">
              Including how we collect and use your personal data · Version {TERMS_VERSION} · Updated {TERMS_UPDATED}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4 text-sm leading-relaxed">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="mb-1.5 font-bold text-gray-900">{section.title}</h3>
              {section.paragraphs?.map((text) => (
                <p key={text} className="mb-2 text-gray-700">
                  {text}
                </p>
              ))}
              {section.items && (
                <ul className="list-disc space-y-1.5 pl-5 text-gray-700">
                  {section.items.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-5 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          {onAgree && (
            <button
              type="button"
              onClick={onAgree}
              className="rounded-lg bg-[#5bc252] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4caa46]"
            >
              I agree
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
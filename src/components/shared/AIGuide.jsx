import { useState, useEffect, useRef, useCallback } from "react";
import { X, CircleHelp, Languages } from "lucide-react";
import { GUIDE, GUIDE_TABS } from "./aiGuideContent";

// User guide for the AI features (AI Advisor page, chat button, AI Summary).
// Opens from a "How to use" button, and by itself the first time a farmer
// opens the AI Advisor page. The language choice and "already seen" are kept
// in this browser only.
const SEEN_KEY = "farmfund.aiGuide.seen";
const LANG_KEY = "farmfund.aiGuide.lang";

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // private window or storage blocked: the guide still works, it just may open again next time
  }
}

function Step({ number, step }) {
  const Icon = step.icon;
  return (
    <li className="flex gap-3">
      <span className="relative shrink-0 w-9 h-9 rounded-xl bg-[#eef4e8] text-[#3f6238] flex items-center justify-center">
        <Icon size={17} />
        <span className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] rounded-full bg-[#3f6238] text-white text-[10px] font-bold flex items-center justify-center">
          {number}
        </span>
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
        <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">{step.text}</p>
      </div>
    </li>
  );
}

export function AIGuideModal({ onClose, initialTab = "start" }) {
  const [lang, setLang] = useState(() => (readStorage(LANG_KEY) === "tl" ? "tl" : "en"));
  const [tab, setTab] = useState(initialTab);
  const dialogRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [tab, lang]);

  const t = GUIDE[lang];
  const section = t.sections[tab];
  const index = GUIDE_TABS.indexOf(tab);
  const isLast = index === GUIDE_TABS.length - 1;

  function switchLang() {
    const next = lang === "en" ? "tl" : "en";
    setLang(next);
    writeStorage(LANG_KEY, next);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        tabIndex={-1}
        className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-3 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-gray-900">{t.title}</h3>
              <p className="mt-0.5 text-sm text-gray-500">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={switchLang}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#3f6238] hover:bg-[#eef4e8] px-2.5 py-1.5 rounded-full cursor-pointer"
              >
                <Languages size={14} />
                {t.languageLabel}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1.5 cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 -mx-5 sm:mx-0 px-5 sm:px-0 flex gap-1.5 overflow-x-auto" role="tablist">
            {GUIDE_TABS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full cursor-pointer transition-colors ${
                  tab === key ? "bg-[#3f6238] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.tabs[key]}
              </button>
            ))}
          </div>
        </div>

        {/* Body: the only part that scrolls */}
        <div ref={bodyRef} className="px-5 sm:px-7 py-4 overflow-y-auto flex-1 min-h-0 border-t border-gray-100" role="tabpanel">
          {section.intro && <p className="text-sm text-gray-700 leading-relaxed mb-5">{section.intro}</p>}

          <ol className="space-y-5">
            {section.steps.map((step, i) => (
              <Step key={step.title} number={i + 1} step={step} />
            ))}
          </ol>

          {section.colors && (
            <div className="mt-6 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{section.colorsTitle}</p>
              <ul className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {section.colors.map((c) => (
                  <li key={c.text} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className={`w-1.5 h-5 rounded-full ${c.swatch}`} />
                    {c.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section.examples && (
            <div className="mt-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{section.examplesTitle}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {section.examples.map((q) => (
                  <span key={q} className="bg-white border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}

          {section.tips && (
            <div className="mt-6 rounded-2xl bg-[#fffbeb] border border-amber-200 p-4">
              <p className="text-sm font-bold text-amber-900">{section.tipsTitle}</p>
              <ul className="mt-1.5 space-y-1 list-disc pl-5 text-sm text-amber-900/90">
                {section.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-gray-400">
            {index + 1} / {GUIDE_TABS.length}
          </span>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setTab(GUIDE_TABS[index - 1])}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 rounded-full cursor-pointer"
              >
                {t.back}
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? onClose() : setTab(GUIDE_TABS[index + 1]))}
              className="bg-[#3f6238] hover:bg-[#2d4027] text-white text-sm font-semibold px-5 py-2 rounded-full cursor-pointer"
            >
              {isLast ? t.close : t.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// "How to use" button plus its guide. `autoOpen` opens the guide by itself the
// first time this browser shows it. `tone="dark"` is for the green chat header.
export default function AIGuideButton({ tab = "start", autoOpen = false, tone = "light", label = "How to use" }) {
  const [open, setOpen] = useState(() => autoOpen && !readStorage(SEEN_KEY));

  const close = useCallback(() => {
    setOpen(false);
    writeStorage(SEEN_KEY, "1");
  }, []);

  return (
    <>
      {tone === "dark" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-white/70 hover:text-white transition-colors cursor-pointer"
          aria-label={label}
          title={label}
        >
          <CircleHelp size={17} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3f6238] hover:text-[#2d4027] bg-[#eef4e8] hover:bg-[#e2edd8] px-3 py-1.5 rounded-full cursor-pointer transition-colors"
        >
          <CircleHelp size={14} />
          {label}
        </button>
      )}
      {open && <AIGuideModal onClose={close} initialTab={tab} />}
    </>
  );
}

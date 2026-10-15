// Runs something once the mouse button / finger has been LET GO.
//
// Why: leaving a text box often changes the page height at once — an error
// appears under it, a tips card folds away. If that happens while the button
// is still held down (the moment focus moves), whatever you were pressing
// slides away from under the pointer and the click lands on the wrong thing or
// on nothing — typically "type the last field, press Submit, nothing happens".
// Delaying those changes until the pointer is released lets the click finish
// first. With no pointer held (Tab key, typing) the function simply runs now.

let pointerDown = false;
let downAt = 0;
let queue = [];

// A held pointer should only ever last a moment; if the release was missed
// (let go outside the window, say) don't wait forever.
const MAX_HOLD_MS = 5000;
// Lets the click that follows the release be handled before the change.
const SETTLE_MS = 60;

function release() {
  pointerDown = false;
  if (!queue.length) return;
  const run = queue;
  queue = [];
  setTimeout(() => run.forEach((fn) => fn()), SETTLE_MS);
}

if (typeof document !== "undefined") {
  document.addEventListener(
    "pointerdown",
    () => {
      pointerDown = true;
      downAt = Date.now();
    },
    true
  );
  document.addEventListener("pointerup", release, true);
  document.addEventListener("pointercancel", release, true);
}

export function runAfterPointerRelease(fn) {
  if (pointerDown && Date.now() - downAt < MAX_HOLD_MS) {
    queue.push(fn);
  } else {
    fn();
  }
}
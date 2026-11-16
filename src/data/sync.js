// How the app talks to Firestore: writes in the background, listeners that survive errors.
import { onSnapshot } from 'firebase/firestore';

// Firestore resolves a write only once the server confirms it. On a phone with weak signal (or a stalled
// connection on iOS) that can take forever, so screens never wait for it: the change shows up locally at
// once and syncs in the background. A write the server rejects is reported through the error reporter.
let reportError = (message) => console.error(message);
export const setErrorReporter = (fn) => {
  reportError = fn;
};

export function errorMessage(err) {
  switch (err?.code) {
    case 'permission-denied':
      return 'אין הרשאה לפעולה הזו';
    case 'unavailable':
    case 'deadline-exceeded':
      return 'אין חיבור לאינטרנט. נסה שוב';
    default:
      return 'הפעולה נכשלה. נסה שוב';
  }
}

/** Fire-and-forget a write; failures are reported to the user. */
export function background(promise, what) {
  promise.catch((err) => {
    console.error(`[${what}]`, err);
    reportError(errorMessage(err));
  });
}

export const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'deadline-exceeded' })), ms)),
  ]);

/**
 * onSnapshot that survives errors. A Firestore listener dies on its first error (e.g. a permission error in
 * the moment between joining a family and the server knowing about it), and a dead listener means a screen
 * that silently stops updating. This one re-subscribes with backoff until it's unsubscribed.
 */
export function liveSnapshot(target, options, onNext, onFirstError) {
  let unsub = () => {};
  let stopped = false;
  let timer = 0;
  let delay = 1000;
  let reported = false;
  const start = () => {
    unsub = onSnapshot(
      target,
      options,
      (snap) => {
        delay = 1000;
        onNext(snap);
      },
      (err) => {
        console.warn('[listener] retrying after', err.code || err);
        if (!reported) {
          reported = true;
          onFirstError?.(err);
        }
        if (stopped) return;
        timer = setTimeout(() => !stopped && start(), delay);
        delay = Math.min(delay * 2, 30000);
      },
    );
  };
  start();
  return () => {
    stopped = true;
    clearTimeout(timer);
    unsub();
  };
}

export const docsOf = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

/**
 * Polyfill & Protection for window.fetch
 * Prevents "Cannot set property fetch of #<Window> which has only a getter" error
 * when external scripts, extensions, or AI Studio harness attempt to overwrite window.fetch
 */
export function ensureFetchWritable(): void {
  if (typeof window === 'undefined') return;

  try {
    const globalObj = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : self);
    if (!globalObj) return;

    let currentFetch = globalObj.fetch;

    try {
      Object.defineProperty(globalObj, 'fetch', {
        get() {
          return currentFetch;
        },
        set(newFetch) {
          currentFetch = newFetch;
        },
        configurable: true,
        enumerable: true
      });
    } catch {
      if (typeof Window !== 'undefined' && Window.prototype) {
        try {
          Object.defineProperty(Window.prototype, 'fetch', {
            get() {
              return currentFetch;
            },
            set(newFetch) {
              currentFetch = newFetch;
            },
            configurable: true,
            enumerable: true
          });
        } catch {}
      }
    }
  } catch {}

  // Global error safety
  try {
    window.addEventListener('error', (event) => {
      if (event && event.message && event.message.includes('fetch') && event.message.includes('getter')) {
        event.preventDefault();
        return true;
      }
    }, true);
  } catch {}
}

// Immediately invoke upon module load
ensureFetchWritable();

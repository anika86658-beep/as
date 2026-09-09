/**
 * Application Version & Client Cache Management Utility
 * Automatically busts obsolete browser caches and migrates storage across client devices.
 */

export const APP_VERSION = '2.3.0';
export const APP_BUILD_DATE = '2026-08-31';

const LS_VERSION_KEY = 'arishten_app_version';

export function runVersionMigration(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const installedVersion = localStorage.getItem(LS_VERSION_KEY);

    // If version changed, legacy version, or first run with new versioning
    if (installedVersion !== APP_VERSION) {
      console.log(`[VersionSync] Upgrading client device from ${installedVersion || 'legacy'} to v${APP_VERSION}. Purging outdated local records.`);

      // 1. Purge all legacy product/category/order/settings caches that might contain outdated records
      const cacheKeysToClear = [
        'arishten_products',
        'arishten_categories',
        'arishten_orders',
        'arishten_tasks',
        'arishten_store_settings',
        'arishten_cpanel',
        'arishten_deleted_orders',
        'arishten_deleted_products',
        'arishten_deleted_categories',
        'arishten_last_cache_bust'
      ];

      cacheKeysToClear.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // ignore
        }
      });

      // 2. Clear Cache Storage API (if any service worker or browser caching was active)
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        }).catch(() => {});
      }

      // 3. Unregister any lingering Service Workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
          });
        }).catch(() => {});
      }

      // 4. Update stored version
      localStorage.setItem(LS_VERSION_KEY, APP_VERSION);
      localStorage.setItem('arishten_last_cache_bust', new Date().toISOString());

      return true; // Migration performed
    }
  } catch (err) {
    console.warn('[VersionSync] Error running version migration:', err);
  }

  return false;
}

/**
 * Manually force clear all local caches and hard refresh the app
 */
export function forceClearCacheAndReload() {
  if (typeof window === 'undefined') return;

  try {
    const authState = localStorage.getItem('arishten_admin_auth');

    localStorage.clear();
    sessionStorage.clear();

    if (authState) {
      localStorage.setItem('arishten_admin_auth', authState);
    }
    localStorage.setItem(LS_VERSION_KEY, APP_VERSION);

    const hasCacheApi = typeof caches !== 'undefined';
    if (hasCacheApi) {
      caches.keys().then(keys => {
        Promise.all(keys.map(k => caches.delete(k))).finally(() => {
          window.location.reload();
        });
      }).catch(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  } catch (e) {
    window.location.reload();
  }
}

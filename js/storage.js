/**
 * Storage module — unified interface for all localStorage operations.
 *
 * Provides:
 *   KEYS        — namespaced localStorage key constants
 *   get(key)    — safe JSON deserialization (returns null on any failure)
 *   set(key, v) — safe JSON serialization; dispatches 'storage:error' on failure
 *   loadAll()   — reads all five keys and maps missing/invalid values to defaults
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

export const Storage = {
  KEYS: {
    TASKS:      'ld_tasks',
    LINKS:      'ld_links',
    NAME:       'ld_name',
    THEME:      'ld_theme',
    SORT_ORDER: 'ld_sort_order',
  },

  /**
   * Reads and JSON-parses a value from localStorage.
   * Returns null if the key is absent, the value is null, or parsing fails.
   *
   * @param {string} key
   * @returns {*} parsed value or null
   */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * JSON-serializes a value and writes it to localStorage.
   * On failure (e.g. QuotaExceededError) dispatches a custom 'storage:error'
   * event on document so the global toast handler can notify the user.
   *
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      document.dispatchEvent(new CustomEvent('storage:error', { detail: err }));
    }
  },

  /**
   * Reads all five application keys from localStorage and returns a state
   * object with sensible defaults for any missing, null, or invalid entry.
   *
   * Defaults:
   *   tasks     → []
   *   links     → []
   *   name      → ""
   *   theme     → "light"
   *   sortOrder → "date"
   *
   * @returns {{ tasks: Array, links: Array, name: string, theme: string, sortOrder: string }}
   */
  loadAll() {
    const tasks = (() => {
      const v = this.get(this.KEYS.TASKS);
      return Array.isArray(v) ? v : [];
    })();

    const links = (() => {
      const v = this.get(this.KEYS.LINKS);
      return Array.isArray(v) ? v : [];
    })();

    const name = (() => {
      const v = this.get(this.KEYS.NAME);
      return typeof v === 'string' ? v : '';
    })();

    const theme = (() => {
      const v = this.get(this.KEYS.THEME);
      return v === 'light' || v === 'dark' ? v : 'light';
    })();

    const sortOrder = (() => {
      const v = this.get(this.KEYS.SORT_ORDER);
      return v === 'date' || v === 'alpha' || v === 'completion' ? v : 'date';
    })();

    return { tasks, links, name, theme, sortOrder };
  },
};

/**
 * Global storage:error handler.
 * Renders a non-blocking toast notification that auto-dismisses after 5 seconds.
 * Registered once when this module is first imported.
 */
document.addEventListener('storage:error', () => {
  // Avoid stacking duplicate toasts
  const existing = document.getElementById('storage-error-toast');
  if (existing) {
    clearTimeout(Number(existing.dataset.timerId));
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'storage-error-toast';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.textContent = 'Could not save your changes. Storage may be full.';

  // Inline styles ensure the toast is visible even before style.css loads
  Object.assign(toast.style, {
    position:     'fixed',
    bottom:       '1.5rem',
    left:         '50%',
    transform:    'translateX(-50%)',
    background:   '#323232',
    color:        '#fff',
    padding:      '0.75rem 1.5rem',
    borderRadius: '4px',
    fontSize:     '1rem',
    zIndex:       '9999',
    boxShadow:    '0 2px 8px rgba(0,0,0,0.3)',
    maxWidth:     'calc(100vw - 2rem)',
    textAlign:    'center',
  });

  document.body.appendChild(toast);

  const timerId = setTimeout(() => toast.remove(), 5000);
  toast.dataset.timerId = String(timerId);
});

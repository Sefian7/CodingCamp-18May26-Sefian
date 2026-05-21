/**
 * ThemeManager — manages the light/dark theme for the Life Dashboard.
 *
 * Methods:
 *   THEMES            — { LIGHT: 'light', DARK: 'dark' }
 *   resolveTheme(v)   — returns 'light' for any value that is not exactly 'light' or 'dark'
 *   apply(theme)      — sets data-theme on <html> and persists to ld_theme via Storage.set()
 *   init(storedTheme) — resolves and applies the theme synchronously before first paint
 *   toggle()          — switches between light and dark
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.6
 */

import { Storage } from './storage.js';

export const ThemeManager = {
  THEMES: {
    LIGHT: 'light',
    DARK:  'dark',
  },

  /**
   * Returns 'light' for any value that is not exactly 'light' or 'dark'.
   *
   * @param {*} value
   * @returns {'light'|'dark'}
   */
  resolveTheme(value) {
    if (value === this.THEMES.LIGHT || value === this.THEMES.DARK) {
      return value;
    }
    return this.THEMES.LIGHT;
  },

  /**
   * Sets the data-theme attribute on <html> and persists the theme to localStorage.
   * The CSS custom property switch happens within a single style recalculation,
   * well within the 100ms requirement (Requirement 5.2).
   *
   * @param {'light'|'dark'} theme
   */
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    Storage.set(Storage.KEYS.THEME, theme);
  },

  /**
   * Resolves the stored theme value and applies it synchronously.
   * MUST be called before any widget renders to prevent flash of wrong theme
   * (Requirement 5.6).
   *
   * @param {*} storedTheme — raw value read from localStorage (may be invalid)
   */
  init(storedTheme) {
    const theme = this.resolveTheme(storedTheme);
    this.apply(theme);
  },

  /**
   * Toggles between light and dark themes.
   * Reads the current data-theme attribute to determine the active theme,
   * then applies the opposite.
   */
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;
    this.apply(next);
  },
};

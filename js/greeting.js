/**
 * greeting.js — Pure helper functions and GreetingWidget for the Greeting section.
 *
 * Pure helpers are side-effect-free and have no DOM dependencies.
 * GreetingWidget owns the DOM rendering and clock interval.
 *
 * Exports:
 *   getGreeting(hour)          — maps hour 0–23 to a greeting string
 *   getDisplayName(name)       — returns "Friend" for empty/null/undefined, else trimmed name
 *   formatTime(hour, minute)   — returns zero-padded "HH:MM" string
 *   formatDate(date)           — returns "Weekday, DD Month YYYY" string
 *   GreetingWidget             — widget object with init(name), setName(name), tick()
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
 */

import { Storage } from './storage.js';

/**
 * Maps an hour value (0–23) to the appropriate greeting string.
 *
 * Time ranges:
 *   05–11 → "Good morning"
 *   12–17 → "Good afternoon"
 *   18–21 → "Good evening"
 *   22–23 and 00–04 → "Good night"
 *
 * @param {number} hour — integer in the range 0–23
 * @returns {string} greeting string
 */
export function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good morning';
  if (hour >= 12 && hour <= 17) return 'Good afternoon';
  if (hour >= 18 && hour <= 21) return 'Good evening';
  return 'Good night'; // covers 22–23 and 0–4
}

/**
 * Returns the display name to use in the greeting.
 * Falls back to "Friend" when the name is empty, null, or undefined.
 *
 * @param {string|null|undefined} name
 * @returns {string} trimmed name or "Friend"
 */
export function getDisplayName(name) {
  if (name == null) return 'Friend';
  const trimmed = String(name).trim();
  return trimmed.length === 0 ? 'Friend' : trimmed;
}

/**
 * Formats an hour and minute as a zero-padded "HH:MM" string.
 *
 * @param {number} hour   — integer in the range 0–23
 * @param {number} minute — integer in the range 0–59
 * @returns {string} e.g. "09:05"
 */
export function formatTime(hour, minute) {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** English weekday names indexed by Date.getDay() (0 = Sunday). */
const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/** English month names indexed by Date.getMonth() (0 = January). */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Formats a Date object as "Weekday, DD Month YYYY".
 *
 * @param {Date} date
 * @returns {string} e.g. "Thursday, 21 May 2026"
 */
export function formatDate(date) {
  const weekday = WEEKDAYS[date.getDay()];
  const day     = String(date.getDate()).padStart(2, '0');
  const month   = MONTHS[date.getMonth()];
  const year    = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

/**
 * GreetingWidget — manages the greeting section DOM and clock interval.
 *
 * Renders into <section id="greeting-widget"> and keeps the displayed
 * time, date, and greeting text up-to-date via a 60-second interval.
 *
 * Interface:
 *   init(name)      — renders initial state, starts clock, fires first tick
 *   tick()          — reads current Date, updates time/date/greeting in DOM
 *   setName(name)   — validates 1–50 chars, updates DOM, persists to ld_name
 *
 * Requirements: 1.1, 1.2, 1.7, 1.8
 */
export const GreetingWidget = {
  /** @type {number|null} setInterval handle */
  _intervalId: null,

  /** @type {string} current stored name (raw, before display-name fallback) */
  _name: '',

  /**
   * Renders the greeting widget HTML into #greeting-widget, starts the
   * 60-second clock interval, and fires the first tick immediately.
   *
   * @param {string} name — stored name from localStorage (may be empty)
   */
  init(name) {
    this._name = typeof name === 'string' ? name : '';

    const section = document.getElementById('greeting-widget');
    if (!section) return;

    // Build the widget's inner HTML
    section.innerHTML = `
      <div class="greeting-clock" id="greeting-time" aria-live="polite" aria-label="Current time"></div>
      <div class="greeting-date" id="greeting-date"></div>
      <div class="greeting-text" id="greeting-text" aria-live="polite"></div>
      <div class="greeting-name-control">
        <label for="greeting-name-input" class="greeting-name-label">Your name:</label>
        <input
          type="text"
          id="greeting-name-input"
          class="greeting-name-input"
          maxlength="50"
          placeholder="Enter your name"
          aria-label="Enter your name for the greeting"
          value="${this._escapeHtml(this._name)}"
        />
        <button
          type="button"
          id="greeting-name-save"
          class="greeting-name-save"
          aria-label="Save name"
        >Save</button>
        <span id="greeting-name-error" class="error" role="alert" aria-live="assertive"></span>
      </div>
    `;

    // Wire the Save button and Enter key on the input to setName()
    const input = document.getElementById('greeting-name-input');
    const saveBtn = document.getElementById('greeting-name-save');

    saveBtn.addEventListener('click', () => {
      this.setName(input.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.setName(input.value);
      }
    });

    // Clear validation error when the user starts typing
    input.addEventListener('input', () => {
      const errorEl = document.getElementById('greeting-name-error');
      if (errorEl) errorEl.textContent = '';
    });

    // Start the 60-second interval
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
    }
    this._intervalId = setInterval(() => this.tick(), 60_000);

    // Fire the first tick immediately so the display is populated right away
    this.tick();
  },

  /**
   * Reads the current Date and updates the displayed time, date, and greeting.
   * Called immediately on init() and then every 60 seconds by setInterval.
   */
  tick() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    const timeEl = document.getElementById('greeting-time');
    const dateEl = document.getElementById('greeting-date');
    const textEl = document.getElementById('greeting-text');

    if (timeEl) timeEl.textContent = formatTime(hour, minute);
    if (dateEl) dateEl.textContent = formatDate(now);
    if (textEl) {
      const greeting = getGreeting(hour);
      const displayName = getDisplayName(this._name);
      textEl.textContent = `${greeting}, ${displayName}`;
    }
  },

  /**
   * Validates the new name (1–50 characters after trimming), updates the
   * displayed greeting, and persists the raw value to localStorage.
   *
   * Shows an inline error message if validation fails.
   *
   * @param {string} name — raw value from the input field
   */
  setName(name) {
    const errorEl = document.getElementById('greeting-name-error');
    const trimmed = typeof name === 'string' ? name.trim() : '';

    // Validate: 1–50 characters
    if (trimmed.length < 1 || trimmed.length > 50) {
      if (errorEl) {
        errorEl.textContent = trimmed.length === 0
          ? 'Name must be at least 1 character.'
          : 'Name must be 50 characters or fewer.';
      }
      return;
    }

    // Clear any previous error
    if (errorEl) errorEl.textContent = '';

    // Update internal state
    this._name = trimmed;

    // Update the input field to show the trimmed value
    const input = document.getElementById('greeting-name-input');
    if (input) input.value = trimmed;

    // Update the greeting text immediately
    const textEl = document.getElementById('greeting-text');
    if (textEl) {
      const now = new Date();
      const greeting = getGreeting(now.getHours());
      textEl.textContent = `${greeting}, ${getDisplayName(trimmed)}`;
    }

    // Persist to localStorage
    Storage.set(Storage.KEYS.NAME, trimmed);
  },

  /**
   * Escapes a string for safe insertion into an HTML attribute value.
   * @param {string} str
   * @returns {string}
   */
  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },
};

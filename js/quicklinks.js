/**
 * quicklinks.js — QuickLinks widget for the Life Dashboard.
 *
 * Manages user-defined website shortcuts rendered as clickable links.
 *
 * Methods:
 *   init(links)              — renders the add-link form and links list into #quick-links
 *   addLink(label, url)      — validates inputs, adds a new link, renders, and persists
 *   deleteLink(id)           — removes a link by id and persists
 *   render()                 — re-renders the links list from current state
 *   persist()                — writes links array to localStorage via Storage
 *   validateUrl(url)         — returns true if url matches ^https?:\/\/.+ and URL() doesn't throw
 *
 * Data model:
 *   interface QuickLink {
 *     id: string;    // UUID v4
 *     label: string; // 1–50 characters
 *     url: string;   // 1–2048 characters, must start with http:// or https://
 *   }
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

import { Storage } from './storage.js';

/** Maximum number of Quick Links allowed. */
const MAX_LINKS = 20;

/** Regex that a URL must match before the URL constructor check. */
const URL_PATTERN = /^https?:\/\/.+/;

/**
 * Generates a UUID v4 string.
 * Uses crypto.randomUUID() when available (modern browsers), otherwise falls
 * back to a manual implementation that works on file:// without a secure context.
 *
 * @returns {string} UUID v4
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: manual UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const QuickLinks = {
  /** @type {Array<{id: string, label: string, url: string}>} */
  _links: [],

  /** @type {HTMLElement|null} */
  _section: null,

  /** @type {HTMLElement|null} */
  _listEl: null,

  /** @type {HTMLElement|null} */
  _formErrorEl: null,

  /**
   * Initialises the widget: stores the links array, renders the form and list
   * into the #quick-links section.
   *
   * @param {Array<{id: string, label: string, url: string}>} links
   */
  init(links) {
    this._links = Array.isArray(links) ? links : [];
    this._section = document.getElementById('quick-links');
    if (!this._section) return;

    // Build the inner HTML structure once
    this._section.innerHTML = `
      <h2>Quick Links</h2>
      <form id="quick-links-form" novalidate aria-label="Add Quick Link">
        <div class="ql-field">
          <label for="ql-label-input">Label</label>
          <input
            type="text"
            id="ql-label-input"
            name="label"
            placeholder="e.g. GitHub"
            maxlength="50"
            autocomplete="off"
            aria-required="true"
          />
        </div>
        <div class="ql-field">
          <label for="ql-url-input">URL</label>
          <input
            type="url"
            id="ql-url-input"
            name="url"
            placeholder="https://example.com"
            maxlength="2048"
            autocomplete="off"
            aria-required="true"
          />
        </div>
        <span id="ql-form-error" class="error" role="alert" aria-live="polite"></span>
        <button type="submit" id="ql-add-btn" aria-label="Add Quick Link">Add Link</button>
      </form>
      <ul id="quick-links-list" aria-label="Saved Quick Links"></ul>
    `;

    this._listEl = this._section.querySelector('#quick-links-list');
    this._formErrorEl = this._section.querySelector('#ql-form-error');

    // Wire the form submit handler
    const form = this._section.querySelector('#quick-links-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const labelInput = form.querySelector('#ql-label-input');
      const urlInput   = form.querySelector('#ql-url-input');
      const result = this.addLink(labelInput.value, urlInput.value);
      if (result.ok) {
        labelInput.value = '';
        urlInput.value   = '';
        this._clearFormError();
      }
      // Errors are displayed inside addLink via _showFormError
    });

    // Clear inline errors when the user starts typing
    const labelInput = this._section.querySelector('#ql-label-input');
    const urlInput   = this._section.querySelector('#ql-url-input');
    labelInput.addEventListener('input', () => this._clearFormError());
    urlInput.addEventListener('input', () => this._clearFormError());

    this.render();
  },

  /**
   * Validates a URL string.
   * Returns true only if the URL matches ^https?:\/\/.+ AND the URL constructor
   * does not throw (ensuring a non-empty host is present).
   *
   * @param {string} url
   * @returns {boolean}
   */
  validateUrl(url) {
    if (typeof url !== 'string') return false;
    if (!URL_PATTERN.test(url)) return false;
    try {
      const parsed = new URL(url);
      // Ensure the host is non-empty (URL constructor allows e.g. "http:///path")
      return parsed.host.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Validates inputs and adds a new Quick Link.
   * On validation failure returns { ok: false, error: string } and shows an
   * inline error message.
   * On success calls render() and persist(), then returns { ok: true }.
   *
   * Validation rules (Requirement 4.3):
   *   - label must be 1–50 characters
   *   - URL must be valid format (validateUrl) and ≤ 2048 characters
   *   - collection size must be < MAX_LINKS (20)
   *
   * @param {string} label
   * @param {string} url
   * @returns {{ ok: boolean, error?: string }}
   */
  addLink(label, url) {
    const trimmedLabel = typeof label === 'string' ? label.trim() : '';
    const trimmedUrl   = typeof url   === 'string' ? url.trim()   : '';

    // Validate label
    if (trimmedLabel.length === 0) {
      const msg = 'Label is required.';
      this._showFormError(msg);
      return { ok: false, error: msg };
    }
    if (trimmedLabel.length > 50) {
      const msg = 'Label must be 50 characters or fewer.';
      this._showFormError(msg);
      return { ok: false, error: msg };
    }

    // Validate URL length
    if (trimmedUrl.length === 0) {
      const msg = 'URL is required.';
      this._showFormError(msg);
      return { ok: false, error: msg };
    }
    if (trimmedUrl.length > 2048) {
      const msg = 'URL must be 2048 characters or fewer.';
      this._showFormError(msg);
      return { ok: false, error: msg };
    }

    // Validate URL format
    if (!this.validateUrl(trimmedUrl)) {
      const msg = 'URL must start with http:// or https:// and have a valid host.';
      this._showFormError(msg);
      return { ok: false, error: msg };
    }

    // Validate collection size (Requirement 4.8)
    if (this._links.length >= MAX_LINKS) {
      const msg = `Maximum of ${MAX_LINKS} Quick Links reached. Delete one to add another.`;
      this._showFormError(msg);
      return { ok: false, error: msg };
    }

    // All valid — create and store the new link
    const newLink = {
      id:    generateId(),
      label: trimmedLabel,
      url:   trimmedUrl,
    };

    this._links.push(newLink);
    this.render();
    this.persist();

    return { ok: true };
  },

  /**
   * Removes the Quick Link with the given id and persists the updated array.
   *
   * @param {string} id
   */
  deleteLink(id) {
    this._links = this._links.filter((link) => link.id !== id);
    this.persist();
    this.render();
  },

  /**
   * Re-renders the links list from the current _links array.
   * Each link is rendered as an <a> element with target="_blank" and
   * rel="noopener noreferrer" (Requirement 4.4).
   */
  render() {
    if (!this._listEl) return;

    this._listEl.innerHTML = '';

    if (this._links.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'ql-empty';
      empty.textContent = 'No quick links yet. Add one above.';
      this._listEl.appendChild(empty);
      return;
    }

    for (const link of this._links) {
      const li = document.createElement('li');
      li.className = 'ql-item';
      li.dataset.id = link.id;

      // Clickable link (Requirement 4.4)
      const a = document.createElement('a');
      a.href   = link.url;
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';
      a.textContent = link.label;
      a.className   = 'ql-link';
      a.setAttribute('aria-label', `Open ${link.label} in a new tab`);

      // Delete button (Requirement 4.5)
      const deleteBtn = document.createElement('button');
      deleteBtn.type      = 'button';
      deleteBtn.className = 'ql-delete-btn';
      deleteBtn.setAttribute('aria-label', `Delete ${link.label}`);
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => this.deleteLink(link.id));

      li.appendChild(a);
      li.appendChild(deleteBtn);
      this._listEl.appendChild(li);
    }
  },

  /**
   * Persists the current links array to localStorage via Storage.
   * Storage failures are handled by the global storage:error toast (Requirement 4.7).
   */
  persist() {
    Storage.set(Storage.KEYS.LINKS, this._links);
  },

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Displays an inline error message in the form error element.
   * @param {string} message
   */
  _showFormError(message) {
    if (this._formErrorEl) {
      this._formErrorEl.textContent = message;
    }
  },

  /**
   * Clears the inline form error message.
   */
  _clearFormError() {
    if (this._formErrorEl) {
      this._formErrorEl.textContent = '';
    }
  },
};

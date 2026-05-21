/**
 * timer.js — FocusTimer module
 *
 * Implements a 25-minute (1500-second) countdown timer with a four-state
 * machine: IDLE → RUNNING → PAUSED/EXPIRED → IDLE.
 *
 * State transitions:
 *   IDLE    → RUNNING  : start()
 *   RUNNING → PAUSED   : stop()
 *   RUNNING → EXPIRED  : tick() when remaining ≤ 0
 *   RUNNING → IDLE     : reset()
 *   PAUSED  → RUNNING  : start()
 *   PAUSED  → IDLE     : reset()
 *   EXPIRED → IDLE     : reset()
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.10
 */

const STATES = {
  IDLE:    'IDLE',
  RUNNING: 'RUNNING',
  PAUSED:  'PAUSED',
  EXPIRED: 'EXPIRED',
};

const TOTAL_SECONDS = 1500; // 25 minutes

export const FocusTimer = {
  /** @type {'IDLE'|'RUNNING'|'PAUSED'|'EXPIRED'} */
  _state: STATES.IDLE,

  /** Remaining time in milliseconds (used during RUNNING; stored as seconds otherwise) */
  _remainingMs: TOTAL_SECONDS * 1000,

  /** Absolute timestamp (ms) when the current running interval will reach zero */
  _endTime: 0,

  /** setInterval handle; null when not running */
  _intervalId: null,

  // ── DOM references (set in init) ──────────────────────────────────────────
  _display:  null,
  _startBtn: null,
  _stopBtn:  null,
  _resetBtn: null,

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Renders the timer display and buttons into `<section id="focus-timer">`,
   * then wires up the control buttons.
   * Requirements: 2.1
   */
  init() {
    const section = document.getElementById('focus-timer');
    if (!section) return;

    section.innerHTML = `
      <h2>Focus Timer</h2>
      <div
        id="timer-display"
        class="timer-display"
        role="timer"
        aria-live="off"
        aria-label="Focus timer"
      >25:00</div>
      <div class="timer-controls">
        <button id="timer-start" type="button" aria-label="Start timer">Start</button>
        <button id="timer-stop"  type="button" aria-label="Stop timer" disabled>Stop</button>
        <button id="timer-reset" type="button" aria-label="Reset timer">Reset</button>
      </div>
      <span
        id="timer-status"
        class="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      ></span>
    `;

    this._display  = document.getElementById('timer-display');
    this._startBtn = document.getElementById('timer-start');
    this._stopBtn  = document.getElementById('timer-stop');
    this._resetBtn = document.getElementById('timer-reset');

    this._startBtn.addEventListener('click', () => this.start());
    this._stopBtn.addEventListener('click',  () => this.stop());
    this._resetBtn.addEventListener('click', () => this.reset());

    // Ensure state is clean on init
    this._state       = STATES.IDLE;
    this._remainingMs = TOTAL_SECONDS * 1000;
    this._endTime     = 0;
    this._intervalId  = null;

    this._updateDisplay();
    this._updateControls();
  },

  /**
   * Starts or resumes the countdown.
   * Valid from IDLE or PAUSED states.
   * Requirements: 2.2, 2.10
   */
  start() {
    if (this._state !== STATES.IDLE && this._state !== STATES.PAUSED) return;

    // Compute the absolute end time from the current remaining milliseconds
    this._endTime = Date.now() + this._remainingMs;
    this._state   = STATES.RUNNING;

    this._intervalId = setInterval(() => this.tick(), 1000);

    this._updateDisplay();
    this._updateControls();
  },

  /**
   * Pauses the countdown.
   * Valid from RUNNING state only.
   * Requirements: 2.4
   */
  stop() {
    if (this._state !== STATES.RUNNING) return;

    clearInterval(this._intervalId);
    this._intervalId = null;

    // Snapshot remaining time so resume works correctly
    this._remainingMs = Math.max(0, this._endTime - Date.now());
    this._state       = STATES.PAUSED;

    this._updateDisplay();
    this._updateControls();
  },

  /**
   * Resets the timer to IDLE with 25:00 remaining.
   * Clears any active interval BEFORE updating state to prevent a stale tick.
   * Valid from any state.
   * Requirements: 2.5
   */
  reset() {
    // Clear interval first — prevents a final tick from firing after reset
    clearInterval(this._intervalId);
    this._intervalId = null;

    this._state       = STATES.IDLE;
    this._remainingMs = TOTAL_SECONDS * 1000;
    this._endTime     = 0;

    this._updateDisplay();
    this._updateControls();
  },

  /**
   * Called by setInterval every ~1000ms while RUNNING.
   * Uses `endTime - Date.now()` to compute remaining time, preventing drift
   * caused by browser throttling of inactive tabs.
   * Requirements: 2.3, 2.6
   */
  tick() {
    if (this._state !== STATES.RUNNING) return;

    const remaining = this._endTime - Date.now();

    if (remaining <= 0) {
      // Transition to EXPIRED
      clearInterval(this._intervalId);
      this._intervalId  = null;
      this._remainingMs = 0;
      this._state       = STATES.EXPIRED;
    } else {
      this._remainingMs = remaining;
    }

    this._updateDisplay();
    this._updateControls();
  },

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Formats remaining milliseconds as "MM:SS" and updates the display element.
   */
  _updateDisplay() {
    if (!this._display) return;
    const totalSecs = Math.ceil(this._remainingMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    this._display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  /**
   * Updates the enabled/disabled state of Start and Stop buttons based on
   * the current timer state.
   *
   * | State   | Start    | Stop     |
   * |---------|----------|----------|
   * | IDLE    | enabled  | disabled |
   * | RUNNING | disabled | enabled  |
   * | PAUSED  | enabled  | disabled |
   * | EXPIRED | disabled | disabled |
   *
   * Requirements: 2.7, 2.8, 2.9
   */
  _updateControls() {
    if (!this._startBtn || !this._stopBtn) return;

    switch (this._state) {
      case STATES.IDLE:
        this._startBtn.disabled = false;
        this._stopBtn.disabled  = true;
        break;
      case STATES.RUNNING:
        this._startBtn.disabled = true;
        this._stopBtn.disabled  = false;
        break;
      case STATES.PAUSED:
        this._startBtn.disabled = false;
        this._stopBtn.disabled  = true;
        break;
      case STATES.EXPIRED:
        this._startBtn.disabled = true;
        this._stopBtn.disabled  = true;
        break;
    }
  },
};

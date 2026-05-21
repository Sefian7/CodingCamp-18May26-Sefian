/**
 * app.js — Life Dashboard entry point
 *
 * Initializes all modules after the DOM is ready.
 * Modules are imported as ES modules (type="module" in index.html).
 */

import { Storage }        from './storage.js';
import { ThemeManager }   from './theme.js';
import { GreetingWidget } from './greeting.js';
import { FocusTimer }     from './timer.js';
import { TodoList }       from './todo.js';
import { QuickLinks }     from './quicklinks.js';

document.addEventListener('DOMContentLoaded', () => {
  // Load all persisted state first (synchronous localStorage reads)
  const state = Storage.loadAll();

  // Apply theme FIRST — before any widget renders — to prevent flash of wrong theme
  // (Requirement 5.6)
  ThemeManager.init(state.theme);

  // Wire the theme toggle button
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => ThemeManager.toggle());
  }

  GreetingWidget.init(state.name);
  FocusTimer.init();
  TodoList.init(state.tasks, state.sortOrder);
  QuickLinks.init(state.links);

  // Expose modules on window for debugging during development
  // (remove before production)
  window.__Storage        = Storage;
  window.__ThemeManager   = ThemeManager;
  window.__GreetingWidget = GreetingWidget;
  window.__FocusTimer     = FocusTimer;
  window.__TodoList       = TodoList;
  window.__QuickLinks     = QuickLinks;
  window.__state          = state;
});

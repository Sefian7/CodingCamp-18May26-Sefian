/**
 * todo.js — TodoList module for the Life Dashboard
 *
 * Manages the full lifecycle of tasks: add, edit, complete, delete, sort.
 * All mutations are persisted to localStorage via the Storage module.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

import { Storage } from './storage.js';

const { KEYS } = Storage;

/**
 * Generates a UUID v4 string.
 * Uses crypto.randomUUID() when available (all modern browsers),
 * with a manual fallback for older environments.
 *
 * @returns {string} UUID v4
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Manual RFC 4122 v4 UUID fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a sorted copy of the tasks array according to the given sort order.
 *
 * @param {Task[]} tasks
 * @param {'date'|'alpha'|'completion'} order
 * @returns {Task[]}
 */
function sortTasks(tasks, order) {
  const copy = [...tasks];
  if (order === 'alpha') {
    copy.sort((a, b) => a.description.localeCompare(b.description));
  } else if (order === 'completion') {
    // Incomplete first (completed === false → 0, completed === true → 1)
    copy.sort((a, b) => Number(a.completed) - Number(b.completed));
  } else {
    // 'date' — ascending by createdAt (default)
    copy.sort((a, b) => a.createdAt - b.createdAt);
  }
  return copy;
}

export const TodoList = {
  /** @type {Task[]} */
  _tasks: [],

  /** @type {'date'|'alpha'|'completion'} */
  _sortOrder: 'date',

  /** @type {HTMLElement|null} */
  _container: null,

  /**
   * Initialises the widget: stores state, renders the add-task form and task
   * list into `<section id="todo-list">`.
   *
   * @param {Task[]} tasks
   * @param {'date'|'alpha'|'completion'} sortOrder
   */
  init(tasks, sortOrder) {
    this._tasks = Array.isArray(tasks) ? tasks : [];
    this._sortOrder = ['date', 'alpha', 'completion'].includes(sortOrder)
      ? sortOrder
      : 'date';

    this._container = document.getElementById('todo-list');
    if (!this._container) return;

    // Clear any placeholder comment
    this._container.innerHTML = '';

    // Build the static heading + add-form + sort control + list wrapper
    this._container.innerHTML = `
      <h2>To-Do List</h2>

      <form id="todo-add-form" novalidate aria-label="Add a new task">
        <div class="todo-add-row">
          <label for="todo-input" class="sr-only">New task description</label>
          <input
            type="text"
            id="todo-input"
            name="description"
            placeholder="Add a new task…"
            maxlength="200"
            autocomplete="off"
            aria-required="true"
          />
          <button type="submit" id="todo-add-btn" aria-label="Add task">Add</button>
        </div>
        <span class="error" id="todo-add-error" role="alert" aria-live="polite"></span>
      </form>

      <div class="todo-sort-row">
        <label for="todo-sort">Sort by:</label>
        <select id="todo-sort" aria-label="Sort tasks">
          <option value="date">Date created</option>
          <option value="alpha">A – Z</option>
          <option value="completion">Completion</option>
        </select>
      </div>

      <ul id="todo-task-list" aria-label="Task list" aria-live="polite"></ul>
    `;

    // Set the select to the restored sort order
    const sortSelect = this._container.querySelector('#todo-sort');
    sortSelect.value = this._sortOrder;

    // Wire up the add form
    const form = this._container.querySelector('#todo-add-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = this._container.querySelector('#todo-input');
      const result = this.addTask(input.value);
      if (result.ok) {
        input.value = '';
      }
    });

    // Wire up the sort control
    sortSelect.addEventListener('change', () => {
      this.setSortOrder(sortSelect.value);
    });

    this.render();
  },

  /**
   * Adds a new task.
   * Rejects empty or whitespace-only descriptions with an inline error.
   * On success calls render() and persist().
   *
   * @param {string} description
   * @returns {{ ok: boolean, error?: string }}
   */
  addTask(description) {
    const errorEl = this._container
      ? this._container.querySelector('#todo-add-error')
      : null;

    if (!description || !description.trim()) {
      const msg = 'Task description cannot be empty.';
      if (errorEl) {
        errorEl.textContent = msg;
      }
      return { ok: false, error: msg };
    }

    if (errorEl) errorEl.textContent = '';

    const task = {
      id: generateUUID(),
      description: description.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    this._tasks.push(task);
    this.render();
    this.persist();
    return { ok: true };
  },

  /**
   * Switches a task's `<li>` into inline-edit mode.
   * The `<span>` with the description is replaced by an `<input>`.
   * Confirms on Enter or Save click; cancels on Escape.
   *
   * @param {string} id
   */
  editTask(id) {
    const li = this._container
      ? this._container.querySelector(`[data-id="${id}"]`)
      : null;
    if (!li) return;

    const task = this._tasks.find((t) => t.id === id);
    if (!task) return;

    // Prevent double-editing
    if (li.classList.contains('editing')) return;
    li.classList.add('editing');

    const span = li.querySelector('.task-description');
    if (!span) return;

    // Build the edit input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.description;
    input.maxLength = 200;
    input.setAttribute('aria-label', 'Edit task description');

    // Inline error element
    const errorSpan = document.createElement('span');
    errorSpan.className = 'error';
    errorSpan.setAttribute('role', 'alert');
    errorSpan.setAttribute('aria-live', 'polite');

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'task-save-btn';
    saveBtn.textContent = 'Save';
    saveBtn.setAttribute('aria-label', 'Save task edit');

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'task-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.setAttribute('aria-label', 'Cancel task edit');

    // Replace the span with the edit controls
    span.replaceWith(input);
    // Insert error + buttons after the input
    input.insertAdjacentElement('afterend', errorSpan);
    errorSpan.insertAdjacentElement('afterend', saveBtn);
    saveBtn.insertAdjacentElement('afterend', cancelBtn);

    // Focus the input and move cursor to end
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    const confirm = () => {
      const newDescription = input.value;
      if (!newDescription || !newDescription.trim()) {
        errorSpan.textContent = 'Task description cannot be empty.';
        input.focus();
        return;
      }
      task.description = newDescription.trim();
      li.classList.remove('editing');
      this.render();
      this.persist();
    };

    const cancel = () => {
      li.classList.remove('editing');
      this.render();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      } else if (e.key === 'Escape') {
        cancel();
      }
    });

    saveBtn.addEventListener('click', confirm);
    cancelBtn.addEventListener('click', cancel);
  },

  /**
   * Toggles the completed state of a task and re-persists.
   *
   * @param {string} id
   */
  toggleComplete(id) {
    const task = this._tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    // Update the DOM directly for speed, then persist
    const li = this._container
      ? this._container.querySelector(`[data-id="${id}"]`)
      : null;
    if (li) {
      const span = li.querySelector('.task-description');
      if (span) {
        span.style.textDecoration = task.completed ? 'line-through' : '';
        span.style.opacity = task.completed ? '0.6' : '';
      }
      const checkbox = li.querySelector('.task-complete-btn');
      if (checkbox) {
        checkbox.setAttribute('aria-pressed', String(task.completed));
        checkbox.title = task.completed ? 'Mark incomplete' : 'Mark complete';
        checkbox.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
        checkbox.textContent = task.completed ? '✓' : '○';
      }
      li.classList.toggle('completed', task.completed);
    }
    this.persist();
  },

  /**
   * Removes a task from the array and persists.
   *
   * @param {string} id
   */
  deleteTask(id) {
    this._tasks = this._tasks.filter((t) => t.id !== id);
    this.render();
    this.persist();
  },

  /**
   * Updates the active sort order, re-renders, and persists the sort order.
   *
   * @param {'date'|'alpha'|'completion'} order
   */
  setSortOrder(order) {
    if (!['date', 'alpha', 'completion'].includes(order)) return;
    this._sortOrder = order;
    this.render();
    Storage.set(KEYS.SORT_ORDER, order);
  },

  /**
   * Re-renders the task list `<ul>` from the current tasks array and sort order.
   * Does not touch the add-form or sort control.
   */
  render() {
    if (!this._container) return;

    const ul = this._container.querySelector('#todo-task-list');
    if (!ul) return;

    const sorted = sortTasks(this._tasks, this._sortOrder);

    if (sorted.length === 0) {
      ul.innerHTML = '<li class="todo-empty">No tasks yet. Add one above!</li>';
      return;
    }

    ul.innerHTML = '';
    sorted.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.completed ? ' completed' : '');
      li.dataset.id = task.id;

      // Complete toggle button
      const completeBtn = document.createElement('button');
      completeBtn.type = 'button';
      completeBtn.className = 'task-complete-btn';
      completeBtn.setAttribute('aria-pressed', String(task.completed));
      completeBtn.title = task.completed ? 'Mark incomplete' : 'Mark complete';
      completeBtn.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
      // Checkmark / circle icon via text
      completeBtn.textContent = task.completed ? '✓' : '○';
      completeBtn.addEventListener('click', () => this.toggleComplete(task.id));

      // Description span
      const span = document.createElement('span');
      span.className = 'task-description';
      span.textContent = task.description;
      if (task.completed) {
        span.style.textDecoration = 'line-through';
        span.style.opacity = '0.6';
      }

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'task-edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', `Edit task: ${task.description}`);
      editBtn.addEventListener('click', () => this.editTask(task.id));

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'task-delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete task: ${task.description}`);
      deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

      li.appendChild(completeBtn);
      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      ul.appendChild(li);
    });
  },

  /**
   * Persists the current tasks array to localStorage.
   * Called within 100ms of any mutation (synchronously in the same call stack).
   */
  persist() {
    Storage.set(KEYS.TASKS, this._tasks);
  },
};

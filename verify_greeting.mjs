import { getGreeting, getDisplayName, formatTime, formatDate } from './js/greeting.js';

let pass = true;

// getGreeting boundary tests
const greetingTests = [
  [0, 'Good night'], [1, 'Good night'], [4, 'Good night'],
  [5, 'Good morning'], [11, 'Good morning'],
  [12, 'Good afternoon'], [17, 'Good afternoon'],
  [18, 'Good evening'], [21, 'Good evening'],
  [22, 'Good night'], [23, 'Good night'],
];
for (const [h, expected] of greetingTests) {
  const got = getGreeting(h);
  if (got !== expected) {
    console.error(`FAIL getGreeting(${h}): expected "${expected}", got "${got}"`);
    pass = false;
  }
}

// getDisplayName tests
const nameTests = [
  [null, 'Friend'], [undefined, 'Friend'], ['', 'Friend'], ['   ', 'Friend'],
  ['Alice', 'Alice'], ['  Bob  ', 'Bob'],
];
for (const [n, expected] of nameTests) {
  const got = getDisplayName(n);
  if (got !== expected) {
    console.error(`FAIL getDisplayName(${JSON.stringify(n)}): expected "${expected}", got "${got}"`);
    pass = false;
  }
}

// formatTime tests
const timeTests = [
  [0, 0, '00:00'], [9, 5, '09:05'], [23, 59, '23:59'], [12, 30, '12:30'],
];
for (const [h, m, expected] of timeTests) {
  const got = formatTime(h, m);
  if (got !== expected) {
    console.error(`FAIL formatTime(${h},${m}): expected "${expected}", got "${got}"`);
    pass = false;
  }
}

// formatDate test — Thursday, 21 May 2026
const d = new Date(2026, 4, 21);
const gotDate = formatDate(d);
const expectedDate = 'Thursday, 21 May 2026';
if (gotDate !== expectedDate) {
  console.error(`FAIL formatDate: expected "${expectedDate}", got "${gotDate}"`);
  pass = false;
}

if (pass) console.log('All checks passed.');

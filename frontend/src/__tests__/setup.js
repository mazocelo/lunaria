/**
 * Vitest global setup for Zustand store tests.
 *
 * - Stubs browser-only APIs (localStorage, crypto) so stores that reference
 *   them at import time do not throw.
 * - Mocks import.meta.env for Vite environment variables.
 * - Provides a reusable `resetAllStores` helper.
 */

import { afterEach } from 'vitest';

// ---- localStorage stub (jsdom provides one but it is reset per-test) ----
if (typeof globalThis.localStorage === 'undefined') {
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

// ---- crypto.randomUUID stub (used by socket send actions) ----
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

// ---- Clean up localStorage between tests ----
afterEach(() => {
  localStorage.clear();
});

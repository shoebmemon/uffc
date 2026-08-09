// Simple localStorage-backed storage, mirroring the get/set shape
// used by the original Claude artifact (window.storage) so App.jsx
// needed almost no changes when moved to a standalone site.
//
// If you later add a backend, swap the internals of these two
// functions for real API/fetch calls and nothing else needs to change.

const PREFIX = "uffc_gym:";

export const storage = {
  async get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return null;
      return { key, value: raw, shared: false };
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, value);
      return { key, value, shared: false };
    } catch (e) {
      return null;
    }
  },
};

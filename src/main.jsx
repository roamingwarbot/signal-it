import React from 'react';
import ReactDOM from 'react-dom/client';
import ITNewsDashboard from './ITNewsDashboard.jsx';

// Polyfill window.storage for standalone deployment using localStorage
if (!window.storage) {
  window.storage = {
    async get(key) {
      try {
        const val = localStorage.getItem(key);
        return val !== null ? { key, value: val } : null;
      } catch {
        return null;
      }
    },
    async set(key, value) {
      try {
        localStorage.setItem(key, value);
        return { key, value };
      } catch {
        return null;
      }
    },
    async delete(key) {
      try {
        localStorage.removeItem(key);
        return { key, deleted: true };
      } catch {
        return null;
      }
    },
    async list(prefix) {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!prefix || k.startsWith(prefix)) keys.push(k);
        }
        return { keys };
      } catch {
        return { keys: [] };
      }
    },
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ITNewsDashboard />
  </React.StrictMode>
);

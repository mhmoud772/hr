import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/i18n";

const DYNAMIC_IMPORT_RELOAD_KEY = "hr-companion:dynamic-import-reload";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Global error handlers - show fatal errors before React renders.
function showFatalError(msg: string) {
  try {
    const root = document.getElementById("root");
    const safeMsg = escapeHtml(msg);
    if (root) {
      root.innerHTML = `<div style="padding:24px;color:#991b1b;background:#fef2f2;font-family:system-ui,sans-serif"><h2 style="margin:0 0 12px">Application error</h2><pre style="white-space:pre-wrap;margin:0">${safeMsg}</pre></div>`;
    } else {
      document.body.innerHTML = `<pre>${safeMsg}</pre>`;
    }
  } catch (e) {
    // ignore
  }
}

function isDynamicImportError(value: unknown) {
  const message = String(
    value instanceof Error ? value.message : value ?? "",
  ).toLowerCase();

  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("error loading dynamically imported module")
  );
}

function isLocalRuntime() {
  return LOCAL_HOSTS.has(window.location.hostname);
}

async function resetLocalClientCaches() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const keys = await window.caches.keys();
    await Promise.all(keys.map((key) => window.caches.delete(key)));
  }
}

function recoverFromDynamicImportError(value: unknown) {
  if (!isDynamicImportError(value)) {
    return false;
  }

  const hasRetried =
    window.sessionStorage.getItem(DYNAMIC_IMPORT_RELOAD_KEY) === "1";

  if (!hasRetried) {
    window.sessionStorage.setItem(DYNAMIC_IMPORT_RELOAD_KEY, "1");
    void resetLocalClientCaches().finally(() => {
      window.location.reload();
    });
    return true;
  }

  window.sessionStorage.removeItem(DYNAMIC_IMPORT_RELOAD_KEY);
  return false;
}

window.addEventListener("error", (ev: ErrorEvent) => {
  const err = ev.error || ev.message || String(ev);
  if (recoverFromDynamicImportError(err)) {
    return;
  }
  console.error("Captured window error:", err);
  showFatalError(String((err as Error).message || String(err)));
});
window.addEventListener("unhandledrejection", (ev: PromiseRejectionEvent) => {
  const reason = ev.reason;
  if (recoverFromDynamicImportError(reason)) {
    return;
  }
  console.error("Unhandled rejection:", reason);
  showFatalError(
    String(reason instanceof Error ? reason.message : String(reason)),
  );
});

console.log("Initializing React app (main.tsx)");

if (isLocalRuntime()) {
  void resetLocalClientCaches();
}

import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0, 
    tracePropagationTargets: ["localhost", /^\//],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

window.setTimeout(() => {
  window.sessionStorage.removeItem(DYNAMIC_IMPORT_RELOAD_KEY);
}, 1000);

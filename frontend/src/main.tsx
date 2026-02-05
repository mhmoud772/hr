import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

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
      <h2>Application error</h2>;
    } else {
      document.body.innerHTML = `<pre>${safeMsg}</pre>`;
    }
  } catch (e) {
    // ignore
  }
}

window.addEventListener("error", (ev: ErrorEvent) => {
  const err = ev.error || ev.message || String(ev);
  console.error("Captured window error:", err);
  showFatalError(String((err as Error).message || String(err)));
});
window.addEventListener("unhandledrejection", (ev: PromiseRejectionEvent) => {
  const reason = ev.reason;
  console.error("Unhandled rejection:", reason);
  showFatalError(
    String(reason instanceof Error ? reason.message : String(reason)),
  );
});

console.log("Initializing React app (main.tsx)");

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

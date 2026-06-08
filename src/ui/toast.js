// ==============================
// Aircombat Competition Manager
// src/ui/toast.js
// ==============================
// Kevyt ilmoitusjärjestelmä.
// ==============================

import { escapeHtml } from "../utils/html.js";

export function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${type === "success" ? "✓" : "⚠"}</div>
    <div class="toast-message">${escapeHtml(message)}</div>
  `;

  container.appendChild(toast);

  // Trigger reflow to start animation
  void toast.offsetWidth;
  toast.classList.add("toast-show");

  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => {
      toast.remove();
    }, 300); // Matches CSS transition duration
  }, 3000);
}

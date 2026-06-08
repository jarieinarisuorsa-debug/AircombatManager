// ==============================
// Aircombat Competition Manager
// src/ui/domHelpers.js
// Päivitetty: 2026-06-04
// ==============================
// Pienet DOM-apurit, joita controllerit ja main-renderöinti käyttävät.
// ==============================

import { updateState } from "../state/store.js";

export function updateOutput(form, name, value) {
  const el = form.querySelector(`output[name="${name}"]`);
  if (el) el.textContent = value;
}

export function updateEntryFormVisibility(form) {
  const pilotSelect = form.querySelector("#entry-pilot-select");
  const aircraftSelect = form.querySelector("#entry-aircraft-select");
  const newPilotFields = form.querySelector("#new-pilot-fields");
  const newAircraftFields = form.querySelector("#new-aircraft-fields");

  if (!pilotSelect || !aircraftSelect) return;

  const pilotId = pilotSelect.value;

  if (newPilotFields) {
    if (pilotId) {
      newPilotFields.style.display = "none";
      newPilotFields.querySelectorAll("input").forEach((input) => input.removeAttribute("required"));
    } else {
      newPilotFields.style.display = "grid";
    }
  }

  const options = aircraftSelect.querySelectorAll("option");
  options.forEach((option) => {
    if (option.value === "") {
      option.style.display = "";
      return;
    }

    const optionPilotId = option.dataset.pilotId;
    if (!pilotId || optionPilotId === pilotId) {
      option.style.display = "";
      return;
    }

    option.style.display = "none";
    if (aircraftSelect.value === option.value) aircraftSelect.value = "";
  });

  const aircraftId = aircraftSelect.value;

  if (newAircraftFields) {
    const classNameInput = newAircraftFields.querySelector('input[name="className"]');
    if (aircraftId) {
      newAircraftFields.style.display = "none";
      if (classNameInput) classNameInput.removeAttribute("required");
    } else {
      newAircraftFields.style.display = "grid";
      if (classNameInput) classNameInput.setAttribute("required", "");
    }
  }
}

export function updateBulkButtonState() {
  const bulkBtn = document.querySelector("#bulk-register-btn");
  if (!bulkBtn) return;
  const anyChecked = document.querySelectorAll(".pilot-select-checkbox:checked").length > 0;
  bulkBtn.disabled = !anyChecked;
}

export function filterPilots() {
  const isWorkspace = !!document.getElementById("workspace-pilot-search");
  const searchEl = document.getElementById(isWorkspace ? "workspace-pilot-search" : "pilot-search");
  const countryEl = document.getElementById(isWorkspace ? "workspace-pilot-country-filter" : "pilot-country-filter");
  const query = searchEl ? searchEl.value.toLowerCase().trim() : "";
  const countryFilter = countryEl ? countryEl.value.toLowerCase() : "";

  updateState((state) => {
    if (isWorkspace) {
      state.settings.workspacePilotSearch = searchEl ? searchEl.value : "";
      state.settings.workspacePilotCountryFilter = countryEl ? countryEl.value : "";
    } else {
      state.settings.pilotSearchQuery = searchEl ? searchEl.value : "";
      state.settings.pilotCountryFilter = countryEl ? countryEl.value : "";
    }
  }, "update_pilot_filters");

  const items = document.querySelectorAll(".pilot-card, .pilot-table-row");
  items.forEach((item) => {
    const name = String(item.dataset.name || "").toLowerCase();
    const club = String(item.dataset.club || "").toLowerCase();
    const country = String(item.dataset.country || "").toLowerCase();

    const matchesSearch = !query || name.includes(query) || club.includes(query) || country.includes(query);
    const matchesCountry = !countryFilter || country === countryFilter;
    item.style.display = matchesSearch && matchesCountry ? "" : "none";
  });
}

export function markFormDirty(event) {
  const form = event.target.closest("form[data-action]");
  if (form) {
    form.dataset.dirty = "true";
    const statusBar = form.querySelector(".form-status-bar");
    if (statusBar) {
      statusBar.innerHTML = `<span style="color: var(--warning); font-weight: 500;">Muutoksia ei ole tallennettu</span>`;
      statusBar.style.display = "block";
    }

    const tabFooters = form.querySelectorAll(".tab-save-footer");
    tabFooters.forEach(footer => {
      footer.innerHTML = `<span style="color: var(--warning); font-weight: 500;">Muutoksia ei ole tallennettu</span>`;
      footer.style.textAlign = "right";
      footer.style.padding = "10px";
    });
  }
}

export function applyFormSaveFeedback(state) {
  const lastSave = state.settings?.lastSave;
  if (!lastSave) return;
  
  const forms = document.querySelectorAll(`form[data-action="${lastSave.action}"]`);
  forms.forEach(form => {
    if (lastSave.id && form.id !== lastSave.id) return; // Vain tietylle lomakkeelle, jos id määritetty
    if (form.dataset.noFeedback === "true") return; // Ohita lomakkeet, jotka eivät halua palautetta (esim. chat)

    const isRecent = Date.now() - lastSave.time < 5000; // 5 sekuntia
    const isDirty = form.dataset.dirty === "true";

    const statusBar = form.querySelector(".form-status-bar");
    if (statusBar && !isDirty) {
      const d = new Date(lastSave.time);
      const timeStr = `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
      statusBar.innerHTML = `Viimeksi tallennettu klo ${timeStr}`;
      statusBar.style.display = "block";
    }

    if (isRecent && !isDirty) {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.dataset.originalText = btn.innerText;
        btn.innerText = "✓ Tallennettu";
        btn.classList.add("button-success");
      }
    }

    const tabFooters = form.querySelectorAll(".tab-save-footer");
    tabFooters.forEach(footer => {
      if (!isDirty) {
        const d = new Date(lastSave.time);
        const timeStr = `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}.${String(d.getSeconds()).padStart(2, '0')}`;
        if (isRecent) {
          footer.innerHTML = `<span style="color: var(--success); font-weight: bold;">✓ Tallennettu (${timeStr})</span>`;
        } else {
          footer.innerHTML = `<span style="color: var(--text-muted); font-size: 0.85rem;">Viimeksi tallennettu klo ${timeStr}</span>`;
        }
        footer.style.textAlign = "right";
        footer.style.padding = "10px";
      } else {
        footer.innerHTML = `<span style="color: var(--warning); font-weight: 500;">Muutoksia ei ole tallennettu</span>`;
        footer.style.textAlign = "right";
        footer.style.padding = "10px";
      }
    });
  });
}

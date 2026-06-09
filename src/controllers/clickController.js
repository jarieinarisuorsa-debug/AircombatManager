// ==============================
// Aircombat Competition Manager
// src/controllers/clickController.js
// Päivitetty: 2026-06-04
// ==============================
// Click dispatcher. Pitää DOM-päätökset erillään data-actioneista.
// ==============================





import { setActiveEvent } from "../features/settings/settingsActions.js";
import { exportState, getState, resetState } from "../state/store.js";
import { requireAdmin } from "../users/roles.js";
import { downloadTextFile } from "../utils/html.js";
import { openAlertModal } from "../core/alertActions.js";
import { openConfirmModal } from "../core/confirmActions.js";
import { deleteMessage } from "../features/messages/messageActions.js";
import { handleAction } from "../core/actionRegistry.js";

export function createClickHandler({ renderApp }) {
  return function handleClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button || ["FORM", "SELECT", "INPUT", "TEXTAREA"].includes(button.tagName)) return;

    // Prevent triggering parent actions (like row clicks) when interacting with form fields
    const formElement = event.target.closest("select, input, textarea");
    if (formElement && formElement !== button) return;

    const action = button.dataset.action;
    const context = { renderApp };

    try {
      if (action === "open-signature") {
        const handled = handleAction(action, event, button, context);
        if (!handled) console.error("ERROR: open-signature action was NOT registered in actionRegistry!");
        return;
      }
      if (handleAction(action, event, button, context)) return;
      if (runUiClickAction(action, button, context)) return;
      if (runCrudClickAction(action, button, context)) return;
      if (runCompetitionClickAction(action, button, context)) return;
      if (runDataClickAction(action, context)) return;
    } catch (error) {
      openAlertModal({ message: error.message });
    }
  };
}

function runUiClickAction(action, button, { renderApp }) {
  if (action === "print-class-heats") {
    const targetClass = button.dataset.class;
    location.hash = `#/heats/${targetClass}`;
    renderApp();
    window.print();
    return true;
  }
  if (action === "show-qr-code") {
    const entryId = button.dataset.entryId;
    Promise.all([
      import("../features/scorecards/components/ScoreCardQR.js"),
      import("../logic/scoreCards.js"),
      import("../utils/html.js"),
      import("../state/store.js"),
      import("../logic/competitionFormat.js")
    ]).then(([ScoreCardQR, logic, htmlUtils, store, compFormat]) => {
      const state = store.getState();
      const event = htmlUtils.getActiveEvent(state);
      const rows = logic.buildScoreCardRows(state, event);
      const row = rows.find(r => r.entry.id === entryId);
      if (row) {
        let activeHeatTitle = "";
        const activeTabBtn = document.querySelector('.scorecard-tabs .tab-btn.active');
        if (activeTabBtn && activeTabBtn.dataset.tabTarget) {
           const parts = activeTabBtn.dataset.tabTarget.split('-');
           if (parts.length >= 2) {
             const roundNumber = Number(parts[1]);
             const stages = logic.getScoreCardStructureStages({ card: row.card, event, entry: row.entry, aircraft: row.aircraft });
             const stage = stages.find(s => s.roundNumber === roundNumber);
             if (stage) {
                 const heat = (row.pilotHeats || []).find(h => h.phase === stage.heatPhase && h.round === stage.heatRound);
                 if (heat) {
                     activeHeatTitle = compFormat.formatHeatTitle(heat, state);
                 }
             }
           }
        }
        document.getElementById("modal-container").innerHTML = ScoreCardQR.renderQRGeneratorModal(row.card, row.pilotName, activeHeatTitle);
      }
    });
    return true;
  }
  
  if (action === "open-qr-scanner") {
    import("../features/scorecards/components/ScoreCardQR.js").then((ScoreCardQR) => {
      document.getElementById("modal-container").innerHTML = ScoreCardQR.renderQRScannerModal();
    });
    return true;
  }

  if (action === "close-qr-scanner") {
    if (window._currentQrScanner) {
      window._currentQrScanner.stop().catch(e => console.error(e));
      window._currentQrScanner = null;
    }
    document.getElementById("modal-container").innerHTML = "";
    return true;
  }

  if (action === "print-page" || action === "print-empty-pilot" || action === "print-empty-blank") {
    const executePrint = (mode) => {
      window.PRINT_EMPTY_CARD_MODE = mode;
      renderApp();
      window.print();
      window.PRINT_EMPTY_CARD_MODE = null;
      renderApp();
    };

    if (action === "print-page") {
      const form = button.closest("form");
      if (form && form.dataset.action === "save-score-card") {
        Promise.all([
          import("./submitController.js"),
          import("../features/scorecards/scorecardActions.js")
        ]).then(([submitCtrl, scorecardActions]) => {
          const data = submitCtrl.readFormData(form, "save-score-card");
          scorecardActions.saveScoreCard(data, form);
          executePrint("filled");
        }).catch(err => {
          console.error("Tulostuksen tallennus epäonnistui:", err);
          executePrint("filled");
        });
        return true;
      }
      executePrint("filled");
      return true;
    }

    if (action === "print-empty-pilot") {
      executePrint("pilot");
      return true;
    }
    if (action === "print-empty-blank") {
      executePrint("blank");
      return true;
    }
    
    return true;
  }

  if (action === "print-generic-empty-card") {
    window.PRINT_GENERIC_EMPTY_CARD_TEMPLATE = button.dataset.templateId;
    window.PRINT_GENERIC_EMPTY_CARD_CLASS = button.dataset.raceClass;
    renderApp();
    window.print();
    window.PRINT_GENERIC_EMPTY_CARD_TEMPLATE = null;
    window.PRINT_GENERIC_EMPTY_CARD_CLASS = null;
    renderApp();
    return true;
  }

  if (action === "print-inspection-list") {
    window.PRINT_DOCUMENT_TYPE = "inspection";
    renderApp();
    window.print();
    window.PRINT_DOCUMENT_TYPE = null;
    renderApp();
    return true;
  }

  if (action === "print-judges-list") {
    window.PRINT_DOCUMENT_TYPE = "judges";
    renderApp();
    window.print();
    window.PRINT_DOCUMENT_TYPE = null;
    renderApp();
    return true;
  }

  if (action === "filter-entries-table") {
    filterEntriesTable(button);
    return true;
  }

  if (action === "clear-coat-of-arms") {
    const preview = document.getElementById("coat-of-arms-preview");
    const hiddenData = document.getElementById("coat-of-arms-data");
    const uploadInput = document.getElementById("coat-of-arms-upload");
    const previewCard = document.getElementById("coat-of-arms-preview-card");
    const dropzone = document.getElementById("coat-of-arms-dropzone-label");
    
    if (preview) { preview.src = ""; }
    if (hiddenData) hiddenData.value = "";
    if (uploadInput) uploadInput.value = "";
    if (previewCard) previewCard.style.display = "none";
    if (dropzone) dropzone.style.display = "flex";
    return true;
  }

  if (action === "set-document-tab") {
    window.DOCUMENT_TAB = button.dataset.tab;
    renderApp();
    return true;
  }

  if (action === "switch-scorecard-tab") {
    const targetId = button.dataset.tabTarget;
    const container = button.closest(".scorecard-tab-container");
    if (container && targetId) {
      container.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      container.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      
      button.classList.add("active");
      const contentEl = container.querySelector(`#${targetId}`);
      if (contentEl) contentEl.classList.add("active");
    }
    return true;
  }

  if (action === "step-input") {
    stepInput(button);
    return true;
  }

  if (action === "delete-message-prompt") {
    openConfirmModal({
      title: "Poista viesti",
      message: "Haluatko varmasti poistaa tämän viestin? Toimintoa ei voi perua.",
      submitLabel: "Poista",
      isDanger: true,
      action: "execute-delete-message",
      payload: { messageId: button.dataset.messageId }
    });
    return true;
  }

  if (action === "clear-all-messages-prompt") {
    openConfirmModal({
      title: "Tyhjennä viestiseinä",
      message: "Haluatko varmasti poistaa kaikki viestit? Tätä toimintoa ei voi perua ja se tyhjentää seinän kaikilta käyttäjiltä.",
      submitLabel: "Tyhjennä",
      isDanger: true,
      action: "execute-clear-all-messages",
      payload: {}
    });
    return true;
  }

  return false;
}
function runCrudClickAction(action, button, { renderApp }) {
  return false;
}



function runCompetitionClickAction(action, button, { renderApp }) {
  return false;
}

function runDataClickAction(action, { renderApp }) {
  return false;
}

function filterEntriesTable(button) {
  const targetClass = button.dataset.class;
  const container = button.closest(".row-actions");
  if (container) {
    container.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
  }

  const rows = document.querySelectorAll(".participant-table-row");
  rows.forEach((row) => {
    row.style.display = targetClass === "all" || row.dataset.class === targetClass ? "" : "none";
  });
}





function stepInput(button) {
  const targetName = button.dataset.target;
  const step = button.dataset.step === "minus" ? -1 : 1;
  const form = button.closest("form");
  if (!form) return;

  const input = form.querySelector(`[name="${targetName}"]`);
  if (!input) return;

  const min = Number(input.getAttribute("min") ?? 0);
  const max = Number(input.getAttribute("max") ?? 99);
  const value = Number(input.value || 0);
  input.value = Math.min(max, Math.max(min, value + step));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

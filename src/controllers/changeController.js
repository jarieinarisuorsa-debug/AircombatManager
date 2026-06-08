// ==============================
// Aircombat Competition Manager
// src/controllers/changeController.js
// Päivitetty: 2026-06-04
// ==============================
// Change-event dispatcher.
// ==============================

import { getState, updateState, importState } from "../state/store.js";
import { requireAdmin, requirePilotAccess } from "../users/roles.js";
import { handleAction } from "../core/actionRegistry.js";
import { openConfirmModal } from "../core/confirmActions.js";
import { changeRole } from "../features/settings/settingsActions.js";
import { filterPilots, updateEntryFormVisibility, markFormDirty } from "../ui/domHelpers.js";
import { handleScoreCardInput } from "./scoreCardInputController.js";
import { resizeImage } from "../utils/image.js";
import { openAlertModal } from "../core/alertActions.js";

export function createChangeHandler({ renderApp }) {
  return function handleChange(event) {
    markFormDirty(event);
    if (event.target.id === "pilot-avatar-upload") {
      const file = event.target.files?.[0];
      const pilotId = event.target.dataset.pilotId;
      if (!file || !pilotId) return;

      resizeImage(file, 300).then((dataUrl) => {
        updateState((state) => {
          const pilot = state.pilots.find(p => p.id === pilotId);
          if (pilot) {
            pilot.avatarData = dataUrl;
          }
        }, "upload_pilot_avatar");
        renderApp();
      }).catch(err => {
        console.error("Avatar resize failed", err);
        openAlertModal({ title: "Virhe", message: "Kuvan lataus epäonnistui." });
      });
      return;
    }

    if (event.target.id === "coat-of-arms-upload") {
      const file = event.target.files?.[0];
      if (!file) return;

      resizeImage(file, 512).then((dataUrl) => {
        const preview = document.getElementById("coat-of-arms-preview");
        const hiddenData = document.getElementById("coat-of-arms-data");
        const previewCard = document.getElementById("coat-of-arms-preview-card");
        const dropzone = document.getElementById("coat-of-arms-dropzone-label");
        
        if (preview && hiddenData) {
          preview.src = dataUrl;
          hiddenData.value = dataUrl;
          if (previewCard) previewCard.style.display = "flex";
          if (dropzone) dropzone.style.display = "none";
        }
      }).catch(err => {
        console.error("Coat of arms resize failed", err);
        openAlertModal({ title: "Virhe", message: "Vaakunan lataus epäonnistui." });
      });
      return;
    }

    if (event.target.id === "sponsor-logo-upload") {
      const file = event.target.files?.[0];
      if (!file) return;

      resizeImage(file, 600).then((dataUrl) => {
        const preview = document.getElementById("sponsor-logo-preview");
        const hiddenData = document.getElementById("sponsor-logo-data");
        if (preview && hiddenData) {
          preview.src = dataUrl;
          preview.style.display = "block";
          hiddenData.value = dataUrl;
        }
      }).catch(err => {
        console.error("Sponsor logo resize failed", err);
        openAlertModal({ title: "Virhe", message: "Logon lataus epäonnistui." });
      });
      return;
    }

    if (event.target.id === "org-logo-upload") {
      const file = event.target.files?.[0];
      if (!file) return;

      resizeImage(file, 400).then((dataUrl) => {
        updateState((state) => {
          state.settings = state.settings || {};
          state.settings.organizationLogoData = dataUrl;
        }, "upload_org_logo");
        renderApp();
      }).catch(err => {
        console.error("Org logo resize failed", err);
        openAlertModal({ title: "Virhe", message: "Logon lataus epäonnistui." });
      });
      return;
    }

    if (event.target.id === "pilot-country-filter" || event.target.id === "workspace-pilot-country-filter") {
      filterPilots();
      return;
    }

    if (event.target.id === "current-role-select") {
      changeRole(event.target.value);
      renderApp();
      return;
    }

    if (event.target.id === "entry-pilot-select" || event.target.id === "entry-aircraft-select") {
      const form = event.target.closest("form");
      if (form) updateEntryFormVisibility(form);
      return;
    }

    const scorecardForm = event.target.closest(".score-card-form");
    if (scorecardForm) {
      handleScoreCardInput(scorecardForm);
    }

    if (event.target.id === "map-image-upload" || event.target.id === "map-image-upload-inline") {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        if (event.target.id === "map-image-upload-inline") {
          updateState((state) => {
            const ev = state.events.find(e => e.id === state.activeEventId);
            if (ev) {
              ev.eventInfo = ev.eventInfo || {};
              ev.eventInfo.mapImageUrl = reader.result;
            }
          }, "upload_map_image_inline");
          renderApp();
        } else {
          const urlInput = event.target.closest("form")?.querySelector("input[name='mapImageUrl']");
          if (urlInput) {
            urlInput.value = reader.result;
            urlInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    if (event.target.name === "organizationLogoUrl") {
      let url = event.target.value.trim();
      if (url.includes("dropbox.com") && url.includes("dl=0")) {
        url = url.replace("dl=0", "raw=1");
      }
      updateState((state) => {
        state.settings = state.settings || {};
        state.settings.organizationLogoData = url;
      }, "update_org_logo_url");
      renderApp();
      return;
    }

    if (event.target.name === "mapImageUrl" && !event.target.closest("form")) {
      let url = event.target.value.trim();
      if (url.includes("dropbox.com") && url.includes("dl=0")) {
        url = url.replace("dl=0", "raw=1");
      }
      updateState((state) => {
        const ev = state.events.find(e => e.id === state.activeEventId);
        if (ev) {
          ev.eventInfo = ev.eventInfo || {};
          ev.eventInfo.mapImageUrl = url;
        }
      }, "update_map_image_url");
      renderApp();
      return;
    }

    if (event.target.dataset.action === "scale-map-poi") {
      const scale = parseFloat(event.target.value);
      if (!isNaN(scale)) {
        updateState((state) => {
          const ev = state.events.find(e => e.id === state.activeEventId);
          if (ev && ev.eventInfo.mapPois) {
            const poi = ev.eventInfo.mapPois.find(p => p.id === event.target.dataset.poiId);
            if (poi) poi.scale = scale;
          }
        }, "scale_map_poi");
        renderApp();
      }
      return;
    }

    if (event.target.dataset.action) {
      if (handleAction(event.target.dataset.action, event, event.target, { renderApp, getState, updateState })) {
        return;
      }
    }

    if (event.target.id !== "import-json-input") return;
    requireAdmin(getState());
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      window.__PENDING_JSON_IMPORT__ = String(reader.result || "");
      event.target.value = ""; // clear input
      
      openConfirmModal({
        title: "Tuo JSON-varmuuskopio",
        message: "Oletko varma? Tämä ylikirjoittaa nykyisen selaimen datan täysin.",
        requireText: "YLIKIRJOITA",
        action: "execute-import-json",
        submitLabel: "Tuonti"
      });
      renderApp();
    };
    reader.readAsText(file);
  };
}

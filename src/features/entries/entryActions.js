import { createId, updateState, getState } from "../../state/store.js";
import { t } from "../../utils/i18n.js";
import { normalizeClassName } from "../../logic/participants.js";
import { requireAdmin, requirePilotAccess } from "../../users/roles.js";
import { getActiveEvent } from "../../utils/html.js";
import { registerAction } from "../../core/actionRegistry.js";
import { openConfirmModal } from "../../core/confirmActions.js";

export function addEntry(data) {
  updateState((state) => {
    requireAdmin(state);
    const activeEvent = getActiveEvent(state);
    if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

    const className = normalizeClassName(activeEvent, data.className);
    const pilotId = resolvePilotForEntry(state, data);
    const aircraftId = resolveAircraftForEntry(state, data, pilotId, className);
    const paymentStatus = data.paymentStatus || "unpaid";
    const checkInStatus = data.checkInStatus || "not_arrived";
    const technicalInspection = data.technicalInspection || "pending";

    const duplicateClass = state.entries.some(
      (entry) => entry.eventId === activeEvent.id && entry.pilotId === pilotId && String(entry.className || "") === className
    );
    if (duplicateClass) throw new Error("Tämä pilotti on jo ilmoitettu tähän kilpailuun samassa luokassa.");

    const duplicateAircraft = aircraftId && state.entries.some(
      (entry) => entry.eventId === activeEvent.id && entry.aircraftId === aircraftId && String(entry.className || "") === className
    );
    if (duplicateAircraft) throw new Error("Tämä kone on jo ilmoitettu tähän kilpailuun samassa luokassa.");

    state.entries.push({
      id: createId("entry"),
      eventId: activeEvent.id,
      pilotId,
      aircraftId,
      className,
      raceNumber: String(data.raceNumber || "").trim(),
      paymentStatus,
      checkInStatus,
      technicalInspection,
      notes: String(data.notes || "").trim(),
      paid: paymentStatus === "paid" || paymentStatus === "exempt",
      checkedIn: checkInStatus === "checked_in",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    markResultsDraft(activeEvent);
  }, "add_competition_participant");
}

export function toggleClassEntry({ pilotId, targetClass }) {
  updateState((state) => {
    requirePilotAccess(state, pilotId);
    const activeEvent = getActiveEvent(state);
    if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

    const existingIndex = state.entries.findIndex((entry) => (
      entry.eventId === activeEvent.id && entry.pilotId === pilotId && entry.className === targetClass
    ));

    if (existingIndex !== -1) {
      state.entries.splice(existingIndex, 1);
      markResultsDraft(activeEvent);
      return;
    }

    const aircraftId = findClassAircraftId(state, pilotId, targetClass);
    state.entries.push(createEntryRecord(state, {
      eventId: activeEvent.id,
      pilotId,
      aircraftId,
      className: targetClass,
      notes: aircraftId ? "Pikailmoitettu pilottikortista" : "Ilmoitettu ilman konekorttia"
    }));
    markResultsDraft(activeEvent);
  }, "toggle_class_entry");
}

export function enrollPilotAllClasses(pilotId) {
  updateState((state) => {
    requirePilotAccess(state, pilotId);
    const activeEvent = getActiveEvent(state);
    if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

    const aircrafts = state.aircraft.filter((aircraft) => aircraft.pilotId === pilotId);
    const classesToEnroll = activeEvent.classes?.length ? activeEvent.classes : ["Yleinen"];

    let enrolledCount = 0;

    classesToEnroll.forEach((className) => {
      const alreadyEnrolled = state.entries.some((entry) => (
        entry.eventId === activeEvent.id && entry.pilotId === pilotId && entry.className === className
      ));
      if (alreadyEnrolled) return;

      const defaultAircraft = aircrafts.find((aircraft) => aircraft.className === className);
      state.entries.push(createEntryRecord(state, {
        eventId: activeEvent.id,
        pilotId,
        aircraftId: defaultAircraft?.id || "",
        className,
        notes: defaultAircraft ? "Ilmoitettu pilottirekisteristä" : "Ilmoitettu ilman konekorttia"
      }));
      enrolledCount++;
    });

    if (!enrolledCount) {
      throw new Error("Pilotti on jo ilmoitettu kilpailuun näissä luokissa.");
    }

    markResultsDraft(activeEvent);
  }, "enroll_pilot_all_classes");
}

export function quickAddEntry({ pilotId, aircraftId, className }) {
  updateState((state) => {
    requireAdmin(state);
    const activeEvent = getActiveEvent(state);
    if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

    state.entries.push(createEntryRecord(state, {
      eventId: activeEvent.id,
      pilotId,
      aircraftId,
      className,
      notes: "Pikailmoittautunut rekisteristä"
    }));
    markResultsDraft(activeEvent);
  }, "quick_add_entry");
}

export function saveRaceNumbers(data) {
  updateState((state) => {
    requireAdmin(state);
    const eventId = data.eventId;
    
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith("raceNumber_")) {
        const pilotId = key.split("raceNumber_")[1];
        const raceNumber = String(value).trim();
        
        state.entries
          .filter(e => e.eventId === eventId && e.pilotId === pilotId)
          .forEach(e => {
            e.raceNumber = raceNumber;
          });
      }
    });
    
    state.settings = state.settings || {};
    state.settings.participantsModalOpen = false;
  }, "save_race_numbers");
}

export function quickAddClassEntry({ pilotId, className, aircraftId = "" }) {
  updateState((state) => {
    requireAdmin(state);
    const activeEvent = getActiveEvent(state);
    if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

    const finalAircraftId = aircraftId || findClassAircraftId(state, pilotId, className);
    state.entries.push(createEntryRecord(state, {
      eventId: activeEvent.id,
      pilotId,
      aircraftId: finalAircraftId,
      className,
      notes: `Pikailmoittautunut luokkaan ${className}`
    }));
    markResultsDraft(activeEvent);
  }, "quick_add_class_entry");
}

export function deleteEntry(entryId) {
  updateState((state) => {
    requireAdmin(state);
    removeEntriesById(state, new Set([entryId]));
  }, "delete_competition_participant");
}

export function removeEntriesById(state, entryIds) {
  if (!entryIds.size) return;

  const affectedEventIds = new Set(state.entries.filter((entry) => entryIds.has(entry.id)).map((entry) => entry.eventId));
  state.entries = state.entries.filter((entry) => !entryIds.has(entry.id));
  state.results = state.results.filter((result) => !entryIds.has(result.entryId));
  state.scoreCards = state.scoreCards.filter((card) => !entryIds.has(card.entryId));
  state.heats = state.heats
    .map((heat) => ({
      ...heat,
      entryIds: heat.entryIds.filter((entryId) => !entryIds.has(entryId))
    }))
    .filter((heat) => heat.entryIds.length > 0);

  state.events.forEach((event) => {
    if (!affectedEventIds.has(event.id)) return;
    markResultsDraft(event);
  });
}

function resolvePilotForEntry(state, data) {
  const existingPilotId = String(data.pilotId || "").trim();
  if (existingPilotId) {
    if (!state.pilots.some((pilot) => pilot.id === existingPilotId)) throw new Error("Valittua pilottia ei löydy.");
    return existingPilotId;
  }

  const newPilotName = String(data.newPilotName || "").trim();
  if (!newPilotName) throw new Error("Valitse olemassa oleva pilotti tai syötä uuden pilotin nimi.");

  const pilot = {
    id: createId("pilot"),
    name: newPilotName,
    country: String(data.newPilotCountry || "").trim().toUpperCase(),
    club: String(data.newPilotClub || "").trim(),
    license: String(data.newPilotLicense || "").trim(),
    phone: String(data.newPilotPhone || "").trim()
  };

  state.pilots.push(pilot);
  return pilot.id;
}

function resolveAircraftForEntry(state, data, pilotId, className) {
  const existingAircraftId = String(data.aircraftId || "").trim();
  if (existingAircraftId) {
    const aircraft = state.aircraft.find((item) => item.id === existingAircraftId);
    if (!aircraft) throw new Error("Valittua konetta ei löydy.");
    if (aircraft.pilotId !== pilotId) throw new Error(t(state, "entry_actions.wrong_pilot"));
    return existingAircraftId;
  }

  const newAircraftName = String(data.newAircraftName || "").trim();
  if (!newAircraftName) return "";

  const aircraft = {
    id: createId("aircraft"),
    pilotId,
    name: newAircraftName,
    className,
    engine: data.newAircraftEngine || "Other",
    techStatus: data.technicalInspection === "approved" ? "approved" : "pending",
    createdAt: new Date().toISOString()
  };

  state.aircraft.push(aircraft);
  return aircraft.id;
}

function findClassAircraftId(state, pilotId, className) {
  const existingAircraft = state.aircraft.find((aircraft) => aircraft.pilotId === pilotId && aircraft.className === className);
  return existingAircraft?.id || "";
}

export function resolveRaceNumber(state, eventId, pilotId) {
  const pilotEntries = state.entries.filter(e => e.eventId === eventId && e.pilotId === pilotId);
  const existingNumber = pilotEntries.find(e => e.raceNumber)?.raceNumber;
  if (existingNumber) return existingNumber;

  const eventEntries = state.entries.filter(e => e.eventId === eventId && e.raceNumber);
  let maxNum = 0;
  for (const e of eventEntries) {
    const num = parseInt(e.raceNumber, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }
  return String(maxNum + 1);
}

function createEntryRecord(state, { eventId, pilotId, aircraftId = "", className, notes }) {
  return {
    id: createId("entry"),
    eventId,
    pilotId,
    aircraftId,
    className,
    raceNumber: resolveRaceNumber(state, eventId, pilotId),
    paymentStatus: "unpaid",
    checkInStatus: "not_arrived",
    technicalInspection: "pending",
    notes,
    paid: false,
    checkedIn: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function markResultsDraft(event) {
  event.resultsPublished = false;
  event.resultsPublishedAt = null;
  if (event.status === "results_published") event.status = "results_draft";
}

export function initEntryActions() {
  registerAction("toggle-class-entry", (event, button, { renderApp }) => {
    toggleClassEntry({ pilotId: button.dataset.pilotId, targetClass: button.dataset.class });
    renderApp();
    return true;
  });

  registerAction("enroll-pilot-all-classes", (event, button, { renderApp }) => {
    enrollPilotAllClasses(button.dataset.pilotId);
    renderApp();
    return true;
  });

  registerAction("quick-add-entry", (event, button, { renderApp }) => {
    const pilotId = button.dataset.pilotId;
    const container = button.closest(".pilot-card") || button.closest(".small-card") || button.closest("tr") || button.closest("td");
    const select = container ? container.querySelector(".quick-aircraft-select") : null;
    const aircraftId = select ? select.value : "";
    if (!aircraftId) throw new Error("Pilotille täytyy luoda vähintään yksi kone ennen kisaan ilmoittamista.");

    const selectedOption = select ? select.options[select.selectedIndex] : null;
    const className = selectedOption ? selectedOption.dataset.class : "WWII";
    quickAddEntry({ pilotId, aircraftId, className });
    renderApp();
    return true;
  });

  registerAction("quick-add-class-entry", (event, button, { renderApp }) => {
    quickAddClassEntry({
      pilotId: button.dataset.pilotId,
      className: button.dataset.className,
      aircraftId: button.dataset.aircraftId || ""
    });
    renderApp();
    return true;
  });

  registerAction("quick-add-class-select-entry", (event, button, { renderApp }) => {
    const pilotId = button.dataset.pilotId;
    const className = button.dataset.className;
    const container = button.closest("tr") || button.closest(".pilot-table-row");
    const select = container ? container.querySelector(".quick-aircraft-select-class") : null;
    const aircraftId = select ? select.value : "";
    if (!aircraftId) throw new Error("Valitse kone ennen ilmoittamista.");

    quickAddClassEntry({ pilotId, className, aircraftId });
    renderApp();
    return true;
  });

  registerAction("delete-entry", (event, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: t(getState(), "entry_actions.del_entry_title"),
      message: "Poistetaanko tämä osallistuja aktiivisesta kilpailusta?",
      action: "execute-delete-entry",
      payload: { entryId: button.dataset.entryId }
    });
    return true;
  });

  registerAction("execute-delete-entry", (event, button, { renderApp }) => {
    requireAdmin(getState());
    deleteEntry(button.dataset.entryId);
    renderApp();
    return true;
  });

  registerAction("switch-workspace-class", (event, button, { renderApp }) => {
    updateState((state) => {
      state.settings = state.settings || {};
      state.settings.workspaceActiveClassName = button.dataset.className;
    }, "switch_workspace_class");
    renderApp();
    return true;
  });

  registerAction("set-workspace-tab", (event, button, { renderApp }) => {
    updateState((state) => {
      state.settings = state.settings || {};
      state.settings.workspaceActiveTab = button.dataset.tab;
    }, "set_workspace_tab");
    renderApp();
    return true;
  });



  registerAction("approve-registration", (event, button, { renderApp }) => {
    updateState((state) => {
      requireAdmin(state);
      const regId = button.dataset.regId;
      const reg = state.registrations?.find(r => r.id === regId);
      if (!reg) return;

      reg.status = "approved";
      reg.updatedAt = new Date().toISOString();

      const activeEvent = state.events.find(e => e.id === reg.eventId);
      if (!activeEvent) return;

      const aircrafts = state.aircraft || [];
      reg.classes.forEach(className => {
        const exists = state.entries.some(e => e.eventId === reg.eventId && e.pilotId === reg.pilotId && e.className === className);
        if (!exists) {
           const aircraft = aircrafts.find(a => a.pilotId === reg.pilotId && a.className === className);
           state.entries.push({
             id: createId("entry"),
             eventId: reg.eventId,
             pilotId: reg.pilotId,
             aircraftId: aircraft ? aircraft.id : "",
             className: className,
             raceNumber: "",
             paymentStatus: reg.paymentIntent === "paid_in_advance" ? "paid" : "unpaid",
             checkInStatus: "not_arrived",
             technicalInspection: "pending",
             notes: "Hyväksytty ilmoittautumispyynnöstä",
             paid: reg.paymentIntent === "paid_in_advance",
             checkedIn: false,
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString()
           });
        }
      });
      
      // Attempt to mark results draft if helper is in scope, otherwise let next re-render handle it
      // Since markResultsDraft is defined in entryActions.js, we can just call it
      if (typeof markResultsDraft === "function") {
          markResultsDraft(activeEvent);
      }
    }, "approve_registration");
    renderApp();
    return true;
  });

  registerAction("reject-registration", (event, button, { renderApp }) => {
    updateState((state) => {
      requireAdmin(state);
      const regId = button.dataset.regId;
      const reg = state.registrations?.find(r => r.id === regId);
      if (!reg) return;

      reg.status = "rejected";
      reg.updatedAt = new Date().toISOString();
    }, "reject_registration");
    renderApp();
    return true;
  });
}

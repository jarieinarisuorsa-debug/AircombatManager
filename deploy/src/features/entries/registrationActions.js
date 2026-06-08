import { createId, updateState } from "../../state/store.js";
import { requireAdmin, requirePilotAccess } from "../../users/roles.js";
import { registerAction } from "../../core/actionRegistry.js";
import { normalizeClassName } from "../../logic/participants.js";

export function registerRegistrationActions() {
  registerAction("submit-registration", (event, form, { renderApp }) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    
    updateState((state) => {
      const pilotId = data.pilotId;
      const eventId = data.eventId;
      requirePilotAccess(state, pilotId);

      // Collect all selected classes from checkboxes (e.g., class_WW2, class_WWI)
      const selectedClasses = [];
      for (const key in data) {
        if (key.startsWith("class_") && data[key] === "on") {
          selectedClasses.push(key.replace("class_", ""));
        }
      }

      const paymentIntent = data.paymentIntent || "pay_on_site";

      if (selectedClasses.length === 0) {
        throw new Error("Valitse vähintään yksi kilpailuluokka.");
      }

      const existingIndex = state.registrations.findIndex(r => r.eventId === eventId && r.pilotId === pilotId);
      if (existingIndex >= 0) {
        state.registrations[existingIndex].classes = selectedClasses;
        state.registrations[existingIndex].paymentIntent = paymentIntent;
        state.registrations[existingIndex].status = "pending";
        state.registrations[existingIndex].updatedAt = new Date().toISOString();
      } else {
        state.registrations.push({
          id: createId("reg"),
          eventId,
          pilotId,
          classes: selectedClasses,
          paymentIntent,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }, "submit_registration");
    
    renderApp();
    return true;
  });

  registerAction("cancel-registration", (event, button, { renderApp }) => {
    updateState((state) => {
      const regId = button.dataset.regId;
      const regIndex = state.registrations.findIndex(r => r.id === regId);
      if (regIndex === -1) throw new Error("Ilmoittautumista ei löytynyt.");
      
      const reg = state.registrations[regIndex];
      requirePilotAccess(state, reg.pilotId);
      
      state.registrations.splice(regIndex, 1);
    });
    renderApp();
    return true;
  });

  registerAction("toggle-registration-payment", (event, button, { renderApp }) => {
    updateState((state) => {
      requireAdmin(state);
      const regId = button.dataset.regId;
      const reg = state.registrations.find(r => r.id === regId);
      if (!reg) throw new Error("Ilmoittautumista ei löytynyt.");

      reg.paymentConfirmed = !reg.paymentConfirmed;
      reg.updatedAt = new Date().toISOString();
    });
    renderApp();
    return true;
  });

  registerAction("approve-registration", (event, button, { renderApp }) => {
    updateState((state) => {
      requireAdmin(state);
      const regId = button.dataset.regId;
      const reg = state.registrations.find(r => r.id === regId);
      if (!reg) throw new Error("Ilmoittautumista ei löytynyt.");

      const eventData = state.events.find(e => e.id === reg.eventId);
      
      // Create entries for each class
      for (const cls of reg.classes) {
        const className = normalizeClassName(eventData, cls);
        const duplicateClass = state.entries.some(
          (entry) => entry.eventId === reg.eventId && entry.pilotId === reg.pilotId && String(entry.className || "") === className
        );
        
        if (!duplicateClass) {
          state.entries.push({
            id: createId("entry"),
            eventId: reg.eventId,
            pilotId: reg.pilotId,
            aircraftId: null, // Assigned later
            className,
            raceNumber: "",
            paymentStatus: reg.paymentConfirmed ? "paid" : "unpaid",
            checkInStatus: "not_arrived",
            technicalInspection: "pending",
            notes: "",
            paid: !!reg.paymentConfirmed,
            checkedIn: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }

      reg.status = "approved";
      reg.updatedAt = new Date().toISOString();
    });
    renderApp();
    return true;
  });

  registerAction("reject-registration", (event, button, { renderApp }) => {
    updateState((state) => {
      requireAdmin(state);
      const regId = button.dataset.regId;
      const reg = state.registrations.find(r => r.id === regId);
      if (!reg) throw new Error("Ilmoittautumista ei löytynyt.");

      reg.status = "rejected";
      reg.updatedAt = new Date().toISOString();
    });
    renderApp();
    return true;
  });
}

import { createId, updateState, isDemo } from "../../state/store.js";
import { requireAdmin, requirePilotAccess } from "../../users/roles.js";
import { registerAction } from "../../core/actionRegistry.js";
import { normalizeClassName } from "../../logic/participants.js";
import { resolveRaceNumber } from "./entryActions.js";

export function registerRegistrationActions() {
  registerAction("submit-registration", (event, form, { renderApp }) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    
    updateState((state) => {
      const pilotId = data.pilotId;
      const eventId = data.eventId;
      requirePilotAccess(state, pilotId);

      // Collect all selected classes from checkboxes (e.g., class_WWII, class_WWI)
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
        // Varmista että sähköposti on myös päivityksessä
        const pilot = state.pilots.find(p => p.id === pilotId);
        if (pilot && pilot.email) state.registrations[existingIndex].email = pilot.email;
      } else {
        const pilot = state.pilots.find(p => p.id === pilotId);
        const email = pilot?.email || state.auth?.user?.email || "";
        
        state.registrations.push({
          id: createId("reg"),
          eventId,
          pilotId,
          email, // TÄRKEÄ: Supabase vaatii sähköpostin
          classes: selectedClasses,
          paymentIntent,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      if (isDemo) {
        const demoPilotIds = ["demo-p1", "demo-p2", "demo-p3", "demo-p4", "demo-p5", "demo-p6"];
        demoPilotIds.forEach((pId, idx) => {
          const isAlreadyReg = state.registrations.some(r => r.eventId === eventId && r.pilotId === pId);
          if (!isAlreadyReg) {
            const pPlanes = state.aircraft ? state.aircraft.filter(a => a.pilotId === pId) : [];
            const ww2Plane = pPlanes.find(a => a.className === "WWII" || a.className === "WW2");
            const ww1Plane = pPlanes.find(a => a.className === "WWI");
            const demoClasses = [];
            if (ww2Plane) demoClasses.push("WWII");
            if (ww1Plane) demoClasses.push("WWI");

            if (demoClasses.length > 0) {
              const isPending = idx < 3;
              state.registrations.push({
                id: createId("reg"),
                eventId,
                pilotId: pId,
                email: "",
                classes: demoClasses,
                paymentIntent: "pay_on_site",
                status: isPending ? "pending" : "approved",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });

              if (!isPending) {
                if (ww2Plane) {
                  state.entries.push({
                    id: createId("entry"),
                    eventId,
                    pilotId: pId,
                    aircraftId: ww2Plane.id,
                    className: "WWII",
                    raceNumber: String(idx + 1),
                    paymentStatus: "paid",
                    checkInStatus: "checked_in",
                    technicalInspection: "approved",
                    notes: "Demoilmoittautuminen",
                    paid: true,
                    checkedIn: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
                }
                if (ww1Plane) {
                  state.entries.push({
                    id: createId("entry"),
                    eventId,
                    pilotId: pId,
                    aircraftId: ww1Plane.id,
                    className: "WWI",
                    raceNumber: String(idx + 1),
                    paymentStatus: "paid",
                    checkInStatus: "checked_in",
                    technicalInspection: "approved",
                    notes: "Demoilmoittautuminen",
                    paid: true,
                    checkedIn: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
                }
              }
            }
          }
        });
      }

    }, "submit_registration");
    
    if (isDemo) {
      alert("Ilmoittautumisesi on vastaanotettu! Automatiikka lisäsi kilpailuun juuri samalla sekunnilla myös 6 muuta demopilottia!");
    }
    
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
            raceNumber: resolveRaceNumber(state, reg.eventId, reg.pilotId),
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

      // Lähetetään automaattinen kuittaus viestiseinälle
      const pilot = state.pilots.find(p => p.id === reg.pilotId);
      if (pilot) {
        if (!state.messages) state.messages = [];
        state.messages.push({
          id: createId("msg"),
          senderId: "admin",
          content: `✅ ${pilot.name}: Ilmoittautumisesi kilpailuluokkiin ${reg.classes.join(', ')} on hyväksytty! Tervetuloa kisoihin! ✈️`,
          createdAt: new Date().toISOString(),
          readBy: ["admin"]
        });
      }
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

  registerAction("delete-registration", (event, button, { renderApp }) => {
    updateState((state) => {
      requireAdmin(state);
      const regId = button.dataset.regId;
      if (!state.registrations) return;
      state.registrations = state.registrations.filter(r => r.id !== regId);
    }, "delete_registration");
    renderApp();
    return true;
  });
}

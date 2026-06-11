import {
  calculateScoreCardTotals,
  createDefaultRound,
  getScoreCardTemplate,
  getScoreCardStructureStages
} from "../../logic/scoreCards.js";
import { createId, getState, updateState } from "../../state/store.js";
import { requireAdmin, isAdmin } from "../../users/roles.js";
import { getActiveEvent } from "../../utils/html.js";
import { firstFilled, readNumber, readYesNo } from "../../utils/formValues.js";
import { registerAction } from "../../core/actionRegistry.js";
import { isDemo } from "../../state/store.js";

export function saveScoreCard(data, form) {
  updateState((state) => {
    const activeEvent = getActiveEvent(state);
    if (!activeEvent) throw new Error("Aktiivista kilpailua ei ole valittu.");

    const entry = state.entries.find((item) => item.id === data.entryId && item.eventId === activeEvent.id);
    if (!entry) throw new Error("Osallistujaa ei löydy aktiivisesta kilpailusta.");

    if (!isAdmin(state)) {
      const userEmail = state.auth?.user?.email || state.settings?.userEmail || "";
      const myPilot = state.pilots.find(p => p.email && p.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
      if (!myPilot || entry.pilotId !== myPilot.id) {
        throw new Error("Tämä toiminto on vain adminille tai kyseiselle pilotille.");
      }
    }

    const existingIndex = state.scoreCards.findIndex((card) => card.eventId === activeEvent.id && card.entryId === entry.id);
    const existingScoreCard = existingIndex >= 0 ? state.scoreCards[existingIndex] : null;

    const template = getScoreCardTemplate(String(data.templateId || "standard"));
    
    // Hae aito lentorakenne, jotta saadaan talteen kaikki näytetyt kierrokset (esim. finaali jos se ylittää template.rounds pituuden)
    const aircraft = state.aircraft.find(a => a.id === entry.aircraftId);
    const stages = getScoreCardStructureStages({ card: existingScoreCard, event: activeEvent, entry, aircraft });
    const activeRoundNumbers = Array.from(new Set([
      ...template.rounds,
      ...stages.map(s => Number(s.roundNumber))
    ])).sort((a, b) => a - b);

    const rounds = activeRoundNumbers.map((roundNumber) => {
      const existingRound = existingScoreCard?.rounds?.find((r) => r.roundNumber === roundNumber);
      const isSaved = true;

      const round = {
        ...createDefaultRound(roundNumber, template.id),
        isSaved,
        takeoff: readYesNo(data[`r${roundNumber}_takeoff`]),
        flightMinutes: readNumber(data[`r${roundNumber}_flightMinutes`], 0, 99),
        flightSeconds: readNumber(data[`r${roundNumber}_flightSeconds`], 0, 59),
        cuts: readNumber(data[`r${roundNumber}_cuts`], 0, 99),
        groundTargets: readNumber(data[`r${roundNumber}_groundTargets`], 0, 99),
        takeoff: readYesNo(data[`r${roundNumber}_takeoff`]),
        streamerOk: readYesNo(data[`r${roundNumber}_streamerOk`]),
        hasenfuss: readYesNo(data[`r${roundNumber}_hasenfuss`]),
        safetylineOverflown: readYesNo(data[`r${roundNumber}_safetylineOverflown`]),
        landingAfterEndSignal: readYesNo(data[`r${roundNumber}_landingAfterEndSignal`])
      };

      if (template.modelPointItems) {
        round.modelPoints = Object.fromEntries(template.modelPointItems.map((item) => [
          item.key,
          readYesNo(data[`r${roundNumber}_model_${item.key}`])
        ]));
      }

      round.signatures = {
        pilotSignature: firstFilled(data, `r${roundNumber}_pilotSignature`),
        judgeSignature: firstFilled(data, `r${roundNumber}_judgeSignature`)
      };

      return round;
    });

    const scoreCard = {
      id: `scorecard-${entry.id}`,
      eventId: activeEvent.id,
      entryId: entry.id,
      participantId: entry.id,
      templateId: template.id,
      startNumber: String(data.startNumber || "").trim(),
      firstName: String(data.firstName || "").trim(),
      lastName: String(data.lastName || "").trim(),
      frequency: String(data.frequency || "").trim(),
      flyingRound: String(data.flyingRound || "").trim(),
      rounds,
      aircraft: {
        twoPointFiveClass: Boolean(form.querySelector('[name="twoPointFiveClass"]:checked')),
        modelName: firstFilled(data, "modelName"),
        motorOrBattery: firstFilled(data, "motorOrBattery"),
        propeller: firstFilled(data, "propeller"),
        rpm: firstFilled(data, "rpm")
      },
      signatures: {
        pilotSignature: firstFilled(data, "pilotSignature"),
        judgeSignature: firstFilled(data, "judgeSignature")
      },
      status: "draft",
      updatedAt: new Date().toISOString()
    };

    const totals = calculateScoreCardTotals(scoreCard, activeEvent);
    scoreCard.totalPoints = totals.totalPoints;
    scoreCard.totalCuts = totals.totalCuts;
    scoreCard.totalFlightSeconds = totals.totalFlightSeconds;

    if (existingIndex >= 0) state.scoreCards[existingIndex] = scoreCard;
    else state.scoreCards.push(scoreCard);

    if (scoreCard.startNumber && entry.raceNumber !== scoreCard.startNumber) entry.raceNumber = scoreCard.startNumber;
    if (entry.className && template.id === "wwi" && !/wwi|ww1/i.test(entry.className)) entry.className = "WWI";
    entry.updatedAt = new Date().toISOString();

    markResultsDraft(activeEvent);
  }, "save_score_card");
}

function markResultsDraft(event) {
  event.resultsPublished = false;
  event.resultsPublishedAt = null;
  event.status = "results_draft";
}

export function registerScorecardActions() {
  registerAction("randomize-demo-scores", (event, element, { renderApp }) => {
    updateState((state) => {
      if (!isDemo) throw new Error("Vain demotilassa!");
      const className = element.dataset.class;
      const activeEvent = getActiveEvent(state);
      if (!activeEvent) throw new Error("Ei aktiivista kilpailua.");
      
      const entries = state.entries.filter(e => {
        if (e.eventId !== activeEvent.id) return false;
        const eClass = String(e.className || state.aircraft.find(a => a.id === e.aircraftId)?.className || "").toLowerCase();
        return eClass === String(className).toLowerCase();
      });
      if (entries.length === 0) throw new Error("Ei osallistujia tässä luokassa.");

      // Arvotaan kaikille luokan osallistujille, koska olemme demotilassa
      const demoEntries = entries;

      const template = getScoreCardTemplate(className.toLowerCase() === "wwi" ? "wwi" : "standard");
      
      const heats = (state.heats || []).filter(h => h.eventId === activeEvent.id && String(h.className).toLowerCase() === String(className).toLowerCase());
      if (heats.length === 0) throw new Error("Arvonta vaatii, että luokalle on ensin luotu erät (Heats). Mene Erät-välilehdelle ja luo erät ennen pisteiden arvontaa!");

      demoEntries.forEach(entry => {
        let scoreCard = state.scoreCards.find(card => card.eventId === activeEvent.id && card.entryId === entry.id);
        const aircraft = state.aircraft.find(a => a.id === entry.aircraftId);

        if (!scoreCard) {
          scoreCard = {
            id: `scorecard-${entry.id}`,
            eventId: activeEvent.id,
            entryId: entry.id,
            participantId: entry.id,
            className: className,
            templateId: template.id,
            startNumber: entry.raceNumber,
            rounds: [],
            status: "draft",
            updatedAt: new Date().toISOString()
          };
          state.scoreCards.push(scoreCard);
        } else {
          if (!scoreCard.className) scoreCard.className = className;
        }
        
        const stages = getScoreCardStructureStages({ card: scoreCard, event: activeEvent, entry, aircraft });

        // Nollataan kaikki kierrokset uusiksi luodussa rakenteessa
        scoreCard.rounds = stages.map(stage => {
          const round = createDefaultRound(stage.roundNumber, template.id);
          if (template.modelPointItems) {
            round.modelPoints = Object.fromEntries(template.modelPointItems.map(item => [item.key, false]));
          }
          return round;
        });

        // Käydään läpi vain ne kierrokset, joille on olemassa Heat tässä luokassa
        heats.forEach(heat => {
          if (!heat.entryIds.includes(entry.id)) return; // Pilotti ei ole tässä heatissa
          
          const stage = stages.find(s => s.heatPhase === heat.phase && Number(s.heatRound) === Number(heat.round));
          if (!stage) return;
          
          const roundNumber = stage.roundNumber;

          const isSaved = true;
          // random time 3-7 mins
          const flightMinutes = Math.floor(Math.random() * 5) + 3; 
          const flightSeconds = flightMinutes === 7 ? 0 : Math.floor(Math.random() * 60);
          // random cuts 0-3
          const cuts = Math.random() > 0.4 ? Math.floor(Math.random() * 4) : 0;
          // random streamer
          const streamerOk = Math.random() > 0.5;

          const round = {
            ...createDefaultRound(roundNumber, template.id),
            isSaved,
            takeoff: true,
            flightMinutes,
            flightSeconds,
            cuts,
            groundTargets: 0,
            streamerOk,
            hasenfuss: false,
            safetylineOverflown: false,
            landingAfterEndSignal: false,
            signatures: { pilotSignature: "", judgeSignature: "" }
          };

          if (template.modelPointItems) {
            round.modelPoints = Object.fromEntries(template.modelPointItems.map((item) => [
              item.key,
              Math.random() > 0.5 // random model points
            ]));
          }

          const existingRoundIndex = scoreCard.rounds.findIndex((r) => Number(r.roundNumber) === Number(roundNumber));

          if (existingRoundIndex >= 0) {
             scoreCard.rounds[existingRoundIndex] = round;
          } else {
             scoreCard.rounds.push(round);
          }
        });

        const totals = calculateScoreCardTotals(scoreCard, activeEvent);
        scoreCard.totalPoints = totals.totalPoints;
        scoreCard.totalCuts = totals.totalCuts;
        scoreCard.totalFlightSeconds = totals.totalFlightSeconds;
        scoreCard.updatedAt = new Date().toISOString();
      });

      markResultsDraft(activeEvent);
    }, "randomize_demo_scores");
    
    renderApp();
    return true;
  });

  registerAction("randomize-demo-heat-scores", (event, element, { renderApp }) => {
    updateState((state) => {
      if (!isDemo) throw new Error("Vain demotilassa!");
      const heatId = element.dataset.heatId;
      const activeEvent = getActiveEvent(state);
      if (!activeEvent) throw new Error("Ei aktiivista kilpailua.");
      
      const heat = state.heats.find(h => h.id === heatId);
      if (!heat) throw new Error("Heat ei löydy.");

      heat.entryIds.forEach(entryId => {
        const flightMinutes = Math.floor(Math.random() * 5) + 3; 
        const flightSeconds = flightMinutes === 7 ? 0 : Math.floor(Math.random() * 60);
        const cuts = Math.random() > 0.4 ? Math.floor(Math.random() * 4) : 0;
        const intactStreamer = Math.random() > 0.5;

        // --- PÄIVITETÄÄN TULOSKORTTI-JÄRJESTELMÄ ---
        const entry = state.entries.find(e => e.id === entryId);
        if (entry) {
          let scoreCard = state.scoreCards.find(card => card.eventId === activeEvent.id && card.entryId === entryId);
          const aircraft = state.aircraft.find(a => a.id === entry.aircraftId);
          const className = heat.className || entry.className || "WWII";
          const template = getScoreCardTemplate(className.toLowerCase() === "wwi" ? "wwi" : "standard");

          if (!scoreCard) {
            scoreCard = {
              id: `scorecard-${entryId}`,
              eventId: activeEvent.id,
              entryId: entryId,
              participantId: entryId,
              className: className,
              templateId: template.id,
              startNumber: entry.raceNumber,
              rounds: [],
              status: "draft",
              updatedAt: new Date().toISOString()
            };
            state.scoreCards.push(scoreCard);
          }
          
          // Etsitään oikea kierros tälle heatille
          const stages = getScoreCardStructureStages({ card: scoreCard, event: activeEvent, entry, aircraft });
          const stage = stages.find(s => s.heatPhase === heat.phase && Number(s.heatRound) === Number(heat.round));
          
          if (stage) {
            const roundNumber = stage.roundNumber;
            const round = {
              ...createDefaultRound(roundNumber, template.id),
              isSaved: true,
              takeoff: true,
              flightMinutes,
              flightSeconds,
              cuts,
              groundTargets: 0,
              streamerOk: intactStreamer,
              hasenfuss: false,
              safetylineOverflown: false,
              landingAfterEndSignal: false,
              signatures: { pilotSignature: "", judgeSignature: "" }
            };

            const existingRoundIndex = scoreCard.rounds.findIndex((r) => Number(r.roundNumber) === Number(roundNumber));
            if (existingRoundIndex >= 0) {
              scoreCard.rounds[existingRoundIndex] = round;
            } else {
              scoreCard.rounds.push(round);
            }

            const totals = calculateScoreCardTotals(scoreCard, activeEvent);
            scoreCard.totalPoints = totals.totalPoints;
            scoreCard.totalCuts = totals.totalCuts;
            scoreCard.totalFlightSeconds = totals.totalFlightSeconds;
            scoreCard.updatedAt = new Date().toISOString();
          }
        }
      });

      markResultsDraft(activeEvent);
      heat.status = "completed";
    }, "randomize_demo_heat_scores");
    
    renderApp();
    return true;
  });
}

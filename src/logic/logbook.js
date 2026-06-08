import { calculateScoreCardRound, hasRoundData } from "./scoreCards.js";
import { getAircraftName } from "../utils/html.js";
import { buildCompetitionResults } from "./competitionResults.js";

export function buildPilotLogbook(state, pilotId) {
  const pilot = state.pilots.find((p) => p.id === pilotId);
  if (!pilot) return null;

  const entries = state.entries.filter((e) => e.pilotId === pilotId);
  const flights = [];
  const eventsHistory = [];
  const eventsMap = new Map();

  for (const entry of entries) {
    const event = state.events.find((e) => e.id === entry.eventId);
    if (!event) continue;
    
    if (!eventsMap.has(event.id)) {
      eventsMap.set(event.id, event);
    }

    const className = entry.className || "Yleinen";
    const aircraft = state.aircraft.find((a) => a.id === entry.aircraftId) || { name: "Tuntematon kone" };
    const aircraftName = getAircraftName(state, entry.aircraftId) || aircraft.name;

    // Haetaan sijoitus jos tulokset julkaistu
    let position = null;
    let eventTotalScore = 0;
    if (event.resultsPublished) {
      const compResults = buildCompetitionResults(state, event);
      // Etsitään juuri tämän entryn rivi luokkakohtaisista tuloksista tai kokonaistuloksista
      const resultRow = compResults.rows.find(r => r.entryId === entry.id);
      if (resultRow) {
        position = resultRow.position; // Kokonaissijoitus
        // Etsitään vielä luokkakohtainen sijoitus
        const classGroup = compResults.classGroups.find(cg => cg.className === className);
        if (classGroup) {
          const classRow = classGroup.rows.find(r => r.entryId === entry.id);
          if (classRow) position = classRow.classPosition;
        }
        eventTotalScore = resultRow.totalScore;
      }
    }

    // Luodaan eventHistory-olio
    let evHistory = eventsHistory.find(e => e.eventId === event.id && e.className === className);
    if (!evHistory) {
      evHistory = {
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        eventLocation: event.location,
        resultsPublished: Boolean(event.resultsPublished),
        className,
        aircraftName,
        ranking: position,
        totalEventScore: eventTotalScore,
        flights: []
      };
      eventsHistory.push(evHistory);
    }

    // Käsittele tuloskortit
    const scoreCard = (state.scoreCards || []).find((c) => c.eventId === event.id && c.entryId === entry.id);
    let hasScoreCardData = false;
    if (scoreCard && Array.isArray(scoreCard.rounds)) {
      for (const round of scoreCard.rounds) {
        if (!hasRoundData(round)) continue;
        hasScoreCardData = true;
        
        const score = calculateScoreCardRound(round, event, scoreCard.templateId);
        
        const f = {
          id: `${scoreCard.id}-${round.roundNumber}`,
          eventId: event.id,
          roundLabel: `Kierros ${round.roundNumber}`,
          flightSeconds: score.flightSeconds,
          cuts: Number(round.cuts || 0),
          streamerOk: Boolean(round.streamerOk),
          hasenfuss: Boolean(round.hasenfuss),
          safetyline: Boolean(round.safetylineOverflown),
          score: score.total
        };
        flights.push(f);
        evHistory.flights.push(f);
      }
    }

    // Käsittele yksittäiset heat-tulokset
    const entryResults = (state.results || []).filter((r) => r.entryId === entry.id);
    for (const res of entryResults) {
      const heat = state.heats.find(h => h.id === res.heatId);
      if (!heat) continue;
      
      const roundLabel = heat.groupName || `Heat ${heat.id}`;
      // Vältetään duplikaatit jos molemmat on tallennettu
      const isDuplicate = evHistory.flights.some(f => f.roundLabel.includes(roundLabel.split(" ").pop()));
      if (isDuplicate && hasScoreCardData) continue;

      // Lasketaan pisteet rulesien mukaan jos mahdollista, buildCompetitionResults tekee tän
      // Mutta meillä on flightSeconds ja cuts suoraan res-objektissa.
      const f = {
        id: `res-${res.id}`,
        eventId: event.id,
        roundLabel,
        flightSeconds: Number(res.flightSeconds || 0),
        cuts: Number(res.cuts || 0),
        streamerOk: Boolean(res.intactStreamer),
        hasenfuss: false,
        safetyline: Number(res.penaltyPoints || 0) > 0,
        score: null // Voisi laskea calculateResultScorella
      };
      flights.push(f);
      evHistory.flights.push(f);
    }
  }

  // Järjestetään kilpailuhistoria uusimmasta vanhimpaan
  eventsHistory.sort((a, b) => new Date(b.eventDate || 0) - new Date(a.eventDate || 0));
  
  // Lasketaan tilastot koko flights-taulukosta
  const stats = {
    totalEvents: new Set(eventsHistory.map(e => e.eventId)).size,
    totalFlights: flights.length,
    totalFlightSeconds: flights.reduce((sum, f) => sum + f.flightSeconds, 0),
    totalCuts: flights.reduce((sum, f) => sum + f.cuts, 0),
    bestScore: flights.reduce((best, f) => Math.max(best, f.score || 0), 0),
    classes: {},
    aircraft: {}
  };

  for (const ev of eventsHistory) {
    if (!stats.classes[ev.className]) {
      stats.classes[ev.className] = { flights: 0, cuts: 0, flightSeconds: 0 };
    }
    stats.classes[ev.className].flights += ev.flights.length;
    stats.classes[ev.className].cuts += ev.flights.reduce((sum, f) => sum + f.cuts, 0);
    stats.classes[ev.className].flightSeconds += ev.flights.reduce((sum, f) => sum + f.flightSeconds, 0);

    if (ev.aircraftName) {
      if (!stats.aircraft[ev.aircraftName]) stats.aircraft[ev.aircraftName] = 0;
      stats.aircraft[ev.aircraftName]++; // Käytetty kilpailuissa x kertaa
    }
  }

  // Etsitään käytetyin kone (kilpailuittain)
  let mostUsedAircraft = "-";
  let maxUsage = 0;
  for (const [ac, count] of Object.entries(stats.aircraft)) {
    if (count > maxUsage) {
      maxUsage = count;
      mostUsedAircraft = ac;
    }
  }
  stats.mostUsedAircraft = mostUsedAircraft;

  return {
    stats,
    eventsHistory
  };
}

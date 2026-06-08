import { escapeHtml, getActiveEvent, formatDateRange, getPilotName } from "../../utils/html.js";
import { buildRanking } from "../../logic/scoring.js";
import { buildCompetitionResults } from "../../logic/competitionResults.js";
import { buildPublicParticipantRows } from "../../logic/participants.js";
import { UI } from "../../ui/engine.js";

export function getEventSummary(state) {
  const activeEvent = getActiveEvent(state);
  const eventEntries = activeEvent ? state.entries.filter((entry) => entry.eventId === activeEvent.id) : [];
  const eventHeats = activeEvent ? state.heats.filter((heat) => heat.eventId === activeEvent.id) : [];
  const eventResults = activeEvent ? state.results.filter((result) => eventHeats.some((heat) => heat.id === result.heatId)) : [];
  const ranking = activeEvent ? buildRanking(eventEntries, eventResults, activeEvent.rules).slice(0, 5) : [];
  const competitionResults = activeEvent ? buildCompetitionResults(state, activeEvent) : buildCompetitionResults(state, null);
  const publicParticipants = activeEvent ? buildPublicParticipantRows(state, activeEvent) : [];
  return { activeEvent, eventEntries, eventHeats, eventResults, ranking, competitionResults, publicParticipants };
}

// ==============================
// Aircombat Competition Manager
// src/logic/seasonStandings.js
// ==============================

import { buildCompetitionResults } from "./competitionResults.js";

export function buildSeasonStandings(state, year) {
  const publishedEvents = state.events
    .filter(e => e.date && new Date(e.date).getFullYear() === year && e.resultsPublished === true)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const classData = {};

  publishedEvents.forEach(event => {
    const results = buildCompetitionResults(state, event);
    
    results.rows.forEach(row => {
      const className = row.className || "Yleinen";
      
      if (!classData[className]) {
        classData[className] = {
          className,
          pilots: {} // Map of pilotId -> { pilotName, totalScore, eventScores: {} }
        };
      }

      if (!classData[className].pilots[row.pilotId]) {
        classData[className].pilots[row.pilotId] = {
          pilotId: row.pilotId,
          pilotName: row.pilotName,
          country: row.country || "",
          totalScore: 0,
          eventScores: {}
        };
      }

      const pilotEntry = classData[className].pilots[row.pilotId];
      pilotEntry.totalScore += row.totalScore;
      pilotEntry.eventScores[event.id] = row.totalScore;
    });
  });

  const classes = Object.keys(classData).sort();
  
  const standings = {};
  classes.forEach(className => {
    standings[className] = Object.values(classData[className].pilots)
      .sort((a, b) => b.totalScore - a.totalScore || a.pilotName.localeCompare(b.pilotName, "fi"))
      .map((row, index) => ({ ...row, position: index + 1 }));
  });

  return {
    events: publishedEvents, // To render columns
    classes,
    standings
  };
}

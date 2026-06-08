import { createId } from "../state/store.js";
import { HEAT_PHASES, getPhaseLabel } from "./competitionFormat.js";

const GROUP_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function buildHeatGroups({ eventId, className, entries, groupSize = 6, round = 1, phase = HEAT_PHASES.QUALIFYING, state }) {
  const safeGroupSize = Math.max(2, Number(groupSize || 6));
  const groupSizes = getBalancedGroupSizes(entries.length, safeGroupSize);

  const pilotsMap = new Map();
  if (state && Array.isArray(state.pilots)) {
    state.pilots.forEach((pilot) => {
      pilotsMap.set(pilot.id, {
        club: (pilot.club || "").trim().toLowerCase(),
        country: (pilot.country || "").trim().toLowerCase()
      });
    });
  }

  function getConflictScore(shuffledList) {
    let score = 0;
    const groups = splitBySizes(shuffledList, groupSizes);

    groups.forEach((heatEntries) => {
      for (let i = 0; i < heatEntries.length; i++) {
        const p1 = pilotsMap.get(heatEntries[i].pilotId);
        if (!p1) continue;
        for (let j = i + 1; j < heatEntries.length; j++) {
          const p2 = pilotsMap.get(heatEntries[j].pilotId);
          if (!p2) continue;

          if (p1.club && p1.club === p2.club) score += 2;
          if (p1.country && p1.country === p2.country) score += 1;
        }
      }
    });

    return score;
  }

  let bestShuffle = [...entries];
  let bestScore = getConflictScore(bestShuffle);

  for (let t = 0; t < 500; t++) {
    const candidate = [...entries].sort(() => Math.random() - 0.5);
    const score = getConflictScore(candidate);
    if (score < bestScore) {
      bestScore = score;
      bestShuffle = candidate;
    }
    if (bestScore === 0) break;
  }

  return splitBySizes(bestShuffle, groupSizes).map((groupEntries, groupIndex) => ({
    id: createId("heat"),
    eventId,
    className: className || "Yleinen",
    phase,
    round,
    groupName: buildGroupName(className, round, phase, groupIndex),
    status: "planned",
    entryIds: groupEntries.map((entry) => entry.id),
    createdAt: new Date().toISOString()
  }));
}

export function getNextRound(heats, eventId, className, phase = HEAT_PHASES.QUALIFYING) {
  const eventRounds = heats
    .filter((heat) => heat.eventId === eventId && heat.className === className && (heat.phase || HEAT_PHASES.QUALIFYING) === phase)
    .map((heat) => Number(heat.round || 1));
  return eventRounds.length ? Math.max(...eventRounds) + 1 : 1;
}

function buildGroupName(className, round, phase, groupIndex) {
  const suffix = GROUP_LETTERS[groupIndex] || groupIndex + 1;
  const prefix = className ? `${className} ` : "";

  if (phase === HEAT_PHASES.SEMIFINAL) {
    return `${prefix}SF-${suffix}`;
  }

  if (phase === HEAT_PHASES.FINAL) {
    return `${prefix}F-${suffix}`;
  }

  return `${prefix}${round}-${suffix}`;
}

export function detectFrequencyConflicts(state, entryIds) {
  if (!state || !Array.isArray(entryIds)) return new Set();

  const freqs = entryIds.map((id) => {
    const card = (state.scoreCards || []).find((c) => c.entryId === id);
    return {
      entryId: id,
      freq: (card?.frequency || "2.4 GHz").trim().toLowerCase()
    };
  });

  const conflicts = new Set();
  for (let i = 0; i < freqs.length; i++) {
    const f1 = freqs[i];
    if (["2.4 ghz", "2,4 ghz", "2.4ghz", "", "2.4"].includes(f1.freq)) continue;

    for (let j = i + 1; j < freqs.length; j++) {
      const f2 = freqs[j];
      if (f1.freq === f2.freq) {
        conflicts.add(f1.entryId);
        conflicts.add(f2.entryId);
      }
    }
  }
  return conflicts;
}

function getBalancedGroupSizes(entryCount, maxGroupSize) {
  if (entryCount <= 0) return [];
  const groupCount = Math.max(1, Math.ceil(entryCount / maxGroupSize));
  const baseSize = Math.floor(entryCount / groupCount);
  const remainder = entryCount % groupCount;

  return Array.from({ length: groupCount }, (_, index) => baseSize + (index < remainder ? 1 : 0));
}

function splitBySizes(items, sizes) {
  const groups = [];
  let offset = 0;
  sizes.forEach((size) => {
    groups.push(items.slice(offset, offset + size));
    offset += size;
  });
  return groups;
}

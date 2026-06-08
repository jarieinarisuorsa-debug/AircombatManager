export function calculateResultScore(result, rules) {
  const flightSeconds = Number(result.flightSeconds || 0);
  const cuts = Number(result.cuts || 0);
  const penaltyPoints = Number(result.penaltyPoints || 0);
  const flightPoints = Math.floor(flightSeconds / rules.flightTimePointEverySeconds);
  const cutPoints = cuts * rules.cutPoints;
  const intactStreamerPoints = result.intactStreamer ? rules.intactStreamerPoints : 0;
  const total = flightPoints + cutPoints + intactStreamerPoints - penaltyPoints;

  return {
    flightPoints,
    cutPoints,
    intactStreamerPoints,
    penaltyPoints,
    total: Math.max(0, total)
  };
}

export function calculateEntryTotal(entryId, results, rules) {
  return results
    .filter((result) => result.entryId === entryId)
    .reduce((sum, result) => sum + calculateResultScore(result, rules).total, 0);
}

export function buildRanking(entries, results, rules) {
  return entries
    .map((entry) => ({
      ...entry,
      totalScore: calculateEntryTotal(entry.id, results, rules),
      totalCuts: results
        .filter((result) => result.entryId === entry.id)
        .reduce((sum, result) => sum + Number(result.cuts || 0), 0),
      totalFlightSeconds: results
        .filter((result) => result.entryId === entry.id)
        .reduce((sum, result) => sum + Number(result.flightSeconds || 0), 0)
    }))
    .sort((a, b) => b.totalScore - a.totalScore || b.totalCuts - a.totalCuts || b.totalFlightSeconds - a.totalFlightSeconds);
}

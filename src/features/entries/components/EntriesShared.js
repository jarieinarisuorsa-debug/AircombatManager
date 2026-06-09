export function getWorkspaceClasses(activeEvent, eventEntries) {
  const classes = new Set(activeEvent.classes || []);
  eventEntries.forEach((entry) => {
    if (entry.className) classes.add(entry.className);
  });
  return [...classes].filter(Boolean);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatDate(value) {
  if (!value) return "-";
  if (value.includes(".")) return value; // Already Finnish format
  return new Intl.DateTimeFormat("fi-FI").format(new Date(`${value}T12:00:00`));
}

export function formatDateRange(startDate, endDate) {
  if (!startDate) return "-";
  if (!endDate || startDate === endDate) {
    return formatDate(startDate);
  }
  
  if (startDate.includes(".") || endDate.includes(".")) {
    return `${startDate} – ${endDate}`;
  }

  const [sYear, sMonth, sDay] = startDate.split("-");
  const [eYear, eMonth, eDay] = endDate.split("-");

  if (sYear !== eYear) {
    return `${sDay}.${sMonth}.${sYear} – ${eDay}.${eMonth}.${eYear}`;
  }
  if (sMonth !== eMonth) {
    return `${sDay}.${sMonth}. – ${eDay}.${eMonth}.${sYear}`;
  }
  return `${sDay}.–${eDay}.${sMonth}.${sYear}`;
}

export function byName(a, b) {
  return String(a.name || "").localeCompare(String(b.name || ""), "fi");
}

export function getActiveEvent(state) {
  return state.events.find((event) => event.id === state.activeEventId) || null;
}

export function getPilotName(state, pilotId) {
  return state.pilots.find((pilot) => pilot.id === pilotId)?.name || "Tuntematon pilotti";
}

export function getAircraftName(state, aircraftId) {
  if (!aircraftId) return "No aircraft selected";
  return state.aircraft.find((aircraft) => aircraft.id === aircraftId)?.name || "Unknown aircraft";
}

export function downloadTextFile(filename, text, mimeType = "application/json") {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

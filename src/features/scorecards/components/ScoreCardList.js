import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { calculateScoreCardTotals, SCORE_CARD_TEMPLATE_WWI } from "../../../logic/scoreCards.js";
import { formatDuration } from "./ScoreCardUtils.js";

export function renderScoreCardList(state, activeEvent, rows, targetClass = "") {
  const grouped = groupScoreCardsByHeat(state, activeEvent, rows, targetClass);

  return `
    <section class="score-card-list no-print">
      <div class="score-card-list-intro">
        <div>
          <p class="kicker">Tuloskorttilista</p>
          <h3>${targetClass ? `${escapeHtml(targetClass)} kortit` : "Kaikki tuloskortit"}</h3>
        </div>
        <p class="muted">Avaa vain se kortti, jota haluat täyttää.</p>
      </div>
      ${grouped.map((group) => `
        <details class="score-card-list-group" style="margin-bottom: 20px; background: var(--surface-1); border: 2px solid var(--border); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
          <summary style="padding: 18px 20px; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; user-select: none; background: rgba(88, 183, 255, 0.03);">
            <div style="flex: 1;">
              <div class="kicker" style="color: var(--primary); font-size: 0.75rem; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px;">${escapeHtml(group.subtitle)}</div>
              <h3 style="margin: 0; font-size: 1.4rem; color: var(--text);">${escapeHtml(group.title)}</h3>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
              <span class="badge badge-info" style="font-size: 0.8rem; padding: 4px 10px; background: rgba(88, 183, 255, 0.15); color: var(--primary); border-radius: 999px; white-space: nowrap;">
                <strong>${group.rows.length} korttia</strong> · ${group.rows.filter((row) => row.card.updatedAt).length} tallennettu
              </span>
              <span class="button small dashed heat-group-toggle" style="pointer-events: none; padding: 4px 12px; border-radius: 999px; font-size: 0.8rem; white-space: nowrap;">Avaa pilotit ▾</span>
            </div>
          </summary>
          <div class="score-card-list-rows" style="padding: 20px; border-top: 1px solid var(--border); background: var(--surface); display: grid; gap: 15px;">
            ${group.rows.map(renderScoreCardSummaryRow).join("")}
          </div>
        </details>
      `).join("")}
    </section>
  `;
}

export function renderScoreCardClassButtons(activeEvent, allRows, targetClass) {
  const eventClasses = activeEvent?.classes?.length ? activeEvent.classes : [];
  const rowClasses = [...new Set(allRows.map((row) => row.className).filter(Boolean))];
  const classNames = [...new Set([...eventClasses, ...rowClasses])];

  const allButton = `<a class="button small ${targetClass ? "" : "primary"}" href="#/scorecards">Kaikki (${allRows.length})</a>`;
  const classButtons = classNames.map((className) => {
    const count = allRows.filter((row) => String(row.className).trim().toLowerCase() === String(className).trim().toLowerCase()).length;
    const activeClass = targetClass && String(targetClass).trim().toLowerCase() === String(className).trim().toLowerCase();
    return `<a class="button small ${activeClass ? "primary" : ""}" href="#/scorecards/${encodeURIComponent(className)}">${escapeHtml(className)} (${count})</a>`;
  }).join("");

  return `
    <div class="score-card-class-buttons">
      ${allButton}
      ${classButtons}
    </div>
  `;
}

function groupScoreCardsByHeat(state, activeEvent, rows, targetClass) {
  const groups = [];
  const heats = (state.heats || []).filter(h => h.eventId === activeEvent.id);

  // If a target class is selected, only process heats for that class
  const relevantHeats = targetClass 
    ? heats.filter(h => h.className && h.className.toLowerCase() === targetClass.toLowerCase())
    : heats;

  if (relevantHeats.length > 0) {
    // Sort heats logically
    relevantHeats.sort((a, b) => {
      const pA = a.phase === 'qualifying' ? 1 : (a.phase === 'semifinal' ? 2 : 3);
      const pB = b.phase === 'qualifying' ? 1 : (b.phase === 'semifinal' ? 2 : 3);
      if (pA !== pB) return pA - pB;
      if (a.round !== b.round) return a.round - b.round;
      return String(a.groupName).localeCompare(String(b.groupName), 'fi', {numeric: true});
    });

    relevantHeats.forEach(heat => {
      const heatRows = rows.filter(r => heat.entryIds.includes(r.entry.id));
      if (heatRows.length > 0) {
        const phaseLabel = heat.phase === 'semifinal' ? 'Semifinaali' : (heat.phase === 'final' ? 'Finaali' : `Alkuerä, kierros ${heat.round}`);
        groups.push({
          isHeat: true,
          title: `Heat ${heat.className || ''} ${heat.round || ''}-${heat.groupName || ''}`.trim(),
          subtitle: phaseLabel,
          rows: heatRows
        });
      }
    });
  }

  // Find rows that aren't in ANY of the displayed heat groups
  const displayedEntryIds = new Set(groups.flatMap(g => g.rows.map(r => r.entry.id)));
  const unassignedRows = rows.filter(r => !displayedEntryIds.has(r.entry.id));

  // If there are unassigned rows OR if there were no heats at all, group them by class
  if (unassignedRows.length > 0) {
    const classGroups = new Map();
    unassignedRows.forEach(r => {
      const className = r.className || "Yleinen";
      if (!classGroups.has(className)) classGroups.set(className, []);
      classGroups.get(className).push(r);
    });

    Array.from(classGroups.entries()).forEach(([className, cRows]) => {
      groups.push({
        isHeat: false,
        title: className,
        subtitle: groups.length > 0 ? "Ei jaettu heatteihin" : "Luokka",
        rows: cRows
      });
    });
  }

  return groups;
}

function renderScoreCardSummaryRow(row) {
  const { entry, card, totals } = row;
  const saved = Boolean(card.updatedAt);
  const label = card.templateId === SCORE_CARD_TEMPLATE_WWI ? "WWI" : "Standard";
  
  const currentPath = window.location.hash.replace("#/", "").split("?")[0];
  const backParam = currentPath && currentPath !== "scorecards" ? `?back=${currentPath}` : "";

  return `
    <article class="score-card-list-row">
      <div class="score-card-list-main">
        <p class="kicker">${escapeHtml(row.className)} · #${escapeHtml(entry.raceNumber || card.startNumber || "-")} · ${escapeHtml(label)}</p>
        <h4>${escapeHtml(row.pilotName)}</h4>
        <p class="muted"><strong style="color: var(--primary);">Heatit: ${escapeHtml(row.calculatedFlyingRound || "Ei jaettu")}</strong> · ${escapeHtml(row.aircraftName)} · ${formatDuration(totals.totalFlightSeconds)} · ${totals.totalCuts} cuts</p>
      </div>
      <div class="score-card-list-status">
        <span class="status ${saved ? "approved" : "pending"}">${saved ? "Tallennettu" : "Ei tallennettu"}</span>
        <strong>${totals.totalPoints} p</strong>
      </div>
      <div class="score-card-list-actions">
        <a class="button small primary" href="#/scorecard/${escapeHtml(entry.id)}${backParam}">Avaa kortti</a>
      </div>
    </article>
  `;
}

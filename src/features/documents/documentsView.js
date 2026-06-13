import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { SCORE_CARD_TEMPLATES } from "../../logic/scoreCards.js";
import { renderScoreCardForm } from "../scorecards/components/ScoreCardEditor.js";
import { t } from "../../utils/i18n.js";

export function renderPrintOverlay(state) {
  const activeEvent = getActiveEvent(state);
  if (!activeEvent) return "";

  let printOverlay = "";
  if (window.PRINT_GENERIC_EMPTY_CARD_TEMPLATE) {
    const templateId = window.PRINT_GENERIC_EMPTY_CARD_TEMPLATE;
    const className = window.PRINT_GENERIC_EMPTY_CARD_CLASS || "Yleinen";
    const fakeRow = {
      entry: { id: "generic", raceNumber: "", className },
      card: { templateId: templateId, rounds: [] },
      aircraft: {},
      className
    };
    window.PRINT_EMPTY_CARD_MODE = "blank";
    printOverlay = `
      <div class="print-only-fullscreen-overlay">
        ${renderScoreCardForm(activeEvent, fakeRow, { forceOpen: true })}
      </div>
    `;
    window.PRINT_EMPTY_CARD_MODE = null;
  } else if (window.PRINT_DOCUMENT_TYPE === "inspection") {
    printOverlay = `
      <div class="print-only-fullscreen-overlay">
        ${renderInspectionList(state, activeEvent)}
      </div>
    `;
  } else if (window.PRINT_DOCUMENT_TYPE === "judges") {
    printOverlay = `
      <div class="print-only-fullscreen-overlay">
        ${renderJudgesList(state, activeEvent)}
      </div>
    `;
  } else if (window.PRINT_ALL_FILLED_SCORECARDS) {
    const allRows = buildScoreCardRows(state, activeEvent);
    window.PRINT_EMPTY_CARD_MODE = "filled";
    const overlayContent = allRows.map(row => renderScoreCardForm(activeEvent, row, { forceOpen: true })).join("<div style='page-break-after: always;'></div>");
    printOverlay = `
      <div class="print-only-fullscreen-overlay" style="display: flex; flex-direction: column; gap: 20px;">
        ${overlayContent}
      </div>
    `;
    window.PRINT_EMPTY_CARD_MODE = null;
  } else if (window.PRINT_CLASS_FILLED_SCORECARDS) {
    const allRows = buildScoreCardRows(state, activeEvent).filter(row => (row.className || t(state, "results.general_class")) === window.PRINT_CLASS_FILLED_SCORECARDS);
    window.PRINT_EMPTY_CARD_MODE = "filled";
    const overlayContent = allRows.map(row => renderScoreCardForm(activeEvent, row, { forceOpen: true })).join("<div style='page-break-after: always;'></div>");
    printOverlay = `
      <div class="print-only-fullscreen-overlay" style="display: flex; flex-direction: column; gap: 20px;">
        ${overlayContent}
      </div>
    `;
    window.PRINT_EMPTY_CARD_MODE = null;
  } else if (window.PRINT_PILOT_SCORECARD_ENTRY_ID) {
    const allRows = buildScoreCardRows(state, activeEvent);
    const row = allRows.find(r => r.entry.id === window.PRINT_PILOT_SCORECARD_ENTRY_ID);
    if (row) {
      window.PRINT_EMPTY_CARD_MODE = "filled";
      printOverlay = `
        <div class="print-only-fullscreen-overlay" style="display: flex; flex-direction: column; gap: 20px;">
          ${renderScoreCardForm(activeEvent, row, { forceOpen: true })}
        </div>
      `;
      window.PRINT_EMPTY_CARD_MODE = null;
    }
  }

  return printOverlay;
}

export function renderDocumentsView(state) {
  const activeEvent = getActiveEvent(state);
  
  const introText = activeEvent ? `
    <p class="muted no-print" style="margin-top: 0; margin-bottom: 20px;">
      ${t(state, "documents.print_intro")} <strong style="color: var(--text);">${escapeHtml(activeEvent.name)}</strong>
    </p>
  ` : `
    <p class="muted no-print" style="margin-top: 0; margin-bottom: 20px;">
      ${t(state, "documents.intro_empty")}
    </p>
  `;

  const tab = window.DOCUMENT_TAB || 'tuloskortit';
  const tabNavigation = UI.ScrollableNav({
    id: "documents-sub-nav",
    className: "no-print",
    style: "margin-bottom: 20px; border-bottom: 1px solid var(--border);",
    navStyle: "padding-bottom: 10px;"
  }, `
    <button type="button" class="button ${tab === 'tuloskortit' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-document-tab" data-tab="tuloskortit">${t(state, "documents.tab_scorecards")}</button>
    <button type="button" class="button ${tab === 'listaukset' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-document-tab" data-tab="listaukset">${t(state, "documents.tab_lists")}</button>
    <button type="button" class="button ${tab === 'tarkastukset' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-document-tab" data-tab="tarkastukset">${t(state, "documents.tab_inspections")}</button>
    <button type="button" class="button ${tab === 'aikataulut' ? 'nav-active' : 'dashed'}" style="flex-shrink: 0;" data-action="set-document-tab" data-tab="aikataulut">${t(state, "documents.tab_schedules")}</button>
  `);

  let contentHtml = "";
  if (!activeEvent) {
    contentHtml = UI.Panel({ title: t(state, "documents.no_active_event") }, `<p>${t(state, "documents.no_active_event_desc")}</p>`);
  } else if (tab === "tuloskortit") {
    contentHtml = renderScoreCardPrintOptions(state, activeEvent);
  } else if (tab === "listaukset") {
    contentHtml = renderListPrintOptions();
  } else if (tab === "tarkastukset") {
    contentHtml = renderOfficialPrintOptions();
  } else if (tab === "aikataulut") {
    contentHtml = UI.Panel({ title: t(state, "documents.tab_schedules") }, `
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <div class="print-option-row">
          <div>
            <strong>${t(state, "documents.schedule_title")}</strong>
            <div class="muted" style="font-size: 0.8rem;">${t(state, "documents.schedule_desc")}</div>
          </div>
          <a href="#/eventinfo" class="button small primary">${t(state, "documents.open_for_print")}</a>
        </div>
      </div>
    `);
  }

  const content = contentHtml;

  return `
    <div class="documents-container no-print" style="margin-top: 20px;">
      ${introText}
      ${tabNavigation}
      ${content}
    </div>
    ${renderPrintOverlay(state)}
  `;
}

import { getScoreCardTemplateId, getScoreCardTemplate, buildScoreCardRows } from "../../logic/scoreCards.js";
import { getCompetitionFormatForClass } from "../../logic/competitionFormat.js";

function getAvailableClasses(state, activeEvent) {
  const baseClasses = ["WWII", "WWI", "EPA"];
  const formats = Object.keys(activeEvent.classFormats || {});
  const entryClasses = (state.entries || [])
    .filter(e => e.eventId === activeEvent.id)
    .map(e => e.className);
  return [...new Set([...baseClasses, ...formats, ...entryClasses])].filter(Boolean).sort();
}

function renderScoreCardPrintOptions(state, activeEvent) {
  const classes = getAvailableClasses(state, activeEvent);

  const classButtons = classes.map(className => {
    const templateId = getScoreCardTemplateId({ event: activeEvent, entry: { className } });
    const format = getCompetitionFormatForClass(activeEvent, className);
    
    let structureText = t(state, "documents.qualifying_rounds").replace("{n}", format.qualifyingRounds);
    if (format.semiFinalEnabled) structureText += t(state, "documents.plus_semi");
    if (format.finalEnabled) structureText += t(state, "documents.plus_final");

    return `
      <div class="print-option-row">
        <div>
          <strong>${escapeHtml(className)}</strong>
          <div class="muted" style="font-size: 0.8rem;">${templateId === 'wwi' ? t(state, "documents.template_wwi") : t(state, "documents.template_standard")} · ${structureText}</div>
        </div>
        ${UI.Button({ 
          label: t(state, "documents.print_blank"), 
          action: "print-generic-empty-card", 
          templateId: templateId,
          raceClass: className,
          variant: "small primary" 
        })}
      </div>
    `;
  }).join("");

  return UI.Panel({ title: t(state, "documents.tab_scorecards"), kicker: t(state, "documents.blank_papers_kicker") }, `
    <div style="display: flex; flex-direction: column; gap: 15px;">
      <p class="muted" style="margin: 0; font-size: 0.9rem;">${t(state, "documents.blank_papers_desc")}</p>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${classButtons}
      </div>

      ${activeEvent ? `
      <div style="margin-top: 10px; padding-top: 15px; border-top: 1px solid var(--border);">
        <p class="muted" style="margin: 0 0 10px 0; font-size: 0.9rem;">${t(state, "documents.print_all_desc")}</p>
        <button type="button" class="button primary" data-action="print-all-filled-scorecards" style="width: 100%; justify-content: center;">${t(state, "documents.print_all_btn")}</button>
      </div>
      ` : ''}
    </div>
  `);
}

function renderListPrintOptions() {
  const state = window.appState;
  return UI.Panel({ title: t(state, "documents.tab_lists"), kicker: t(state, "documents.competitors_kicker") }, `
    <div style="display: flex; flex-direction: column; gap: 15px;">
      
      <div class="print-option-row">
        <div>
          <strong>${t(state, "documents.heat_lists")}</strong>
          <div class="muted" style="font-size: 0.8rem;">${t(state, "documents.heat_lists_desc")}</div>
        </div>
        <a href="#/heats" class="button small primary">${t(state, "documents.open_view")}</a>
      </div>

      <div class="print-option-row">
        <div>
          <strong>${t(state, "documents.entry_list")}</strong>
          <div class="muted" style="font-size: 0.8rem;">${t(state, "documents.entry_list_desc")}</div>
        </div>
        <a href="#/entries" class="button small primary">${t(state, "documents.open_view")}</a>
      </div>

      <div class="print-option-row">
        <div>
          <strong>${t(state, "documents.pilot_register")}</strong>
          <div class="muted" style="font-size: 0.8rem;">${t(state, "documents.pilot_register_desc")}</div>
        </div>
        <a href="#/pilots" class="button small primary">${t(state, "documents.open_view")}</a>
      </div>

    </div>
  `);
}

function renderOfficialPrintOptions() {
  const state = window.appState;
  return UI.Panel({ title: t(state, "documents.officials_title"), kicker: t(state, "documents.officials_kicker") }, `
    <div style="display: flex; flex-direction: column; gap: 15px;">
      
      <div class="print-option-row">
        <div>
          <strong>${t(state, "documents.inspection_list")}</strong>
          <div class="muted" style="font-size: 0.8rem;">${t(state, "documents.inspection_list_desc")}</div>
        </div>
        ${UI.Button({ 
          label: t(state, "documents.print"), 
          action: "print-inspection-list", 
          variant: "small primary" 
        })}
      </div>

      <div class="print-option-row">
        <div>
          <strong>${t(state, "documents.judges_list")}</strong>
          <div class="muted" style="font-size: 0.8rem;">${t(state, "documents.judges_list_desc")}</div>
        </div>
        ${UI.Button({ 
          label: t(state, "documents.print"), 
          action: "print-judges-list", 
          variant: "small primary" 
        })}
      </div>

    </div>
  `);
}

function renderInspectionList(state, activeEvent) {
  const entries = state.entries?.filter(e => e.eventId === activeEvent.id) || [];
  const entriesWithPilots = entries.map(entry => {
    const pilot = state.pilots?.find(p => p.id === entry.pilotId);
    return { ...entry, pilot };
  }).sort((a, b) => (a.pilot?.firstName || "").localeCompare(b.pilot?.firstName || ""));

  const rows = entriesWithPilots.map((entry, index) => {
    return UI.TableRow({
      cells: [
        index + 1,
        escapeHtml(entry.raceNumber || ""),
        escapeHtml(`${entry.pilot?.firstName || ""} ${entry.pilot?.lastName || ""}`),
        escapeHtml(entry.className || ""),
        `<div style="width: 20px; height: 20px; border: 1px solid #000; margin: 0 auto;"></div>`,
        `<div style="width: 20px; height: 20px; border: 1px solid #000; margin: 0 auto;"></div>`,
        `<div style="width: 20px; height: 20px; border: 1px solid #000; margin: 0 auto;"></div>`,
        `<div style="border-bottom: 1px solid #000; width: 100%; height: 20px;"></div>`
      ]
    });
  });

  return `
    <div style="padding: 20px; background: white; color: black; min-height: 100vh;">
      <h2 style="text-align: center; margin-bottom: 5px;">${t(state, "documents.inspection_list")}</h2>
      <p style="text-align: center; margin-bottom: 20px;">${escapeHtml(activeEvent.name)}</p>
      ${UI.Table({
        headers: [t(state, "documents.col_hash"), t(state, "documents.col_number"), t(state, "documents.col_pilot"), t(state, "documents.col_class"), t(state, "documents.col_helmet"), t(state, "documents.col_plane1"), t(state, "documents.col_plane2"), t(state, "documents.col_signature")],
        rows,
        style: "width: 100%; border-collapse: collapse; font-size: 0.9rem;"
      })}
    </div>
  `;
}

function renderJudgesList(state, activeEvent) {
  // A generic blank grid for writing down judges for heats
  const rows = [];
  for (let i = 1; i <= 20; i++) {
    rows.push(UI.TableRow({
      cells: [
        `Heat ${i}`,
        `<div style="border-bottom: 1px solid #000; width: 100%; height: 20px;"></div>`,
        `<div style="border-bottom: 1px solid #000; width: 100%; height: 20px;"></div>`,
        `<div style="border-bottom: 1px solid #000; width: 100%; height: 20px;"></div>`,
        `<div style="border-bottom: 1px solid #000; width: 100%; height: 20px;"></div>`
      ]
    }));
  }

  return `
    <div style="padding: 20px; background: white; color: black; min-height: 100vh;">
      <h2 style="text-align: center; margin-bottom: 5px;">${t(state, "documents.judges_accounting")}</h2>
      <p style="text-align: center; margin-bottom: 20px;">${escapeHtml(activeEvent.name)}</p>
      ${UI.Table({
        headers: [t(state, "documents.col_heat"), t(state, "documents.col_judge1"), t(state, "documents.col_judge2"), t(state, "documents.col_judge3"), t(state, "documents.col_judge4")],
        rows,
        style: "width: 100%; border-collapse: collapse; font-size: 0.9rem;"
      })}
    </div>
  `;
}

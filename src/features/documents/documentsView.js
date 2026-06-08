import { escapeHtml, getActiveEvent } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { SCORE_CARD_TEMPLATES } from "../../logic/scoreCards.js";
import { renderScoreCardForm } from "../scorecards/components/ScoreCardEditor.js";

export function renderDocumentsView(state) {
  const activeEvent = getActiveEvent(state);
  
  if (!activeEvent) {
    return UI.Panel({ title: "Ei aktiivista kisaa" }, "<p>Avaa kilpailu kisakalenterista, jotta voit tulostaa asiakirjoja.</p>");
  }

  const introText = `
    <p class="muted no-print" style="margin-top: 0; margin-bottom: 20px;">
      Tulosta kilpailupaikan paperidokumentit kisaan: <strong style="color: var(--text);">${escapeHtml(activeEvent.name)}</strong>
    </p>
  `;

  const tab = window.DOCUMENT_TAB || 'tuloskortit';
  const tabNavigation = `
    <div class="ui-tabs no-print" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      <button type="button" class="button ${tab === 'tuloskortit' ? 'primary' : 'dashed'}" data-action="set-document-tab" data-tab="tuloskortit">Tuloskortit</button>
      <button type="button" class="button ${tab === 'listaukset' ? 'primary' : 'dashed'}" data-action="set-document-tab" data-tab="listaukset">Listaukset</button>
      <button type="button" class="button ${tab === 'tarkastukset' ? 'primary' : 'dashed'}" data-action="set-document-tab" data-tab="tarkastukset">Tarkastukset</button>
      <button type="button" class="button ${tab === 'aikataulut' ? 'primary' : 'dashed'}" data-action="set-document-tab" data-tab="aikataulut">Aikataulut</button>
    </div>
  `;

  let contentHtml = "";
  if (tab === "tuloskortit") {
    contentHtml = renderScoreCardPrintOptions(state, activeEvent);
  } else if (tab === "listaukset") {
    contentHtml = renderListPrintOptions();
  } else if (tab === "tarkastukset") {
    contentHtml = renderOfficialPrintOptions();
  } else if (tab === "aikataulut") {
    contentHtml = UI.Panel({ title: "Aikataulut" }, `
      <div style="display: flex; flex-direction: column; gap: 15px;">
        <div class="print-option-row">
          <div>
            <strong>Kilpailun aikataulu</strong>
            <div class="muted" style="font-size: 0.8rem;">Tapahtuman julkinen näkymä ja aikataulu</div>
          </div>
          <a href="#/eventinfo" class="button small primary">Avaa näkymä tulostusta varten</a>
        </div>
      </div>
    `);
  }

  const content = contentHtml;

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
  }

  return `
    <div class="documents-container no-print" style="margin-top: 20px;">
      ${introText}
      ${tabNavigation}
      ${content}
    </div>
    ${printOverlay}
  `;
}

import { getScoreCardTemplateId, getScoreCardTemplate } from "../../logic/scoreCards.js";
import { getCompetitionFormatForClass } from "../../logic/competitionFormat.js";

function getAvailableClasses(state, activeEvent) {
  const formats = Object.keys(activeEvent.classFormats || {});
  const entryClasses = (state.entries || [])
    .filter(e => e.eventId === activeEvent.id)
    .map(e => e.className)
    .filter(Boolean);
  
  const unique = [...new Set([...formats, ...entryClasses])];
  if (unique.length === 0) return ["WWII", "WWI", "EPA"];
  return unique.sort();
}

function renderScoreCardPrintOptions(state, activeEvent) {
  const classes = getAvailableClasses(state, activeEvent);

  const classButtons = classes.map(className => {
    const templateId = getScoreCardTemplateId({ event: activeEvent, entry: { className } });
    const format = getCompetitionFormatForClass(activeEvent, className);
    
    let structureText = `${format.qualifyingRounds} alkuerää`;
    if (format.semiFinalEnabled) structureText += ` + semifinaali`;
    if (format.finalEnabled) structureText += ` + finaali`;

    return `
      <div class="print-option-row">
        <div>
          <strong>${escapeHtml(className)}</strong>
          <div class="muted" style="font-size: 0.8rem;">Pohja: ${templateId === 'wwi' ? 'WWI' : 'Standard'} · ${structureText}</div>
        </div>
        ${UI.Button({ 
          label: "🖨️ Tulosta tyhjä pohja", 
          action: "print-generic-empty-card", 
          templateId: templateId,
          raceClass: className,
          variant: "small primary" 
        })}
      </div>
    `;
  }).join("");

  return UI.Panel({ title: "Tuloskortit", kicker: "Kynällä täytettävät paperit" }, `
    <div style="display: flex; flex-direction: column; gap: 15px;">
      <p class="muted" style="margin: 0; font-size: 0.9rem;">Tulosta kilpailun rakenteeseen mukautettuja tyhjiä tuloskortteja käytettäväksi kilpailupaikalla varakortteina tai lennosta lisätyille piloteille.</p>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${classButtons}
      </div>

      <div style="margin-top: 10px; padding-top: 15px; border-top: 1px solid var(--border);">
        <p class="muted" style="margin: 0 0 10px 0; font-size: 0.9rem;">Voit myös tulostaa järjestelmään jo kirjatut (osittain tai kokonaan täytetyt) tuloskortit.</p>
        <a href="#/scorecards" class="button" style="width: 100%; justify-content: center;">Avaa täytetyt tuloskortit</a>
      </div>
    </div>
  `);
}

function renderListPrintOptions() {
  return UI.Panel({ title: "Listaukset", kicker: "Kilpailijat ja aikataulut" }, `
    <div style="display: flex; flex-direction: column; gap: 15px;">
      
      <div class="print-option-row">
        <div>
          <strong>Heat-listat</strong>
          <div class="muted" style="font-size: 0.8rem;">Kaikkien luokkien lentovuorot</div>
        </div>
        <a href="#/heats" class="button small primary">Avaa näkymä</a>
      </div>

      <div class="print-option-row">
        <div>
          <strong>Osallistujalista</strong>
          <div class="muted" style="font-size: 0.8rem;">Kilpailuun ilmoittautuneet pilotit</div>
        </div>
        <a href="#/entries" class="button small primary">Avaa näkymä</a>
      </div>

      <div class="print-option-row">
        <div>
          <strong>Pilottirekisteri</strong>
          <div class="muted" style="font-size: 0.8rem;">Kaikki järjestelmän pilotit</div>
        </div>
        <a href="#/pilots" class="button small primary">Avaa näkymä</a>
      </div>

    </div>
  `);
}

function renderOfficialPrintOptions() {
  return UI.Panel({ title: "Toimitsijat & Tarkastukset", kicker: "Kilpailun järjestäminen" }, `
    <div style="display: flex; flex-direction: column; gap: 15px;">
      
      <div class="print-option-row">
        <div>
          <strong>Katsastuslista</strong>
          <div class="muted" style="font-size: 0.8rem;">Ruksittava lista koneiden katsastukseen</div>
        </div>
        ${UI.Button({ 
          label: "🖨️ Tulosta", 
          action: "print-inspection-list", 
          variant: "small primary" 
        })}
      </div>

      <div class="print-option-row">
        <div>
          <strong>Tuomarilistat</strong>
          <div class="muted" style="font-size: 0.8rem;">Tyhjä kirjauslista heat-tuomareille</div>
        </div>
        ${UI.Button({ 
          label: "🖨️ Tulosta", 
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
      <h2 style="text-align: center; margin-bottom: 5px;">Katsastuslista</h2>
      <p style="text-align: center; margin-bottom: 20px;">${escapeHtml(activeEvent.name)}</p>
      ${UI.Table({
        headers: ["#", "Numero", "Pilotti", "Luokka", "Kypärä", "Kone 1", "Kone 2", "Allekirjoitus"],
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
      <h2 style="text-align: center; margin-bottom: 5px;">Tuomarikirjanpito</h2>
      <p style="text-align: center; margin-bottom: 20px;">${escapeHtml(activeEvent.name)}</p>
      ${UI.Table({
        headers: ["Heat", "Tuomari 1", "Tuomari 2", "Tuomari 3", "Tuomari 4"],
        rows,
        style: "width: 100%; border-collapse: collapse; font-size: 0.9rem;"
      })}
    </div>
  `;
}

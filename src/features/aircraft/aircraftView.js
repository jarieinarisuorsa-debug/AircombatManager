import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { calculateModelSpecs } from "../../data/aircraftSpecs.js";
import { isAdmin } from "../../users/roles.js";

export function renderAircraftView(state) {
  const admin = isAdmin(state);
  const aircraftSpecs = state.aircraftSpecs || [];
  const aircraftSpecFormOpen = Boolean(state.settings?.aircraftSpecFormOpen);

  const tab = window.AIRCRAFT_TAB || 'konetyypit';
  
  const tabNavigation = `
    <div class="ui-tabs no-print" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
      <button type="button" class="button ${tab === 'konetyypit' ? 'primary' : 'dashed'}" data-action="set-aircraft-tab" data-tab="konetyypit">Mittataulukko</button>
      <button type="button" class="button ${tab === 'saannot' ? 'primary' : 'dashed'}" data-action="set-aircraft-tab" data-tab="saannot">Säännöt</button>
      <button type="button" class="button ${tab === 'katsastus' ? 'primary' : 'dashed'}" data-action="set-aircraft-tab" data-tab="katsastus">Katsastus</button>
    </div>
  `;

  let contentHtml = "";

  if (tab === "konetyypit") {
    const isAdminClass = admin ? "is-admin" : "";
    
    const rows = aircraftSpecs.map(ac => {
      const span = calculateModelSpecs(ac.realSpanM);
      const len = calculateModelSpecs(ac.realLengthM);
      
      const adminActions = admin ? `
        <div class="ac-actions">
          ${UI.Button({
            label: "Poista",
            action: "delete-aircraft-spec",
            specId: ac.id,
            variant: "small danger"
          })}
        </div>
      ` : "";

      return `
        <div class="aircraft-card">
          <div class="ac-title"><strong>${escapeHtml(ac.name)}</strong></div>
          <div class="ac-stat">
            <span class="ac-label">Oikea kärkiväli</span>
            <span class="ac-val">${Number(ac.realSpanM || 0).toFixed(2)} m</span>
          </div>
          <div class="ac-stat">
            <span class="ac-label">Oikea pituus</span>
            <span class="ac-val">${Number(ac.realLengthM || 0).toFixed(2)} m</span>
          </div>
          <div class="ac-stat">
            <span class="ac-label">1:12 Kärkiväli</span>
            <span class="ac-val"><strong>${span.target} cm</strong> <span class="muted">(${span.min} - ${span.max})</span></span>
          </div>
          <div class="ac-stat">
            <span class="ac-label">1:12 Pituus</span>
            <span class="ac-val"><strong>${len.target} cm</strong> <span class="muted">(${len.min} - ${len.max})</span></span>
          </div>
          ${adminActions}
        </div>
      `;
    }).join("");

    const adminHeader = admin ? "<div>Toiminnot</div>" : "";

    const tableContainer = `
      <div class="aircraft-grid ${isAdminClass}">
        <div class="aircraft-grid-header no-mobile">
          <div>Konetyyppi</div>
          <div>Oikea kärkiväli</div>
          <div>Oikea pituus</div>
          <div>1:12 Kärkiväli (Sallittu väli)</div>
          <div>1:12 Pituus (Sallittu väli)</div>
          ${adminHeader}
        </div>
        ${rows}
      </div>
    `;

    const actions = `
      <div style="display: flex; gap: 10px;" class="no-print">
        ${admin ? UI.Button({ label: "+ Lisää konetyyppi", action: "focus-aircraft-spec-form", variant: "primary", title: "Avaa uuden konetyypin lisäyslomake" }) : ""}
        ${UI.Button({ label: "🖨 Tulosta taulukko", action: "print-page", variant: "dashed", title: "Tulosta taulukko" })}
      </div>
    `;

    contentHtml = `
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
          <div>
            <p class="kicker">Taulukko</p>
            <h4 style="margin: 0;">Konetyypit ja päämitat (1:12)</h4>
          </div>
          ${actions}
        </div>
        ${tableContainer}
      </div>
    `;
  } else if (tab === "saannot") {
    const rulesContent = `
      <div style="margin-bottom: 25px;">
        <h4 style="margin-top: 0;">3.1 Esikuva (Tiivistelmä)</h4>
        <ul style="margin-left: 20px; line-height: 1.6;">
          <li>Lennokin tulee olla skaala tai semiskaala taistelukoneesta (1935–1945), jonka esikuvassa min. 500 hv moottori.</li>
          <li>Mittakaava on <strong>1:12</strong>. Siiven kärkiväli ja rungon pituus <strong>+/- 5%</strong> tarkkuudella.</li>
          <li>Muut mitat <strong>+/- 2 cm</strong> tarkkuudella.</li>
          <li>Siiven paksuus tulee olla yli <strong>10 %</strong> siiven leveydestä profiilin paksuimmasta kohdasta.</li>
          <li>Siiven etureunassa tai peräsimissä ei saa olla eteentyöntyviä osia.</li>
          <li>Streamerileikkurit sallittu vain <strong>297 mm</strong> alueella rungon sivusta ulospäin (A4 leveys). Kaksimoottorisissa cowlingista ulospäin.</li>
          <li>Lennokin tulee näyttää esikuvaltaan myös värityksen ja yksityiskohtien osalta. Kolmitahokuvat (min. 1:72) oltava katsastuksessa mukana.</li>
        </ul>
      </div>
    `;
    contentHtml = UI.Panel({ kicker: "Säännöt", title: "Lennokkien rakennesäännöt" }, rulesContent);
  } else if (tab === "katsastus") {
    contentHtml = UI.Panel({ kicker: "Katsastus", title: "Katsastuspöytäkirja" }, `
      <p>Tässä osiossa voidaan tulevaisuudessa suorittaa kilpailukohtainen koneiden katsastus ja tarkastaa mittataulukon mukaiset sallitut poikkeamat.</p>
    `);
  }

  const pageHeader = UI.PageHeader({
    kicker: "Ohjeistus & Katsastus",
    title: "Koneet",
    subtitle: `${aircraftSpecs.length} konetyyppiä rekisterissä`
  });

  const modalHtml = admin && aircraftSpecFormOpen ? renderAircraftSpecModal() : "";

  return `
    ${pageHeader}
    ${tabNavigation}
    <div style="width: 100%; ${tab !== 'konetyypit' ? 'max-width: 800px;' : ''}">
      ${contentHtml}
    </div>
    ${modalHtml}
  `;
}

function renderAircraftSpecModal() {
  const formContent = `
    ${UI.Input({ label: "Konetyypin nimi", name: "name", required: true, placeholder: "esim. Junkers Ju 87" })}
    ${UI.Input({ label: "Oikea kärkiväli (m)", name: "realSpanM", required: true, type: "number", step: "0.01", placeholder: "esim. 13.80" })}
    ${UI.Input({ label: "Oikea pituus (m)", name: "realLengthM", required: true, type: "number", step: "0.01", placeholder: "esim. 11.00" })}
    <div class="ui-form-actions">
      ${UI.Button({ label: "Sulje", action: "close-aircraft-spec-form", variant: "small" })}
      ${UI.Button({ label: "Lisää konetyyppi", type: "submit", variant: "primary" })}
    </div>
  `;

  const formPanel = UI.FormPanel({
    action: "add-aircraft-spec",
    id: "aircraft-spec-form",
    className: "aircraft-spec-modal-panel"
  }, formContent);

  return `
    <div class="app-modal-backdrop" data-action="close-aircraft-spec-form">
      <div class="app-modal-shell" role="dialog" aria-modal="true" aria-labelledby="aircraft-spec-modal-title" data-action="none">
        <div class="app-modal-topbar">
          <div>
            <p class="kicker">Hallinta</p>
            <h3 id="aircraft-spec-modal-title">Uusi konetyyppi</h3>
          </div>
          ${UI.Button({ label: "✕", action: "close-aircraft-spec-form", variant: "small", title: "Sulje" })}
        </div>
        ${formPanel}
      </div>
    </div>
  `;
}

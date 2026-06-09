import { UI } from "../../ui/engine.js";

export function renderAboutView(state) {
  const pageHeader = UI.PageHeader({
    kicker: "Tietoja",
    title: "Aircombat Competition Manager",
  });

  const generalInfoPanel = UI.Panel({ title: "Yleistä ohjelmasta" }, `
    <div style="padding: 10px;">
      <p style="margin-bottom: 15px; line-height: 1.6;">
        <strong>Aircombat Competition Manager</strong> on suunniteltu RC Aircombat -kilpailujen (WWII, WWI, EPA) kokonaisvaltaiseen hallintaan. 
        Tavoitteena on sähköistää ja nopeuttaa kilpailujen järjestämistä, ilmoittautumisia, erä-arvontoja (Heatit) sekä tuloslaskentaa.
      </p>
      <p style="margin-bottom: 15px; line-height: 1.6;">
        Järjestelmä on optimoitu toimimaan sekä tietokoneella että mobiililaitteilla. Tämä mahdollistaa tulosten syöttämisen, heat-arvontojen tarkastelun ja pilottien hallinnoinnin kätevästi suoraan kilpailupaikalla tabletin tai älypuhelimen avulla.
      </p>
    </div>
  `);

  const howToUsePanel = UI.Panel({ title: "Kuinka ohjelmaa käytetään" }, `
    <div style="padding: 10px;">
      <ul style="padding-left: 20px; margin-bottom: 0; line-height: 1.6;">
        <li style="margin-bottom: 10px;"><strong>Vierailijat:</strong> Voivat selata kisakalenteria, katsoa kilpailujen tuloksia ja sarjataulukkoja ilman sisäänkirjautumista.</li>
        <li style="margin-bottom: 10px;"><strong>Pilotit:</strong> Kirjautumalla sisään pilotti voi hallinnoida omaa <em>pilottikorttiaan</em>, ylläpitää kalustonsa <em>konekortteja</em> sekä ilmoittautua helposti tuleviin kilpailuihin. Tuloskortit ja oma menestys ovat heti nähtävillä kilpailun aikana.</li>
        <li style="margin-bottom: 10px;"><strong>Ylläpitäjät (Admin):</strong> Järjestäjät voivat luoda uusia tapahtumia, hallita osallistujalistoja, arpoa heatit ja vahvistaa tulokset. Kaikki kilpailun pyörittämiseen tarvittavat työkalut löytyvät järjestelmän Työympäristö-valikosta.</li>
      </ul>
    </div>
  `);

  const securityPanel = UI.Panel({ title: "Tietoturva ja yksityisyys" }, `
    <div style="padding: 10px;">
      <p style="margin-bottom: 15px; line-height: 1.6;">
        Järjestelmässä on panostettu tietoturvaan ja käyttäjien yksityisyyden suojaamiseen:
      </p>
      <ul style="padding-left: 20px; margin-bottom: 0; line-height: 1.6;">
        <li style="margin-bottom: 10px;"><strong>Henkilötiedot:</strong> Pilottien tarkat yhteystiedot (sähköposti, puhelinnumero, osoite) näkyvät ainoastaan pilotille itselleen sekä järjestelmän ylläpitäjille (kilpailun järjestäjille). Julkisissa osallistujalistoissa näytetään vain nimi, maa ja seura.</li>
        <li style="margin-bottom: 10px;"><strong>Sisäänkirjautuminen:</strong> Järjestelmä käyttää modernia ja turvallista tunnistautumista. Salasanattoman sähköpostikirjautumisen (Magic Link) tai kolmannen osapuolen (Google/Discord) tunnistautumisen ansiosta järjestelmä ei koskaan kysy eikä tallenna salasanoja.</li>
        <li style="margin-bottom: 10px;"><strong>Datan turvaaminen:</strong> Ohjelman tuottama tieto tallentuu suojattuun tietokantaan, josta otetaan automaattisesti varmuuskopioita. Admin-käyttäjät voivat lisäksi ladata koko tietokannan paikallisesti talteen Asetukset-valikosta.</li>
      </ul>
    </div>
  `);

  const creditsPanel = UI.Panel({ title: "Kehittäjä" }, `
    <div style="text-align: center; padding: 20px;">
      <p style="font-size: 1.1rem; margin-bottom: 5px;">
        Ohjelman suunnitellut ja toteuttanut:
      </p>
      <strong style="color: var(--primary); font-size: 1.3rem;">Jari Suorsa &copy; 2026</strong>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border);">
        <p style="margin-bottom: 15px;">Pidätkö ohjelmasta? Voit tukea sen ylläpitoa ja jatkokehitystä katsomalla lyhyen mainoksen.</p>
        <a href="https://play.google.com/store" target="_blank" class="button primary" style="display: inline-flex; align-items: center; gap: 8px;">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          Tue ohjelman kehitystä
        </a>
      </div>
    </div>
  `);

  return `
    ${pageHeader}
    <div class="stack" style="max-width: 900px; margin: 0 auto; padding-bottom: 40px;">
      ${generalInfoPanel}
      ${howToUsePanel}
      ${securityPanel}
      ${creditsPanel}
    </div>
  `;
}

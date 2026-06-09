import { UI } from "../../ui/engine.js";
import { t } from "../../utils/i18n.js";

export function renderAboutView(state) {
  const pageHeader = UI.PageHeader({
    kicker: t(state, "about.title"),
    title: "Aircombat Competition Manager",
  });

  const generalInfoPanel = UI.Panel({ title: t(state, "about.general_title") }, `
    <div style="padding: 10px;">
      <p style="margin-bottom: 15px; line-height: 1.6;">
        ${t(state, "about.general_p1")}
      </p>
      <p style="margin-bottom: 15px; line-height: 1.6;">
        ${t(state, "about.general_p2")}
      </p>
    </div>
  `);

  const howToUsePanel = UI.Panel({ title: t(state, "about.how_to_use_title") }, `
    <div style="padding: 10px;">
      <ul style="padding-left: 20px; margin-bottom: 0; line-height: 1.6;">
        <li style="margin-bottom: 10px;">${t(state, "about.how_to_use_visitors")}</li>
        <li style="margin-bottom: 10px;">${t(state, "about.how_to_use_pilots")}</li>
        <li style="margin-bottom: 10px;">${t(state, "about.how_to_use_admins")}</li>
      </ul>
    </div>
  `);

  const securityPanel = UI.Panel({ title: t(state, "about.security_title") }, `
    <div style="padding: 10px;">
      <p style="margin-bottom: 15px; line-height: 1.6;">
        ${t(state, "about.security_desc")}
      </p>
      <ul style="padding-left: 20px; margin-bottom: 0; line-height: 1.6;">
        <li style="margin-bottom: 10px;">${t(state, "about.security_personal")}</li>
        <li style="margin-bottom: 10px;">${t(state, "about.security_login")}</li>
        <li style="margin-bottom: 10px;">${t(state, "about.security_data")}</li>
      </ul>
    </div>
  `);

  const howToBuildCompetitionPanel = UI.Panel({ title: t(state, "about.build_title") }, `
    <div style="padding: 10px;">
      <p style="margin-bottom: 15px; line-height: 1.6;">
        ${t(state, "about.build_desc")}
      </p>
      <ol style="padding-left: 20px; margin-bottom: 0; line-height: 1.6;">
        <li style="margin-bottom: 10px;">${t(state, "about.build_1")}</li>
        <li style="margin-bottom: 10px;">${t(state, "about.build_2")}</li>
        <li style="margin-bottom: 10px;">${t(state, "about.build_3")}</li>
        <li style="margin-bottom: 10px;">${t(state, "about.build_4")}</li>
        <li style="margin-bottom: 10px;">${t(state, "about.build_5")}</li>
      </ol>
    </div>
  `);

  const howToManageCompetitionsPanel = UI.Panel({ title: t(state, "about.manage_title") }, `
    <div style="padding: 10px;">
      <p style="margin-bottom: 15px; line-height: 1.6;">
        ${t(state, "about.manage_desc")}
      </p>
      <ul style="padding-left: 20px; margin-bottom: 0; line-height: 1.6;">
        <li style="margin-bottom: 10px;">${t(state, "about.manage_1")}</li>
        <li style="margin-bottom: 10px;">${t(state, "about.manage_2")}</li>
        <li style="margin-bottom: 10px;">${t(state, "about.manage_3")}</li>
      </ul>
    </div>
  `);

  const creditsPanel = UI.Panel({ title: t(state, "about.credits_title") }, `
    <div style="text-align: center; padding: 20px;">
      <p style="font-size: 1.1rem; margin-bottom: 5px;">
        ${t(state, "about.credits_desc")}
      </p>
      <strong style="color: var(--primary); font-size: 1.3rem;">Jari Suorsa &copy; 2026</strong>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border);">
        <p style="margin-bottom: 15px;">${t(state, "about.support_desc")}</p>
        <a href="https://play.google.com/store" target="_blank" class="button primary" style="display: inline-flex; align-items: center; gap: 8px;">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          ${t(state, "about.support_btn")}
        </a>
      </div>
    </div>
  `);

  return `
    ${pageHeader}
    <div class="stack" style="max-width: 900px; margin: 0 auto; padding-bottom: 40px;">
      ${generalInfoPanel}
      ${howToUsePanel}
      ${howToManageCompetitionsPanel}
      ${howToBuildCompetitionPanel}
      ${securityPanel}
      ${creditsPanel}
    </div>
  `;
}

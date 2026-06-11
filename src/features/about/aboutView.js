import { UI } from "../../ui/engine.js";
import { t } from "../../utils/i18n.js";
import { isDemo } from "../../state/store.js";

export function renderAboutView(state) {
  const pageHeader = UI.PageHeader({
    kicker: t(state, "about.title"),
    title: isDemo ? "Aircombat Competition Manager (DEMO)" : "Aircombat Competition Manager",
  });

  const demoInfoPanel = isDemo ? UI.Panel({ 
    title: t(state, "about.demo_mode"), 
    style: "border: 2px solid var(--warning); background: rgba(255, 193, 7, 0.05);" 
  }, `
    <div style="padding: 10px;">
      <p style="margin-bottom: 0; line-height: 1.6; color: var(--warning); font-weight: bold;">
        ${t(state, "about.demo_mode_desc")}
      </p>
    </div>
  `) : "";

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
    <div style="padding: 10px; text-align: center;">
      <a href="#/buildguide" class="app-btn primary" style="
        display: inline-flex; 
        align-items: center; 
        justify-content: center; 
        text-decoration: none;
        padding: 14px 28px;
        font-size: 1.1rem;
        font-weight: 700;
        border-radius: 30px;
        background: linear-gradient(135deg, var(--primary, #3b82f6), #1d4ed8);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid rgba(255,255,255,0.1);
      " onmouseover="this.style.transform='translateY(-3px) scale(1.02)'; this.style.boxShadow='0 10px 25px rgba(59, 130, 246, 0.6)';" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.4)';">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        ${t(state, "about.guide_title")}
      </a>
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
        <button type="button" class="app-btn primary" data-action="show-rewarded-ad" style="display: inline-flex; align-items: center; gap: 8px;">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          ${t(state, "about.support_btn")}
        </button>
      </div>
    </div>
  `);

  const qrCodePanel = UI.Panel({ title: t(state, "about.qr_title") }, `
    <div style="padding: 10px;">
      <p style="margin-bottom: 15px; line-height: 1.6;">
        ${t(state, "about.qr_desc")}
      </p>
      <ul style="padding-left: 20px; margin-bottom: 0; line-height: 1.6;">
        <li style="margin-bottom: 10px;">${t(state, "about.qr_1")}</li>
        <li style="margin-bottom: 10px;">${t(state, "about.qr_2")}</li>
      </ul>
    </div>
  `);

  return `
    ${pageHeader}
    <div class="stack" style="max-width: 900px; margin: 0 auto; padding-bottom: 40px;">
      ${demoInfoPanel}
      ${generalInfoPanel}
      ${howToUsePanel}
      ${howToManageCompetitionsPanel}
      ${howToBuildCompetitionPanel}
      ${qrCodePanel}
      ${securityPanel}
      ${creditsPanel}
    </div>
  `;
}

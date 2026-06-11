import { UI } from "../../ui/engine.js";
import { t } from "../../utils/i18n.js";

export function renderBuildGuideView(state) {
  const pageHeader = UI.PageHeader({
    kicker: t(state, "nav.about"),
    title: t(state, "nav.entries")
  });

  const styles = `
    <style>
      .guide-tabs-container {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 40px;
        justify-content: center;
        background: rgba(255, 255, 255, 0.02);
        padding: 24px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05);
        backdrop-filter: blur(10px);
      }
      .guide-tab-btn {
        background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
        border: 1px solid rgba(255,255,255,0.1);
        color: #e2e8f0;
        padding: 10px 20px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: default;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 8px;
        letter-spacing: 0.01em;
      }
      .guide-tab-btn:hover {
        transform: translateY(-3px) scale(1.02);
        background: linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
        border-color: rgba(255,255,255,0.2);
        box-shadow: 0 10px 24px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.05);
        color: #fff;
      }
      .guide-tab-btn.active {
        background: linear-gradient(135deg, var(--primary, #3b82f6), #1d4ed8);
        color: #ffffff;
        border-color: transparent;
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5), inset 0 2px 4px rgba(255,255,255,0.2);
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }
      .guide-tab-btn.active:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 12px 30px rgba(59, 130, 246, 0.6), inset 0 2px 4px rgba(255,255,255,0.2);
      }
      .guide-tab-icon {
        opacity: 0.7;
        display: flex;
      }
      .guide-tab-btn.active .guide-tab-icon {
        opacity: 1;
      }
      .guide-steps-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 50px;
      }
      .guide-step-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-left: 4px solid var(--surface-4, #475569);
        padding: 20px 24px;
        border-radius: 0 16px 16px 0;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .guide-step-card:hover {
        background: rgba(255, 255, 255, 0.06);
        border-left-color: var(--primary, #3b82f6);
        transform: translateX(6px);
        box-shadow: -2px 8px 20px rgba(0,0,0,0.15);
      }
      .guide-step-text {
        color: #e2e8f0;
        line-height: 1.6;
        font-size: 1.05rem;
      }

      .guide-back-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        text-decoration: none;
        padding: 16px 36px;
        border-radius: 30px;
        background: linear-gradient(135deg, var(--surface-3, #334155), var(--surface-2, #1e293b));
        color: #fff;
        font-weight: 700;
        font-size: 1.1rem;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        letter-spacing: 0.02em;
      }
      .guide-back-btn:hover {
        transform: translateY(-4px) scale(1.02);
        background: linear-gradient(135deg, var(--surface-4, #475569), var(--surface-3, #334155));
        box-shadow: 0 12px 30px rgba(0,0,0,0.4);
        border-color: rgba(255,255,255,0.2);
        color: #fff;
      }
      .guide-back-btn:active {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
    </style>
  `;

  const getIcon = (name) => {
    switch(name) {
      case 'reg': return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>';
      case 'class': return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>';
      case 'format': return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>';
      case 'pilots': return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>';
      case 'comp': return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      case 'combat': return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>';
      case 'heats': return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
      case 'scores': return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
      case 'results': return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
      default: return '';
    }
  };

  const guidePanel = UI.Panel({ title: t(state, "about.guide_title") }, `
    ${styles}
    <div style="padding: 10px 20px 30px; text-align: left;">
      <p style="margin-bottom: 30px; font-size: 1.15rem; color: #cbd5e1; line-height: 1.7; text-align: center; max-width: 700px; margin-left: auto; margin-right: auto;">
        ${t(state, "about.build_desc")}
      </p>
      
      <div class="guide-tabs-container">
        <div class="guide-tab-btn"><span class="guide-tab-icon">${getIcon('reg')}</span> ${t(state, "about.guide_tab_reg")}</div>
        <div class="guide-tab-btn"><span class="guide-tab-icon">${getIcon('class')}</span> ${t(state, "about.guide_tab_class")}</div>
        <div class="guide-tab-btn"><span class="guide-tab-icon">${getIcon('format')}</span> ${t(state, "about.guide_tab_format")}</div>
        <div class="guide-tab-btn"><span class="guide-tab-icon">${getIcon('pilots')}</span> ${t(state, "about.guide_tab_pilots")}</div>
        <div class="guide-tab-btn"><span class="guide-tab-icon">${getIcon('comp')}</span> ${t(state, "about.guide_tab_comp")}</div>
        <div class="guide-tab-btn"><span class="guide-tab-icon">${getIcon('combat')}</span> ${t(state, "about.guide_tab_combat")}</div>
        <div class="guide-tab-btn"><span class="guide-tab-icon">${getIcon('heats')}</span> ${t(state, "about.guide_tab_heats")}</div>
        <div class="guide-tab-btn"><span class="guide-tab-icon">${getIcon('scores')}</span> ${t(state, "about.guide_tab_scores")}</div>
        <div class="guide-tab-btn"><span class="guide-tab-icon">${getIcon('results')}</span> ${t(state, "about.guide_tab_results")}</div>
      </div>

      <div class="guide-steps-container">
        <div class="guide-step-card"><div class="guide-step-text">${t(state, "about.guide_reg")}</div></div>
        <div class="guide-step-card"><div class="guide-step-text">${t(state, "about.guide_class")}</div></div>
        <div class="guide-step-card"><div class="guide-step-text">${t(state, "about.guide_format")}</div></div>
        <div class="guide-step-card"><div class="guide-step-text">${t(state, "about.guide_pilots")}</div></div>
        <div class="guide-step-card"><div class="guide-step-text">${t(state, "about.guide_comp")}</div></div>
        <div class="guide-step-card"><div class="guide-step-text">${t(state, "about.guide_combat")}</div></div>
        <div class="guide-step-card"><div class="guide-step-text">${t(state, "about.guide_heats")}</div></div>
        <div class="guide-step-card"><div class="guide-step-text">${t(state, "about.guide_scores")}</div></div>
        <div class="guide-step-card"><div class="guide-step-text">${t(state, "about.guide_results")}</div></div>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="#/about" class="guide-back-btn">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          ${t(state, "about.guide_back")}
        </a>
      </div>
    </div>
  `);

  return `
    ${pageHeader}
    <div class="stack" style="max-width: 900px; margin: 0 auto; padding-bottom: 40px;">
      ${guidePanel}
    </div>
  `;
}

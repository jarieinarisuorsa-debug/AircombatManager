import { UI } from "../../ui/engine.js";
import { t } from "../../utils/i18n.js";

export function renderBuildGuideView(state) {
  const pageHeader = UI.PageHeader({
    kicker: t(state, "nav.about"),
    title: t(state, "nav.entries")
  });

  const styles = `
    <style>
      .guide-steps-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 50px;
      }
      .guide-step-card {
        background: var(--panel);
        border: 1px solid var(--border);
        border-left: 4px solid var(--muted);
        padding: 20px 24px;
        border-radius: 0 16px 16px 0;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      }
      .guide-step-card:hover {
        background: var(--panel-strong);
        border-left-color: var(--accent);
        transform: translateX(6px);
        box-shadow: -2px 8px 20px rgba(0,0,0,0.1);
      }
      .guide-step-text {
        color: var(--text);
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
        background: var(--panel-strong);
        color: var(--text);
        font-weight: 700;
        font-size: 1.1rem;
        border: 1px solid var(--border);
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        letter-spacing: 0.02em;
      }
      .guide-back-btn:hover {
        transform: translateY(-4px) scale(1.02);
        background: var(--bg);
        box-shadow: 0 12px 30px rgba(0,0,0,0.2);
        border-color: var(--accent);
        color: var(--text);
      }
      .guide-back-btn:active {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
    </style>
  `;

  const guidePanel = UI.Panel({ title: t(state, "about.guide_title") }, `
    ${styles}
    <div style="padding: 10px 20px 30px; text-align: left;">
      <p style="margin-bottom: 30px; font-size: 1.15rem; color: var(--muted); line-height: 1.7; text-align: center; max-width: 700px; margin-left: auto; margin-right: auto;">
        ${t(state, "about.build_desc")}
      </p>
      
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

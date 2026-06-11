// ==============================
// Aircombat Competition Manager
// src/features/landing/environmentsView.js
// ==============================

import { UI } from "../../ui/engine.js";
import { t } from "../../utils/i18n.js";

export function renderEnvironmentsView(state) {
  const header = `
    <div style="margin-bottom: 50px; display: flex; flex-direction: column; align-items: center; animation: fade-in-down 0.6s ease-out;">
      <h1 style="font-size: clamp(2.5rem, 6vw, 4.5rem); margin: 0; line-height: 1.1; letter-spacing: -0.03em;">Aircombat</h1>
      <p style="font-size: clamp(1rem, 2vw, 1.3rem); color: var(--accent); opacity: 0.8; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600;">Competition Manager</p>
    </div>
  `;

  const finlandPanel = UI.Panel({ 
    className: "country-card",
    style: "padding: 0; border-radius: 28px; transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); margin: 0 auto; max-width: 280px; width: 100%; position: relative; overflow: hidden;"
  }, `
    <div class="card-glow" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at top right, rgba(88, 183, 255, 0.15), transparent 60%); pointer-events: none;"></div>
    <a href="#/home" style="display: flex; flex-direction: column; align-items: center; padding: 40px 30px; text-decoration: none; color: inherit; height: 100%; box-sizing: border-box; cursor: pointer;" onclick="localStorage.setItem('activeSystem', 'finland'); window.location.href='#/home'; window.location.reload(); return false;">
      <div style="margin-bottom: 20px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));">
        <img src="./src/assets/flags/fi.png" alt="Finland Flag" style="width: 90px; height: auto; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);" />
      </div>
      <h3 style="margin: 0; font-size: 1.6rem; font-weight: 800; letter-spacing: 0.02em;">${t(state, "environments.finland")}</h3>
      <p style="margin: 8px 0 0 0; font-size: 0.95rem; color: var(--accent); font-weight: 600;">${t(state, "environments.finland_desc")}</p>
    </a>
  `);

  const demoContent = `
    <a href="#/home" style="display: flex; flex-direction: column; align-items: center; padding: 40px 30px; text-decoration: none; color: inherit; height: 100%; box-sizing: border-box; cursor: pointer;" onclick="localStorage.setItem('activeSystem', 'demo'); window.location.href='#/home'; window.location.reload(); return false;">
      <div style="margin-bottom: 20px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3)); font-size: 4.5rem; line-height: 1;">
        🚀
      </div>
      <h3 style="margin: 0; font-size: 1.6rem; font-weight: 800; letter-spacing: 0.02em; color: var(--accent-strong, #fff);">${t(state, "environments.demo")}</h3>
      <p style="margin: 8px 0 0 0; font-size: 0.95rem; color: var(--accent); font-weight: 600;">${t(state, "environments.demo_desc")}</p>
    </a>
  `;

  const demoPanel = UI.Panel({
    className: "country-card",
    style: "padding: 0; border-radius: 28px; transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); margin: 0 auto; max-width: 280px; width: 100%; position: relative; overflow: hidden; border: 2px solid var(--accent); background: rgba(88, 183, 255, 0.05);"
  }, `
    <div class="card-glow" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at top right, rgba(88, 183, 255, 0.25), transparent 60%); pointer-events: none;"></div>
    ${demoContent}
  `);

  const cardsFlex = UI.Flex({ gap: "24px", justify: "center", wrap: "wrap" }, finlandPanel + demoPanel);

  const contentArea = `
    <div style="max-width: 800px; width: 100%; animation: fade-in-up 0.8s ease-out;">
      <h2 style="font-size: 1.2rem; margin-bottom: 40px; color: var(--text); font-weight: 500; opacity: 0.8;">${t(state, "environments.kicker")}</h2>
      ${cardsFlex}
      <div style="margin-top: 40px;">
        <button type="button" class="button" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 24px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); border-radius: 999px; cursor: pointer; transition: all 0.2s; font-size: 0.95rem;" onclick="window.location.hash='#/landing'" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255,255,255,0.05)'; this.style.color='var(--text-muted)';">
          ${t(state, "environments.back")}
        </button>
      </div>
    </div>
  `;

  const footer = `
    <div style="margin-top: 60px; font-size: 0.85rem; color: var(--text-muted); opacity: 0.6; animation: fade-in-up 1s ease-out 0.5s both;">
      &copy; 2026 Jari Suorsa. All rights reserved.
    </div>
  `;

  const mainContainer = UI.Flex({
    direction: "column",
    align: "center",
    justify: "center",
    style: "min-height: 100vh; padding: 20px; text-align: center;"
  }, header + contentArea + footer);

  const watermark = `
    <div class="watermark-bg"></div>
  `;

  return watermark + mainContainer + `
    <style>
      .watermark-bg {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background-image: url('./src/assets/bf109g.png');
        background-position: center center;
        background-repeat: no-repeat;
        opacity: 0.15;
        z-index: -1;
        pointer-events: none;
      }
      
      @media (max-width: 768px) {
        .watermark-bg {
          background-size: 250vw auto;
          background-position: center 40%;
        }
      }
      @media (min-width: 769px) {
        .watermark-bg {
          background-size: 80vw auto;
        }
      }

      .country-card:hover {
        transform: translateY(-8px);
        border-color: rgba(130, 180, 255, 0.5);
        box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 20px rgba(88, 183, 255, 0.15);
        background: var(--panel-strong, rgba(20, 40, 70, 0.8));
      }
      
      .country-card:active {
        transform: translateY(-2px);
      }

      @keyframes fade-in-down {
        0% { opacity: 0; transform: translateY(-20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fade-in-up {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
    </style>
  `;
}

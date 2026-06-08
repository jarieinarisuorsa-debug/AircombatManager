import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { isAdmin, isUserAdmin } from "../../users/roles.js";
import { getRouteParam } from "../../router.js";
import { markThreadAsRead } from "./messageActions.js";

export function renderMessagesView(state) {
  const userIsAdmin = isAdmin(state); // Tämä on totta vain jos Aurinkotila on "Admin"
  let currentUserId = userIsAdmin ? "admin" : getMyPilotId(state);
  
  let isPreview = false;
  let simulatedPilotName = "";

  // Jos aito admin katsoo pilottinäkymää (mutta hänellä ei ole omaa pilottiprofiilia)
  if (!userIsAdmin && !currentUserId && isUserAdmin(state) && state.pilots?.length > 0) {
    currentUserId = state.pilots[0].id;
    isPreview = true;
    simulatedPilotName = state.pilots[0].name;
  }

  if (!userIsAdmin && !currentUserId) {
    return `<p class="muted">Sinulla ei ole aktiivista pilottiprofiilia. Viestittely vaatii pilottiprofiilin.</p>`;
  }

  // Merkitään kaikki luetuksi kun avataan viestiseinä
  markThreadAsRead(currentUserId);
  
  const headerHtml = isPreview ? `<div style="background: rgba(255,165,0,0.2); border: 1px solid orange; color: orange; padding: 10px; border-radius: 6px; margin-bottom: 20px; text-align: center;"><strong>Admin-esikatselu:</strong> Katsot viestiseinää toisena pilottina (${escapeHtml(simulatedPilotName)}). Voit testata viestien lähettämistä hänen nimissään.</div>` : '';
  
  return headerHtml + renderChatView(state, currentUserId);
}

export function getMyPilotId(state) {
  const email = state.auth?.user?.email || state.settings?.userEmail || "";
  const pilot = (state.pilots || []).find(p => p.email && p.email.toLowerCase().trim() === email.toLowerCase().trim());
  return pilot ? pilot.id : null;
}

function renderChatView(state, currentUserId) {
  const messages = state.messages || [];
  
  const msgHtml = messages.map(m => {
    const isMe = m.senderId === currentUserId;
    const dateObj = new Date(m.createdAt);
    const time = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Hae lähettäjän nimi
    let senderName = "Tuntematon";
    if (m.senderId === "admin") {
      senderName = "Järjestäjä";
    } else {
      senderName = state.pilots?.find(p => p.id === m.senderId)?.name || "Tuntematon";
    }

    const canDelete = isMe || isUserAdmin(state);
    const deleteBtn = canDelete ? `<button type="button" data-action="delete-message-prompt" data-message-id="${escapeHtml(m.id)}" class="button danger small" style="background: none; border: none; color: ${isMe ? 'rgba(255,255,255,0.7)' : 'var(--danger)'}; padding: 0; font-size: 0.75rem; cursor: pointer; text-decoration: underline;">Poista</button>` : '';

    const bubbleStyle = isMe 
      ? `background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #ffffff; padding: 10px 16px; border-radius: 18px 18px 4px 18px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25); border: none; font-size: 0.95rem; line-height: 1.4;`
      : `background: rgba(255, 255, 255, 0.06); color: var(--text); padding: 10px 16px; border-radius: 18px 18px 18px 4px; border: 1px solid rgba(255, 255, 255, 0.05); font-size: 0.95rem; line-height: 1.4;`;

    return `
      <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; margin-bottom: 18px; animation: fadeIn 0.3s ease;">
        ${!isMe ? `<div style="font-size: 0.75rem; color: var(--muted); margin-bottom: 4px; margin-left: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(senderName)}</div>` : ''}
        <div style="max-width: 85%; ${bubbleStyle}">
          ${escapeHtml(m.content)}
        </div>
        <div style="font-size: 0.7rem; color: var(--muted); margin-top: 6px; display: flex; align-items: center; gap: 12px;">
          <span>${time}</span>
          ${deleteBtn}
        </div>
      </div>
    `;
  }).join("");

  const formHtml = `
    <form data-action="send-message" style="display: flex; gap: 8px; margin-top: 15px; padding: 8px 4px; position: sticky; bottom: 0; z-index: 10; align-items: flex-end;">
      <div style="flex: 1; display: flex; align-items: center; background: var(--surface-2, rgba(255, 255, 255, 0.1)); backdrop-filter: blur(10px); border-radius: 24px; padding: 2px 16px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        <input type="text" name="content" placeholder="Viesti" required style="flex: 1; min-width: 0; background: transparent; border: none; color: var(--text); padding: 12px 0; outline: none; font-size: 1rem;" autocomplete="off" />
      </div>
      <button type="submit" class="button primary" style="width: 48px !important; height: 48px !important; min-height: 48px !important; padding: 0 !important; border-radius: 50% !important; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border: none; color: white; margin: 0; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: -2px; margin-top: 2px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </form>
  `;

  return UI.Panel({ kicker: "Viestit", title: "Yhteinen Keskustelu" }, `
    <style>
      @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    </style>
    <div id="chat-messages-container" style="max-height: 55vh; overflow-y: auto; padding: 10px 5px; display: flex; flex-direction: column; scroll-behavior: smooth;">
      ${msgHtml.length > 0 ? msgHtml : '<div class="muted" style="text-align: center; margin: 60px 0; font-size: 0.9rem;">Viestiseinä on tyhjä.<br><br><span style="font-size: 3rem; opacity: 0.2; display: block; margin-top: 10px;">💬</span></div>'}
    </div>
    ${formHtml}
  `);
}

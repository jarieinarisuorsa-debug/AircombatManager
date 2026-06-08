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

    return `
      <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; margin-bottom: 15px;">
        ${!isMe ? `<div style="font-size: 0.8rem; color: var(--muted); margin-bottom: 2px; margin-left: 5px;">${escapeHtml(senderName)}</div>` : ''}
        <div style="max-width: 85%; background: ${isMe ? 'var(--primary)' : 'var(--surface)'}; color: ${isMe ? 'white' : 'var(--text)'}; padding: 10px 15px; border-radius: 12px; border: ${isMe ? 'none' : '1px solid var(--border)'}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${escapeHtml(m.content)}
        </div>
        <div style="font-size: 0.75rem; color: var(--muted); margin-top: 4px; display: flex; align-items: center; gap: 10px;">
          <span>${time}</span>
          ${deleteBtn}
        </div>
      </div>
    `;
  }).join("");

  const formHtml = `
    <form data-action="send-message" style="display: flex; gap: 10px; margin-top: 20px; padding: 8px; border-radius: 30px; background: var(--bg); position: sticky; bottom: 0; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid var(--border);">
      <input type="text" name="content" placeholder="Kirjoita yhteiselle viestiseinälle..." required style="flex: 1; background: transparent; border: none; color: inherit; padding: 0 15px; outline: none; font-size: 0.95rem; width: 100%;" autocomplete="off" />
      <button type="submit" class="button primary" style="border-radius: 24px; padding: 10px 24px; margin: 0; white-space: nowrap;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: text-bottom;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        Lähetä
      </button>
    </form>
  `;

  return UI.Panel({ kicker: "Viestit", title: "Yhteinen Keskustelu" }, `
    <div id="chat-messages-container" style="max-height: 50vh; overflow-y: auto; padding: 10px; display: flex; flex-direction: column;">
      ${msgHtml.length > 0 ? msgHtml : '<div class="muted" style="text-align: center; margin: 40px 0;">Viestiseinä on tyhjä. Aloita keskustelu kirjoittamalla alle.</div>'}
    </div>
    ${formHtml}
  `);
}

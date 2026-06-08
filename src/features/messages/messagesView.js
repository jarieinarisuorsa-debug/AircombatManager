import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { isAdmin } from "../../users/roles.js";
import { getRouteParam } from "../../router.js";
import { markThreadAsRead } from "./messageActions.js";

export function renderMessagesView(state) {
  const userIsAdmin = isAdmin(state);
  const currentUserId = userIsAdmin ? "admin" : getMyPilotId(state);
  const messages = state.messages || [];

  if (userIsAdmin) {
    const pilots = state.pilots || [];
    const selectedPilotId = getRouteParam();

    if (selectedPilotId) {
      // Mark as read when opening chat
      markThreadAsRead("admin", selectedPilotId);
      return renderChatView(state, "admin", selectedPilotId);
    } else {
      return renderPilotListView(state, pilots, messages);
    }

  } else {
    if (!currentUserId) {
      return `<p class="muted">Sinulla ei ole aktiivista pilottiprofiilia. Viestittely vaatii pilottiprofiilin.</p>`;
    }
    // Mark as read when opening chat
    markThreadAsRead(currentUserId, "admin");
    return renderChatView(state, currentUserId, "admin");
  }
}

export function getMyPilotId(state) {
  const email = state.auth?.user?.email || state.settings?.userEmail || "";
  const pilot = (state.pilots || []).find(p => p.email && p.email.toLowerCase().trim() === email.toLowerCase().trim());
  return pilot ? pilot.id : null;
}

function renderPilotListView(state, pilots, messages) {
  const pilotStats = pilots.map(p => {
    const pilotMsgs = messages.filter(m => (m.senderId === p.id && m.receiverId === "admin") || (m.senderId === "admin" && m.receiverId === p.id));
    const unreadCount = pilotMsgs.filter(m => m.receiverId === "admin" && !m.read).length;
    const latestMsg = pilotMsgs.length > 0 ? pilotMsgs[pilotMsgs.length - 1] : null;
    return { pilot: p, unreadCount, latestMsg };
  });

  pilotStats.sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
    const timeA = a.latestMsg ? new Date(a.latestMsg.createdAt).getTime() : 0;
    const timeB = b.latestMsg ? new Date(b.latestMsg.createdAt).getTime() : 0;
    return timeB - timeA; // Uusin ensin
  });

  const listHtml = pilotStats.map(stat => `
    <a href="#/messages/${escapeHtml(stat.pilot.id)}" style="display: block; padding: 15px; border-bottom: 1px solid var(--border); text-decoration: none; color: inherit; background: ${stat.unreadCount > 0 ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent'};">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-weight: bold;">${escapeHtml(stat.pilot.name)}</div>
        ${stat.unreadCount > 0 ? `<div style="background: var(--danger); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;">${stat.unreadCount}</div>` : ''}
      </div>
      <div style="font-size: 0.85rem; color: var(--muted); margin-top: 5px;">
        ${stat.latestMsg ? escapeHtml(stat.latestMsg.content.substring(0, 50)) + (stat.latestMsg.content.length > 50 ? '...' : '') : 'Ei viestejä'}
      </div>
    </a>
  `).join("");

  return UI.Panel({ kicker: "Viestit", title: "Keskustelut pilottien kanssa" }, `
    <div style="margin: -15px;">
      ${listHtml.length > 0 ? listHtml : '<div style="padding: 15px;" class="muted">Ei pilotteja tai keskusteluja.</div>'}
    </div>
  `);
}

function renderChatView(state, currentUserId, otherUserId) {
  const messages = state.messages || [];
  const chatMsgs = messages.filter(m => 
    (m.senderId === currentUserId && m.receiverId === otherUserId) || 
    (m.senderId === otherUserId && m.receiverId === currentUserId)
  );

  const otherName = otherUserId === "admin" ? "Järjestäjä" : (state.pilots.find(p => p.id === otherUserId)?.name || "Tuntematon");

  const msgHtml = chatMsgs.map(m => {
    const isMe = m.senderId === currentUserId;
    const dateObj = new Date(m.createdAt);
    const time = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; margin-bottom: 15px;">
        <div style="max-width: 85%; background: ${isMe ? 'var(--primary)' : 'var(--surface)'}; color: ${isMe ? 'white' : 'var(--text)'}; padding: 10px 15px; border-radius: 12px; border: ${isMe ? 'none' : '1px solid var(--border)'}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${escapeHtml(m.content)}
        </div>
        <div style="font-size: 0.75rem; color: var(--muted); margin-top: 4px; display: flex; align-items: center; gap: 4px;">
          ${time} ${isMe && m.read ? '<span style="color: var(--primary);">✓✓</span>' : (isMe ? '✓' : '')}
        </div>
      </div>
    `;
  }).join("");

  const formHtml = `
    <form data-action="send-message" data-receiver="${escapeHtml(otherUserId)}" style="display: flex; gap: 10px; margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--border); background: var(--bg); position: sticky; bottom: -15px; padding-bottom: 15px; z-index: 10;">
      <input type="text" name="content" class="ui-input" placeholder="Kirjoita viesti..." required style="flex: 1; border-radius: 20px; padding: 10px 15px;" autocomplete="off" />
      <button type="submit" class="button primary" style="border-radius: 20px; padding: 10px 20px;">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px; vertical-align: text-bottom;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        Lähetä
      </button>
    </form>
  `;

  const headerHtml = currentUserId === "admin" ? `
    <div style="margin-bottom: 15px;">
      <a href="#/messages" class="button small dashed">← Takaisin listaan</a>
    </div>
  ` : '';

  // Viestilistan scrollToBottom hoidetaan CSS:n flex-direction: column-reverse tai JS scrollauksen kautta, 
  // Lisätään id containerille jotta main.js voi scrollata sen reitityksen yhteydessä.
  return `
    ${headerHtml}
    ${UI.Panel({ kicker: "Keskustelu", title: otherName }, `
      <div id="chat-messages-container" style="max-height: 50vh; overflow-y: auto; padding: 10px; display: flex; flex-direction: column;">
        ${msgHtml.length > 0 ? msgHtml : '<div class="muted" style="text-align: center; margin: 40px 0;">Ei aiempia viestejä. Aloita keskustelu kirjoittamalla alle.</div>'}
      </div>
      ${formHtml}
    `)}
  `;
}

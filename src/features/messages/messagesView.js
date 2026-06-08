import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { isAdmin, isUserAdmin, getCurrentRole, ROLE_LABELS } from "../../users/roles.js";
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

export function renderMessagesContent(state, currentUserId) {
  const messages = state.messages || [];
  
  if (messages.length === 0) {
    return '<div class="muted" style="text-align: center; margin: 60px 0; font-size: 0.9rem;">Viestiseinä on tyhjä.<br><br><span style="font-size: 3rem; opacity: 0.2; display: block; margin-top: 10px;">💬</span></div>';
  }
  
  return messages.map(m => {
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
    const deleteBtn = canDelete ? `<button type="button" data-action="delete-message-prompt" data-message-id="${escapeHtml(m.id)}" class="ui-text-danger ui-cursor-pointer" style="background: none; border: none; padding: 0; font-size: 0.7rem; text-decoration: underline;">Poista</button>` : '';

    const bubbleClass = isMe ? "ui-chat-bubble is-me" : "ui-chat-bubble is-other";

    return `
      <div class="${bubbleClass}">
        ${!isMe ? `<div class="ui-chat-bubble-header">${escapeHtml(senderName)}</div>` : ''}
        <div class="ui-text-base">${escapeHtml(m.content)}</div>
        <div class="ui-chat-bubble-footer">
          <span>${time}</span>
          ${deleteBtn}
        </div>
      </div>
    `;
  }).join("");
}

function renderChatView(state, currentUserId) {
  const msgHtml = renderMessagesContent(state, currentUserId);

  const formHtml = `
    <form data-action="send-message" data-no-feedback="true" class="ui-row ui-shrink-0 ui-chat-form">
      <div class="ui-grow ui-row ui-chat-input-wrapper">
        <input type="text" name="content" placeholder="Viesti" required class="ui-grow ui-chat-input" autocomplete="off" />
      </div>
      <button type="submit" class="ui-chat-send-btn">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: -2px; margin-top: 2px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </form>
  `;

  const adminClearBtn = isUserAdmin(state) ? `
    <button type="button" data-action="clear-all-messages-prompt" title="Tyhjennä viestiseinä" class="ui-shrink-0" style="
      margin-left: auto;
      background: rgba(255, 59, 48, 0.1);
      color: #ff3b30;
      border: 1px solid rgba(255, 59, 48, 0.2);
      border-radius: 8px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    " onmouseover="this.style.background='rgba(255, 59, 48, 0.2)'" onmouseout="this.style.background='rgba(255, 59, 48, 0.1)'">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      Tyhjennä
    </button>
  ` : '';

  const isDebug = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const showRoleSwitch = isDebug || isUserAdmin(state);
  const currentRole = getCurrentRole(state);
  
  const roleSelectOptions = Object.entries(ROLE_LABELS)
    .map(([value, label]) => `<option value="${value}" ${value === currentRole ? "selected" : ""}>${label}</option>`)
    .join("");

  const roleSelectHtml = showRoleSwitch ? `
    <label class="role-switch" style="margin: 0; display: flex; align-items: center; gap: 4px;">
      <select id="current-role-select" aria-label="Valitse käyttörooli" style="background: rgba(255,255,255,0.1); color: inherit; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 4px 8px; font-size: 0.85rem; cursor: pointer;">
        ${roleSelectOptions}
      </select>
    </label>
  ` : '';

  // Hyödynnämme Aircombat UI Engineä joustavan rakenteen luomiseen
  return `
    <div class="ui-chat-wrapper">
      <div class="ui-chat-header" style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; overflow: hidden;">
        <div class="ui-chat-header-title" style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Viestiseinä</div>
        <button id="theme-toggle-btn" class="button small ui-shrink-0" type="button" data-action="toggle-theme" title="Vaihda valoisuustilaa (Aurinkotila)" style="background: rgba(255,255,255,0.1); color: inherit; border: 1px solid rgba(255,255,255,0.2); font-size: 1.1rem; padding: 0; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">☀️</button>
        ${roleSelectHtml}
        ${adminClearBtn}
      </div>
      <div id="chat-messages-container" class="ui-grow ui-scroll-y ui-chat-messages">
        ${msgHtml}
      </div>
      ${formHtml}
    </div>
  `;
}

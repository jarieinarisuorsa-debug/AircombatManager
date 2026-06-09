import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { isAdmin, isUserAdmin, getCurrentRole, ROLE_LABELS } from "../../users/roles.js";
import { getRouteParam } from "../../router.js";
import { markThreadAsRead } from "./messageActions.js";
import { t } from "../../utils/i18n.js";

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
    return `<p class="muted">${t(state, "messages.no_pilot_profile")}</p>`;
  }

  // Merkitään kaikki luetuksi kun avataan viestiseinä
  markThreadAsRead(currentUserId);
  
  const headerHtml = isPreview ? `<div style="background: rgba(255,165,0,0.2); border: 1px solid orange; color: orange; padding: 10px; border-radius: 6px; margin-bottom: 20px; text-align: center;"><strong>${t(state, "messages.admin_preview")}</strong> ${t(state, "messages.admin_preview_desc").replace("{name}", escapeHtml(simulatedPilotName))}</div>` : '';
  
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
    return `<div class="muted" style="text-align: center; margin: 60px 0; font-size: 0.9rem;">${t(state, "messages.empty_wall")}<br><br><span style="font-size: 3rem; opacity: 0.2; display: block; margin-top: 10px;">💬</span></div>`;
  }
  
  return messages.map(m => {
    const isMe = m.senderId === currentUserId;
    const dateObj = new Date(m.createdAt);
    const time = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Hae lähettäjän nimi
    let senderName = t(state, "messages.unknown");
    if (m.senderId === "admin") {
      senderName = t(state, "messages.organizer");
    } else {
      senderName = state.pilots?.find(p => p.id === m.senderId)?.name || t(state, "messages.unknown");
    }

    const canDelete = isMe || isUserAdmin(state);
    const deleteBtn = canDelete ? `<button type="button" data-action="delete-message-prompt" data-message-id="${escapeHtml(m.id)}" class="ui-text-danger ui-cursor-pointer" style="background: none; border: none; padding: 0; font-size: 0.7rem; text-decoration: underline;">${t(state, "messages.delete")}</button>` : '';

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
        <input type="text" name="content" placeholder="${t(state, "messages.message_placeholder")}" required class="ui-grow ui-chat-input" autocomplete="off" enterkeyhint="send" />
      </div>
      <button type="submit" class="ui-chat-send-btn" data-no-loading-text="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: -2px; margin-top: 2px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </form>
  `;

  const adminClearBtn = isUserAdmin(state) ? `
    <button type="button" data-action="clear-all-messages-prompt" title="${t(state, "messages.clear_wall_title")}" class="ui-shrink-0 ui-chat-clear-btn">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      <span class="ui-chat-clear-text">${t(state, "messages.clear")}</span>
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
      <select id="current-role-select" aria-label="Valitse käyttörooli" class="ui-chat-role-select">
        ${roleSelectOptions}
      </select>
    </label>
  ` : '';

  // Hyödynnämme Aircombat UI Engineä joustavan rakenteen luomiseen
  return `
    <div class="ui-chat-wrapper">
      <div class="ui-chat-header ui-chat-header-flex">
        <div class="ui-chat-header-title ui-chat-title-shrink">${t(state, "messages.wall_title")}</div>
        <button id="theme-toggle-btn" class="ui-shrink-0 ui-chat-theme-btn" type="button" data-action="toggle-theme" title="${t(state, "messages.toggle_theme")}">☀️</button>
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

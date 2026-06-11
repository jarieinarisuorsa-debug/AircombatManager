import { escapeHtml } from "../../utils/html.js";
import { t } from "../../utils/i18n.js";
import { UI } from "../../ui/engine.js";
import { isUserAdmin } from "../../users/roles.js";

export function renderHomeView(state) {
  const isAdmin = isUserAdmin(state);
  const updates = state.settings?.systemUpdates || [];
  
  // Sort updates by date descending
  const sortedUpdates = [...updates].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Kicker & Title removed to avoid double banner
  const header = "";

  // Admin "Add Update" Button
  const adminActions = isAdmin ? `
    <div style="margin-bottom: 20px; display: flex; justify-content: flex-end;">
      ${UI.Button({ label: t(state, "home.new_update"), action: "toggle-system-update-form", variant: "primary" })}
    </div>
  ` : "";

  // Update Form
  const isEditing = state.settings?.isEditingSystemUpdate;
  let formHtml = "";
  if (isEditing && isAdmin) {
    const today = new Date().toISOString().split('T')[0];
    formHtml = UI.FormPanel({
      title: t(state, "home.add_update"),
      action: "save-system-update",
      className: "embedded-form-panel",
      style: "margin-bottom: 20px;"
    }, `
      <div style="margin-bottom: 15px;">
        ${UI.Input({ label: t(state, "home.date"), name: "date", type: "date", value: today, required: true })}
      </div>
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px;">${t(state, "home.content")}</label>
        <textarea name="content" required rows="5" style="width: 100%; box-sizing: border-box; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text-color); font-family: inherit; font-size: 1rem;" placeholder="${t(state, "home.content_placeholder")}"></textarea>
        <p class="muted" style="margin-top: 5px; font-size: 0.85rem;">${t(state, "home.formatting_hint")}</p>
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        ${UI.Button({ label: t(state, "common.cancel"), action: "toggle-system-update-form", variant: "small" })}
        ${UI.Button({ label: t(state, "common.save"), type: "submit", variant: "primary small" })}
      </div>
    `);
  }

  // Updates List
  let updatesHtml = `<p class="muted">${t(state, "home.no_updates")}</p>`;
  if (sortedUpdates.length > 0) {
    updatesHtml = sortedUpdates.map(up => {
      const dateStr = new Date(up.date).toLocaleDateString('fi-FI');
      const contentHtml = escapeHtml(up.content).replace(/\n/g, '<br>');
      
      const deleteBtn = isAdmin ? `
        <button type="button" data-action="delete-system-update" data-id="${escapeHtml(up.id)}" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 0.85rem; margin-left: 10px;" title="${t(state, "common.delete")}">🗑️ ${t(state, "common.delete")}</button>
      ` : "";

      return `
        <article style="background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
            <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary);">${t(state, "home.system_update")}</h3>
            <div style="display: flex; align-items: center;">
              <span class="badge" style="background: rgba(255,255,255,0.1); color: var(--text-color);">${escapeHtml(dateStr)}</span>
              ${deleteBtn}
            </div>
          </div>
          <div style="line-height: 1.6; color: var(--text-color);">
            ${contentHtml}
          </div>
        </article>
      `;
    }).join("");
  }

  const updatesPanel = UI.Panel({ 
    title: t(state, "home.system_updates"), 
    className: "full-width-panel"
  }, formHtml + updatesHtml);

  return `
    ${header}
    ${adminActions}
    ${updatesPanel}
  `;
}

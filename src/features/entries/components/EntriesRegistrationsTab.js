import { escapeHtml } from "../../../utils/html.js";
import { UI } from "../../../ui/engine.js";
import { t } from "../../../utils/i18n.js";

export function renderWorkspaceRegistrationsTab(state, activeEvent) {
  const registrations = state.registrations?.filter(r => r.eventId === activeEvent.id) || [];
  
  if (registrations.length === 0) {
    return UI.Panel({ title: t(state, "event_workspace.tab_registrations") }, `<p class='muted'>${t(state, "event_workspace.no_registrations")}</p>`);
  }

  // Sort: pending first, then newest first
  registrations.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const pendingCount = registrations.filter(r => r.status === 'pending').length;

  const listHtml = registrations.map(reg => {
    const pilot = state.pilots.find(p => p.id === reg.pilotId);
    if (!pilot) return "";

    const statusLabel = reg.status === "pending" ? t(state, "event_workspace.pending_approval") : (reg.status === "approved" ? t(state, "event_workspace.approved") : t(state, "event_workspace.rejected"));
    const statusColor = reg.status === "pending" ? "var(--warning, #fbbf24)" : (reg.status === "approved" ? "var(--success, #22c55e)" : "var(--danger, #ef4444)");
    const textColor = reg.status === "pending" ? "#000" : "#fff";
    
    // Convert to local time string if createdAt exists
    const timeStr = reg.createdAt ? new Date(reg.createdAt).toLocaleString(state.settings.language === 'fi' ? "fi-FI" : "en-US") : "";

    return `
      <div style="border: 1px solid var(--border); border-radius: 6px; padding: 15px; margin-bottom: 10px; background: rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
          <div>
            <h4 style="margin: 0 0 5px 0;">${escapeHtml(pilot.name)} <span class="badge" style="background: ${statusColor}; color: ${textColor}; font-size: 0.8rem; margin-left: 10px; padding: 3px 6px;">${statusLabel}</span></h4>
            <div class="muted" style="font-size: 0.9rem; margin-bottom: 8px;">
              ${escapeHtml(pilot.email || "-")} · ${escapeHtml(pilot.club || "-")} ${pilot.country ? UI.CountryFlag(pilot.country) : ""}
            </div>
            <div style="font-size: 0.95rem;">
              <strong>${t(state, "event_workspace.classes_label")}:</strong> ${reg.classes.map(escapeHtml).join(", ")}<br>
              <strong>${t(state, "event_workspace.payment_label")}:</strong> ${reg.paymentIntent === 'paid_in_advance' ? t(state, "event_workspace.paid_in_advance") : t(state, "event_workspace.paid_on_site")}<br>
              ${timeStr ? `<span class="muted" style="font-size: 0.85rem;">${t(state, "event_workspace.enrolled_at")}: ${timeStr}</span>` : ""}
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-direction: column; min-width: 150px;">
            ${reg.status === 'pending' ? `
              <button type="button" class="button success small" data-action="approve-registration" data-reg-id="${escapeHtml(reg.id)}">${t(state, "event_workspace.approve")}</button>
              <button type="button" class="button danger small" data-action="reject-registration" data-reg-id="${escapeHtml(reg.id)}">${t(state, "event_workspace.reject")}</button>
            ` : ""}
            ${reg.status === 'rejected' ? `
              <button type="button" class="button danger small" data-action="delete-registration" data-reg-id="${escapeHtml(reg.id)}">${t(state, "common.delete") || "Poista"}</button>
            ` : ""}
            <button type="button" class="button dashed small" data-action="open-pilot-card" data-pilot-id="${escapeHtml(pilot.id)}">${t(state, "event_workspace.open_pilot_card")}</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return UI.Panel({ kicker: t(state, "event_workspace.entire_event"), title: t(state, "event_workspace.queue_title").replace("{count}", pendingCount) }, listHtml);
}

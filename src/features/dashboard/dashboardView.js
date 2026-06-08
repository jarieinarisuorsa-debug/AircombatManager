import { isAdmin } from "../../users/roles.js";
import { renderAdminDashboard } from "./components/AdminDashboard.js";
import { renderPublicDashboard } from "./components/PublicDashboard.js";

export function renderDashboardView(state) {
  return isAdmin(state) ? renderAdminDashboard(state) : renderPublicDashboard(state);
}

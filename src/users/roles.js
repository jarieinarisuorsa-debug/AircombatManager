import { t } from "../utils/i18n.js";

// ==============================
// Aircombat Competition Manager
// src/users/roles.js
// Päivitetty: 2026-06-04
// ==============================

export const ROLES = {
  ADMIN: "admin",
  PILOT: "pilot",
  GUEST: "guest"
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.PILOT]: "Pilotti",
  [ROLES.GUEST]: "Vierailija"
};

export const ADMIN_ROUTE_KEYS = [
  "home",
  "calendar",
  "dashboard",
  "eventinfo",
  "entries",
  "pilots",
  "pilot",
  "aircraft",
  "heats",
  "scorecards",
  "scorecard",
  "documents",
  "results",
  "settings",
  "mapeditor",
  "myevent",
  "mypilotcard",
  "standings",
  "messages",
  "about"
];

export const PILOT_ROUTE_KEYS = [
  "home",
  "myevent",
  "calendar",
  "eventinfo",
  "dashboard",
  "mypilotcard",
  "heats",
  "scorecards",
  "scorecard",
  "documents",
  "results",
  "standings",
  "messages",
  "about"
];

export const GUEST_ROUTE_KEYS = [
  "home",
  "calendar",
  "eventinfo",
  "heats",
  "documents",
  "results",
  "standings",
  "login",
  "about"
];

export const ADMIN_NAV_ROUTE_KEYS = [
  "home",
  "calendar",
  "results",
  "entries",
  "pilots",
  "aircraft",
  "documents",
  "messages",
  "settings"
];

export const PILOT_NAV_ROUTE_KEYS = [
  "home",
  "myevent",
  "mypilotcard",
  "eventinfo",
  "calendar",
  "results",
  "messages"
];

export const GUEST_NAV_ROUTE_KEYS = [
  "home",
  "calendar",
  "eventinfo",
  "results"
];

export const NAV_LABELS = {
  admin: {
    home: "Etusivu",
    dashboard: "Tiedotteet",
    calendar: "Kilpailujen hallinta",
    eventinfo: "Kilpailun tiedot",
    entries: "Rakenna kilpailu",
    pilots: "Pilotit",
    aircraft: "Koneet",
    heats: "Heatit",
    scorecards: "Tuloskortit",
    documents: "Asiakirjat",
    results: "Kilpailutulokset",
    messages: "Viestit",
    settings: "Asetukset"
  },
  pilot: {
    home: "Etusivu",
    myevent: "Oma kilpailu",
    calendar: "Kisakalenteri",
    eventinfo: "Kilpailun tiedot",
    dashboard: "Kilpailu / tiedotteet",
    mypilotcard: "Oma pilottikortti",
    heats: "Heat-aikataulu",
    results: "Kilpailutulokset",
    messages: "Viestit"
  },
  guest: {
    home: "Etusivu",
    calendar: "Kisakalenteri",
    eventinfo: "Kilpailun tiedot",
    results: "Kilpailutulokset"
  }
};

export function isUserAdmin(state) {
  const email = state?.auth?.user?.email || state?.settings?.userEmail || "";
  if (!email) return false;

  // Supabase Permissions (Phase 3.5)
  if (state?.permissions) {
    const perm = state.permissions.find(p => p.email && String(p.email).toLowerCase().trim() === email.toLowerCase().trim());
    if (perm && perm.role && String(perm.role).toLowerCase().trim() === "admin") {
      return true;
    }
  }

  // Local fallback
  const admins = state?.settings?.adminEmails || ["admin@demo.fi"];
  return admins.some(a => String(a).toLowerCase().trim() === email.toLowerCase().trim());
}

export function isUserPilot(state) {
  const email = state?.auth?.user?.email || state?.settings?.userEmail || "";
  if (!email) return false;
  
  if (state?.permissions) {
    const perm = state.permissions.find(p => p.email && String(p.email).toLowerCase().trim() === email.toLowerCase().trim());
    if (perm && perm.role && String(perm.role).toLowerCase().trim() === "pilot") {
      return true;
    }
  }

  const inPilots = (state?.pilots || []).some(p => p.email && String(p.email).toLowerCase().trim() === email.toLowerCase().trim());
  return inPilots;
}

export function getCurrentRole(state) {
  const isDebug = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const userIsAdmin = isUserAdmin(state);
  
  if ((isDebug || userIsAdmin) && state?.settings?.currentRole) {
    if (state.settings.currentRole === ROLES.GUEST) return ROLES.GUEST;
    if (state.settings.currentRole === ROLES.PILOT) return ROLES.PILOT;
    if (state.settings.currentRole === ROLES.ADMIN && userIsAdmin) return ROLES.ADMIN;
  }
  
  // Tuotannossa rooli määräytyy pelkästään kirjautumisen ja sähköpostin perusteella
  const email = state?.auth?.user?.email;
  if (!email && !isDebug) return ROLES.GUEST;
  
  if (isUserAdmin(state)) return ROLES.ADMIN;
  if (isUserPilot(state)) return ROLES.PILOT;
  
  // Jos on kirjautunut mutta ei admin eikä pilotti, ollaan "guest" (rekisteröitymätön / ei oikeuksia)
  return ROLES.GUEST;
}

export function isAdmin(state) {
  return getCurrentRole(state) === ROLES.ADMIN;
}

export function requireAdmin(state) {
  if (!isAdmin(state)) throw new Error("Tämä toiminto on vain adminille.");
}

export function requirePilotAccess(state, pilotId) {
  if (isUserAdmin(state)) return;
  const pilot = state?.pilots?.find(p => p.id === pilotId);
  if (!pilot) throw new Error("Pilottia ei löytynyt.");
  
  const email = state?.auth?.user?.email || "";
  if (!email || !pilot.email || pilot.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
    throw new Error("Tämä toiminto on sallittu vain ylläpitäjälle tai oman profiilin omistajalle.");
  }
}

export function getAllowedRouteKeys(state) {
  const role = getCurrentRole(state);
  if (role === ROLES.ADMIN) return ADMIN_ROUTE_KEYS;
  if (role === ROLES.PILOT) return PILOT_ROUTE_KEYS;
  return GUEST_ROUTE_KEYS;
}

export function canUseRoute(state, routeKey) {
  if (routeKey === "login") return true;
  return getAllowedRouteKeys(state).includes(routeKey);
}

export function getDefaultRouteForRole(role) {
  return "home";
}

export function getNavRouteKeys(state) {
  const role = getCurrentRole(state);
  if (role === ROLES.ADMIN) return ADMIN_NAV_ROUTE_KEYS;
  if (role === ROLES.PILOT) return PILOT_NAV_ROUTE_KEYS;
  return GUEST_NAV_ROUTE_KEYS;
}

export function getNavItems(state) {
  return getNavRouteKeys(state).map((key) => ({
    key,
    label: t(state, `nav.${key}`)
  }));
}

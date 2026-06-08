// ==============================
// Aircombat Competition Manager
// src/ui/deviceLayout.js
// Päivitetty: 2026-06-04
// ==============================
// Runtime-laiteprofiili: PC, tabletti tai puhelin.
// Lisää bodyyn luokat ja data-attribuutit, joita yhteiset CSS-säännöt käyttävät.
// ==============================

const DEVICE_CLASSES = [
  "device-desktop",
  "device-tablet",
  "device-phone",
  "input-touch",
  "input-mouse",
  "orientation-portrait",
  "orientation-landscape"
];

let lastSignature = "";

export function getDeviceProfile() {
  const width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  const minSide = Math.min(width, height);
  const maxSide = Math.max(width, height);
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches || false;
  const noHover = window.matchMedia?.("(hover: none)")?.matches || false;
  const userAgent = navigator.userAgent || "";
  const uaTablet = /iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(userAgent);
  const uaPhone = /Mobi|Android.*Mobile|iPhone|iPod/i.test(userAgent);

  let type = "desktop";

  if (width <= 700 || uaPhone || (coarsePointer && minSide <= 600)) {
    type = "phone";
  } else if (width <= 1180 || uaTablet || (coarsePointer && maxSide <= 1400)) {
    type = "tablet";
  }

  const orientation = height >= width ? "portrait" : "landscape";
  const input = coarsePointer || noHover ? "touch" : "mouse";

  return {
    type,
    orientation,
    input,
    width,
    height,
    coarsePointer
  };
}

export function applyDeviceProfile() {
  const profile = getDeviceProfile();

  document.body.classList.remove(...DEVICE_CLASSES);
  document.body.classList.add(`device-${profile.type}`, `input-${profile.input}`, `orientation-${profile.orientation}`);

  document.body.dataset.device = profile.type;
  document.body.dataset.input = profile.input;
  document.body.dataset.orientation = profile.orientation;
  document.body.style.setProperty("--app-viewport-width", `${profile.width}px`);
  document.body.style.setProperty("--app-viewport-height", `${profile.height}px`);

  lastSignature = getSignature(profile);
  return profile;
}

export function watchDeviceProfile(onProfileChanged) {
  applyDeviceProfile();

  let resizeTimer = null;
  const update = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const previous = lastSignature;
      const profile = applyDeviceProfile();
      const next = getSignature(profile);
      if (previous !== next && typeof onProfileChanged === "function") {
        onProfileChanged(profile);
      }
    }, 120);
  };

  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", update);

  window.matchMedia?.("(pointer: coarse)")?.addEventListener?.("change", update);
  window.matchMedia?.("(hover: none)")?.addEventListener?.("change", update);
}

function getSignature(profile) {
  return `${profile.type}:${profile.orientation}:${profile.input}`;
}

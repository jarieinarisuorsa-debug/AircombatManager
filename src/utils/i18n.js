import { fi } from "./locales/fi.js";
import { en } from "./locales/en.js";

export const translations = {
  fi,
  en
};

export function t(state, key) {
  let lang = state?.settings?.language;
  if (!lang) {
    lang = localStorage.getItem("app_language") || "en";
  }
  return translations[lang]?.[key] || key;
}

export function getCurrentLanguage(state) {
  let lang = state?.settings?.language;
  if (!lang) {
    lang = localStorage.getItem("app_language") || "en";
  }
  return lang;
}

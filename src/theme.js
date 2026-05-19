const THEME_STORAGE_KEY = "chinale-theme";
const THEME_CHANGE_EVENT = "chinale-themechange";
const THEME_OPTIONS = new Set(["system", "light", "dark"]);

let mediaQuery = null;
let preference = readStoredPreference();

export function initTheme() {
  ensureMediaQuery();
  applyTheme();
}

export function getThemeState() {
  return {
    preference,
    resolved: resolveTheme(preference),
  };
}

export function setThemePreference(nextPreference) {
  preference = THEME_OPTIONS.has(nextPreference) ? nextPreference : "system";
  storePreference(preference);
  applyTheme();
}

export function subscribeTheme(listener) {
  window.addEventListener(THEME_CHANGE_EVENT, listener);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, listener);
}

function ensureMediaQuery() {
  if (mediaQuery || typeof window === "undefined" || !window.matchMedia) {
    return;
  }

  mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener?.("change", () => {
    if (preference === "system") {
      applyTheme();
    }
  });
}

function applyTheme() {
  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolved;
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: getThemeState() }));
}

function resolveTheme(currentPreference) {
  if (currentPreference !== "system") {
    return currentPreference;
  }

  ensureMediaQuery();
  return mediaQuery?.matches ? "dark" : "light";
}

function readStoredPreference() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_OPTIONS.has(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function storePreference(nextPreference) {
  try {
    if (nextPreference === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
      return;
    }

    localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
  } catch {
    // Local storage can be unavailable in private browsing or embedded contexts.
  }
}

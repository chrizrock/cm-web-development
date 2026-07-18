// main.js — theme toggle + sticky-nav scrolled state.
// Zero dependencies. The pre-paint script in <head> has already resolved and
// applied the initial data-theme before first paint (no flash); this module
// only reacts to user intent and keeps the toggle button's ARIA state in sync.

const root = document.documentElement;
const STORAGE_KEY = "theme";

/** Reflect the current theme onto the toggle button's ARIA + label. */
function syncToggle(btn, theme) {
  const isLight = theme === "light";
  // aria-pressed = "is the light theme engaged?"
  btn.setAttribute("aria-pressed", String(isLight));
  btn.setAttribute(
    "aria-label",
    isLight ? "Switch to dark theme" : "Switch to light theme"
  );
}

/** Apply a theme, persist the choice, and update the toggle. */
function applyTheme(btn, theme) {
  root.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    /* storage unavailable (private mode) — theme still applies for this session */
  }
  syncToggle(btn, theme);
}

function initThemeToggle() {
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;

  // The pre-paint script set data-theme; mirror it onto the (static) button.
  const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
  syncToggle(btn, current);

  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(btn, next);
  });
}

function initScrollState() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
}

function init() {
  initThemeToggle();
  initScrollState();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

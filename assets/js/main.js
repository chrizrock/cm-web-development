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

/** True when the user has asked the OS for less motion. Checked live (not
 * cached) since main.js only runs init once, but every motion feature below
 * consults this at its own setup time, which is enough — nothing here
 * re-evaluates after first paint. */
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scroll-reveal: an IntersectionObserver adds .is-revealed once per
 * [data-reveal] element the first time it enters the viewport, then
 * unobserves it (reveal never re-hides on scroll-back). Under
 * reduced-motion we skip the observer entirely and mark everything revealed
 * up front — matches the CSS override in styles.css. */
function initReveal() {
  const els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;

  if (prefersReducedMotion()) {
    els.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        obs.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );
  els.forEach((el) => observer.observe(el));
}

/** Living glow: every few seconds, nudge each .section--anchor's
 * --glow-x/--glow-y/--glow-scale custom properties to a new small random
 * offset. The long CSS transition (styles.css) turns these discrete steps
 * into a slow, ambient drift — cheaper than a per-frame rAF loop, and it's
 * transform-only so it never touches layout. Skipped entirely under
 * reduced-motion (the properties are simply never set). */
function initHeroGlow() {
  if (prefersReducedMotion()) return;
  const anchors = document.querySelectorAll(".section--anchor");
  if (!anchors.length) return;

  const drift = () => {
    for (const el of anchors) {
      const x = (Math.random() * 28 - 14).toFixed(1) + "px";
      const y = (Math.random() * 18 - 9).toFixed(1) + "px";
      const scale = (1 + Math.random() * 0.06).toFixed(3);
      el.style.setProperty("--glow-x", x);
      el.style.setProperty("--glow-y", y);
      el.style.setProperty("--glow-scale", scale);
    }
  };
  drift();
  setInterval(drift, 9000);
}

/** Magnetic hover: primary CTAs and cards nudge a few px toward the pointer
 * as it moves over them, and spring back on pointerleave. transform-only,
 * reuses each element's existing transition (see .btn / .card in
 * styles.css) for the spring-back smoothing. Skipped under reduced-motion. */
function initMagnetic() {
  if (prefersReducedMotion()) return;
  const targets = document.querySelectorAll(".btn--primary, .card");
  if (!targets.length) return;

  const STRENGTH = 0.25;
  const MAX_OFFSET = 10; // px

  targets.forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return; // no magnetic on touch
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      const x = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relX * STRENGTH));
      const y = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relY * STRENGTH));
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transform = "";
    });
  });
}

/** Before/after wipe (Task 6): for each [data-beforeafter] container, wires
 * pointer drag on the frame(s), the keyboard-accessible [data-beforeafter-range]
 * input, and an optional [data-beforeafter-toggle] snap button — all three
 * just set the same `--wipe` custom property (0-100, a percentage) on the
 * container, which styles.css uses to clip [data-beforeafter-after] via
 * clip-path. [data-beforeafter-static] (new-build projects, no "before" to
 * compare against) is left completely alone — components.mjs never gives it
 * a range/toggle/data-beforeafter, so querying for those hooks inside it
 * would simply find nothing.
 *
 * Reduced-motion note: the wipe's clip-path transition is killed globally by
 * the `*, *::before, *::after { transition-duration: 0.001ms !important }`
 * rule in styles.css's reduced-motion block, so drag/keyboard/toggle all
 * snap under reduced-motion with no special-casing needed here. */
function initBeforeAfter() {
  const widgets = document.querySelectorAll("[data-beforeafter]");
  if (!widgets.length) return;

  widgets.forEach((widget) => {
    const range = widget.querySelector("[data-beforeafter-range]");
    const toggle = widget.querySelector("[data-beforeafter-toggle]");
    const frames = widget.querySelectorAll(".before-after-frame");
    if (!frames.length) return;

    /** Clamp to [0,100], write --wipe, and keep the range + its
     * aria-valuetext in sync so keyboard/AT users get the same state as a
     * pointer drag. */
    const setWipe = (pct) => {
      const clamped = Math.max(0, Math.min(100, pct));
      const rounded = Math.round(clamped);
      widget.style.setProperty("--wipe", `${clamped}%`);
      if (range) {
        range.value = String(rounded);
        range.setAttribute("aria-valuetext", `${rounded}% after, ${100 - rounded}% before`);
      }
      return clamped;
    };

    // Sensible default: both before and after read clearly on load.
    setWipe(55);

    // -- Pointer drag (mouse + touch, via the Pointer Events API) ----------
    let activeFrame = null;
    const pctFromEvent = (e, frame) => {
      const rect = frame.getBoundingClientRect();
      if (!rect.width) return 0;
      return ((e.clientX - rect.left) / rect.width) * 100;
    };

    frames.forEach((frame) => {
      frame.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        activeFrame = frame;
        // setWipe first: setPointerCapture can throw (e.g. an id the browser
        // doesn't consider active) and must never block the visual update a
        // click/tap-down is supposed to produce.
        setWipe(pctFromEvent(e, frame));
        try {
          frame.setPointerCapture(e.pointerId);
        } catch (err) {
          /* capture is a nice-to-have (keeps the drag tracking outside the
             frame's bounds) — the pointermove listener below still works
             without it as long as the pointer stays over the frame. */
        }
      });
      frame.addEventListener("pointermove", (e) => {
        if (activeFrame !== frame) return; // not the frame currently being dragged
        setWipe(pctFromEvent(e, frame));
      });
      const endDrag = (e) => {
        if (activeFrame !== frame) return;
        try {
          if (frame.hasPointerCapture(e.pointerId)) frame.releasePointerCapture(e.pointerId);
        } catch (err) {
          /* nothing to release — already ignored at capture time above */
        }
        activeFrame = null;
      };
      frame.addEventListener("pointerup", endDrag);
      frame.addEventListener("pointercancel", endDrag);
    });

    // -- Keyboard-accessible range input ------------------------------------
    if (range) {
      range.addEventListener("input", () => setWipe(Number(range.value)));
    }

    // -- Optional before/after snap toggle -----------------------------------
    if (toggle) {
      toggle.addEventListener("click", () => {
        const next = toggle.getAttribute("aria-pressed") !== "true";
        toggle.setAttribute("aria-pressed", String(next));
        setWipe(next ? 100 : 0);
      });
    }
  });
}

/** Accessible mobile nav: hamburger toggle -> slide-in panel with a focus
 * trap, Esc-to-close (returns focus to the toggle), backdrop/link-click to
 * close, and a scrollbar-aware body-scroll lock (no CLS). Honors
 * reduced-motion via the CSS override in styles.css (snaps instead of
 * sliding) — no separate JS branch is needed since the same open/close
 * logic just skips the animation visually. */
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const panel = document.getElementById("mobile-nav");
  const overlay = document.querySelector("[data-nav-overlay]");
  if (!toggle || !panel || !overlay) return;

  let isOpen = false;
  let scrollLockPad = "";

  const focusableSelector =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const getFocusable = () =>
    Array.from(panel.querySelectorAll(focusableSelector));

  const lockScroll = () => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    scrollLockPad = document.body.style.paddingRight;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";
  };
  const unlockScroll = () => {
    document.body.style.overflow = "";
    document.body.style.paddingRight = scrollLockPad;
  };

  const onKeydown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  function open() {
    if (isOpen) return;
    isOpen = true;
    panel.removeAttribute("inert");
    panel.classList.add("is-open");
    overlay.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    lockScroll();
    document.addEventListener("keydown", onKeydown);
    const focusable = getFocusable();
    (focusable[0] || panel).focus();
  }

  function close({ returnFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove("is-open");
    overlay.classList.remove("is-open");
    panel.setAttribute("inert", "");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    unlockScroll();
    document.removeEventListener("keydown", onKeydown);
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener("click", () => (isOpen ? close() : open()));
  overlay.addEventListener("click", () => close());
  panel.addEventListener("click", (e) => {
    if (e.target.closest("a")) close({ returnFocus: false });
  });

  // Crossing back to desktop width while open (e.g. rotating a tablet)
  // shouldn't leave the panel open and scroll locked underneath it.
  const desktopQuery = window.matchMedia("(min-width: 721px)");
  const onBreakpointChange = (e) => {
    if (e.matches) close({ returnFocus: false });
  };
  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener("change", onBreakpointChange);
  } else if (desktopQuery.addListener) {
    // Safari < 14
    desktopQuery.addListener(onBreakpointChange);
  }
}

function init() {
  initThemeToggle();
  initScrollState();
  initReveal();
  initHeroGlow();
  initMagnetic();
  initMobileNav();
  initBeforeAfter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

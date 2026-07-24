// main.js — theme toggle + sticky-nav scrolled state.
// Zero dependencies. The pre-paint script in <head> has already resolved and
// applied the initial data-theme before first paint (no flash); this module
// only reacts to user intent and keeps the toggle button's ARIA state in sync.

const root = document.documentElement;
const STORAGE_KEY = "theme";

/** Widest viewport that still uses the hamburger + slide-in mobile nav.
 * Mirrors `@media (max-width: 959px)` in styles.css — the width below which
 * the full desktop header (logo + nav + CTA + toggle) no longer fits on one
 * line. The two must move together. */
const MOBILE_NAV_MAX = 959;

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

/** Hero build sequence: the code types itself in and the page assembles
 * beside it, once, the first time the hero enters the viewport — then it
 * holds still permanently.
 *
 * The CSS default is the finished, fully-rendered result; the sequence only
 * exists under [data-flow="play"]. So if this never runs (no JS, JS error,
 * reduced-motion) the visitor still gets the complete static picture instead
 * of an empty frame. That's why the attribute is added here rather than
 * authored into the markup. */
function initHeroFlow() {
  const stage = document.querySelector(".hero-build-stage");
  if (!stage) return;

  // Reduced-motion: leave the attribute off. CSS then renders the resolved
  // end-state with no animation at all.
  if (prefersReducedMotion()) return;

  const play = () => stage.setAttribute("data-flow", "play");

  // The hero is above the fold on load, so IntersectionObserver would fire
  // immediately anyway — but observing keeps the behaviour correct if the
  // page is restored mid-scroll (back/forward nav, deep link, refresh).
  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        play();
        obs.unobserve(entry.target);
      }
    },
    { threshold: 0.2 }
  );
  observer.observe(stage);
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
// Wires ONE [data-beforeafter] widget: pointer drag, keyboard range, and the
// optional snap toggle. Pulled out of initBeforeAfter() so
// initWorkFeaturedRandom() (below) can wire the same interaction onto a
// widget it builds after DOMContentLoaded (a randomly-picked project cloned
// into the work page's featured slot) without duplicating this logic.
function wireBeforeAfterWidget(widget) {
    const range = widget.querySelector("[data-beforeafter-range]");
    const toggle = widget.querySelector("[data-beforeafter-toggle]");
    const frames = widget.querySelectorAll(".before-after-frame");
    if (!frames.length) return;

    /** Clamp to [0,100], write --wipe, and keep the range + its
     * aria-valuetext in sync so keyboard/AT users get the same state as a
     * pointer drag. --wipe is stored in `cqi` (see styles.css) so the wipe
     * handle can track it with `transform` instead of `left`; cqi and `%`
     * are numerically equivalent fractions of the frame's own width here,
     * so this doesn't change what the number means. */
    const setWipe = (pct) => {
      const clamped = Math.max(0, Math.min(100, pct));
      const rounded = Math.round(clamped);
      widget.style.setProperty("--wipe", `${clamped}cqi`);
      if (range) {
        range.value = String(rounded);
        range.setAttribute("aria-valuetext", `${rounded}% after, ${100 - rounded}% before`);
      }
      return clamped;
    };

    /** Read whatever wipe state the widget already carries -- the inline
     * --wipe components.mjs renders, falling back to the range's own value,
     * falling back to 50 -- instead of guessing. Used only at init: init
     * must SYNC from existing state, never FORCE a value, or writing a
     * different number than what's already showing would move --wipe and
     * fire the after-layer's clip-path transition as an unrequested wipe
     * animation on load. */
    const currentWipe = () => {
      const inline = widget.style.getPropertyValue("--wipe").trim();
      const parsed = inline ? parseFloat(inline) : NaN;
      if (!Number.isNaN(parsed)) return parsed;
      if (range) {
        const rangeVal = Number(range.value);
        if (!Number.isNaN(rangeVal)) return rangeVal;
      }
      return 50;
    };

    // Sync the handle/aria FROM the widget's existing resting state --
    // components.mjs already rendered --wipe (and the range's value) at
    // 50, so this is a no-op write (same value in, same value out) rather
    // than a value change, and no transition fires.
    setWipe(currentWipe());

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
        if (e.buttons === 0) {
          // No button is actually held: pointerup was missed (e.g. it fired
          // outside the frame after setPointerCapture threw above), so this
          // and every future pointermove would otherwise be misread as a
          // drag. Self-heal by ending the drag instead of moving --wipe.
          endDrag(e);
          return;
        }
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
      frame.addEventListener("lostpointercapture", endDrag);
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
}

/** Finds every [data-beforeafter] widget currently in the document and wires
 * each one via wireBeforeAfterWidget(). Runs once at init; the work page's
 * randomly-cloned featured widget (initWorkFeaturedRandom(), below) is wired
 * separately at the point it's inserted, since it doesn't exist yet here. */
function initBeforeAfter() {
  const widgets = document.querySelectorAll("[data-beforeafter]");
  if (!widgets.length) return;
  widgets.forEach(wireBeforeAfterWidget);
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
  //
  // Must match the max-width: 959px rule in styles.css that swaps the desktop
  // nav for this hamburger. If the two drift, there's a band of widths where
  // the panel stays open behind a visible desktop nav, or closes while the
  // hamburger is still the only way to navigate.
  const desktopQuery = window.matchMedia(`(min-width: ${MOBILE_NAV_MAX + 1}px)`);
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

/** Work-page filters (Task 8): clicking a pill narrows the full project
 * grid to that data-type, updates aria-pressed across the button group, and
 * updates the live "Showing N of total" counter ([data-count]). Guarded on
 * [data-work-filters]/[data-work-grid] so every page but work.html is a
 * no-op — main.js stays error-free everywhere. Real <button>s get Enter/
 * Space for free, so no extra keyboard wiring is needed. Toggling a
 * .hidden (display:none) class is intentional, not a motion violation:
 * this is user-initiated show/hide from a click, not scroll-driven motion,
 * and it never touches the before/after widgets living inside each still-
 * visible card (initBeforeAfter already wired those independently). */
function initWorkFilters() {
  const bar = document.querySelector("[data-work-filters]");
  const grid = document.querySelector("[data-work-grid]");
  if (!bar || !grid) return;

  const buttons = Array.from(bar.querySelectorAll("[data-filter]"));
  const counter = bar.querySelector("[data-count]");
  const cards = Array.from(grid.querySelectorAll("[data-type]"));
  const total = cards.length;

  const applyFilter = (type) => {
    let shown = 0;
    cards.forEach((card) => {
      const match = type === "all" || card.dataset.type === type;
      card.classList.toggle("hidden", !match);
      if (match) shown += 1;
    });
    if (counter) counter.textContent = `Showing ${shown} of ${total}`;
  };

  const activate = (btn) => {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    applyFilter(btn.dataset.filter);
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.getAttribute("aria-pressed") === "true") return; // already active
      activate(btn);
    });
  });

  // Deep link: work.html#type=Redesign lands with that filter already applied.
  // The Services page proof links point here, so "11 of the 17 projects here
  // are rebuilds" arrives showing those 11 rather than dumping the visitor on
  // the unfiltered grid to find them.
  //
  // Hash is checked as well as ?type= because hosts serving clean URLs (the
  // local `serve`, Netlify/Vercel pretty URLs) 301 work.html -> /work and drop
  // the query string; the fragment survives that redirect. Query wins when
  // both are present, since it's the more explicit of the two.
  //
  // An unknown or absent value is ignored, so a stale link degrades to the
  // full grid rather than an empty one.
  const fromHash = decodeURIComponent(location.hash.replace(/^#type=/, ""));
  const wanted =
    new URLSearchParams(location.search).get("type") ||
    (location.hash.startsWith("#type=") ? fromHash : null);
  if (wanted) {
    const match = buttons.find((b) => b.dataset.filter === wanted);
    if (match) activate(match);
  }
}

/** Work-page featured tier: exactly ONE project, picked at random on every
 * load. Guarded on [data-work-featured] so this is a no-op on every page but
 * work.html. work.mjs server-renders a sensible default (the first
 * featured:true project) in that slot for a no-JS visitor; here we replace
 * it with a random pick from the FULL 17-project pool.
 *
 * Performance note: this deliberately does NOT server-render all 17 featured
 * blocks and hide 16 of them — that would mean shipping 16 extra heavy
 * before/after image pairs nobody sees. Instead it clones the already-
 * present, already-lazy-loaded grid card for the chosen project (the full
 * grid below is unchanged and always renders all 17 at grid size), re-sizes
 * that clone to the featured treatment (swaps the `--grid` size classes for
 * `--featured`, which only changes CSS — same image `src`s either way), and
 * re-wires its before/after wipe via wireBeforeAfterWidget() since the
 * clone is new DOM initBeforeAfter() never saw. The featured badge
 * (".work-featured-grid .project-card--featured::before" in styles.css) and
 * the larger frame styling apply automatically off the swapped classes —
 * no extra CSS needed. */
function initWorkFeaturedRandom() {
  const slot = document.querySelector("[data-work-featured]");
  const grid = document.querySelector("[data-work-grid]");
  if (!slot || !grid) return;

  const cards = Array.from(grid.querySelectorAll(".project-card"));
  if (!cards.length) return;

  const pick = cards[Math.floor(Math.random() * cards.length)];
  const clone = pick.cloneNode(true);

  // The grid card being cloned lives far down the page, well below the
  // fold — initReveal()'s IntersectionObserver hasn't seen it intersect yet,
  // so it (and its own [data-reveal]) never picked up .is-revealed. A plain
  // cloneNode(true) copies that "not yet revealed" state (opacity:0) as-is,
  // and since this clone is never itself observed, it would stay invisible
  // forever. Force it (and any nested [data-reveal]) revealed immediately —
  // the featured pick must be visible without waiting on scroll.
  clone.classList.add("is-revealed");
  clone.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-revealed"));

  // Grid card -> featured card: swap the size classes only (same images).
  clone.classList.add("project-card--featured");
  const beforeAfterEl = clone.querySelector(".before-after");
  if (beforeAfterEl) {
    beforeAfterEl.classList.remove("before-after--grid");
    beforeAfterEl.classList.add("before-after--featured");
  }

  // The clone carries the SAME range id/label-for as the grid card it was
  // copied from (now duplicated in the document) — rewrite both to a unique
  // id so the <label for> keeps pointing at its own input rather than the
  // grid's.
  const range = clone.querySelector("[data-beforeafter-range]");
  if (range && range.id) {
    const uniqueId = `${range.id}-featured-pick`;
    const label = clone.querySelector(`label[for="${range.id}"]`);
    range.id = uniqueId;
    if (label) label.setAttribute("for", uniqueId);
  }

  slot.replaceChildren(clone);

  // The clone's [data-beforeafter] (if this project has a before/after
  // wipe — new-build projects don't) was never seen by initBeforeAfter()'s
  // querySelectorAll, since it didn't exist yet: wire it now so the
  // featured pick is fully interactive.
  const widget = clone.querySelector("[data-beforeafter]");
  if (widget) wireBeforeAfterWidget(widget);
}

/** Contact form (Task 11): client-side validation + an async Formspree
 * submit with inline success/error states, honoring the honeypot — all as
 * an enhancement layered on top of the plain action=…/method=POST form
 * contact.mjs already renders. Guarded on [data-contact-form] so this is a
 * total no-op on every page but contact.html.
 *
 * Progressive enhancement contract: nothing here runs until this function
 * executes, so a no-JS visitor gets the native fallback — real HTML5
 * required/type=email validation (novalidate is added below, not in the
 * static markup, precisely so it's absent when JS never runs) and a normal
 * synchronous POST straight to Formspree, which redirects to Formspree's
 * own hosted confirmation page. Once JS *does* run, novalidate suppresses
 * those native browser bubbles so the custom inline errors below are the
 * only validation UI a visitor sees, and preventDefault() swaps the
 * synchronous POST for the async fetch + inline success/error states.
 */
function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const submitBtn = form.querySelector("[data-form-submit]");
  const status = form.querySelector("[data-form-status]");
  const honeypot = form.elements["_gotcha"];

  form.setAttribute("novalidate", "");

  // One rule per required field; keyed by `name` so it lines up with
  // form.elements lookups below. `pattern`/`invalidMessage` are only
  // present on email (empty vs. malformed get distinct copy).
  const FIELD_RULES = {
    name: { message: "Please enter your name." },
    email: {
      message: "Please enter your email address.",
      invalidMessage: "Please enter a valid email address.",
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    project_type: { message: "Please choose a project type." },
    message: { message: "Please enter a message." },
  };

  const errorFor = (field) => form.querySelector(`#${field.id}-error`);

  const setFieldError = (field, message) => {
    field.setAttribute("aria-invalid", message ? "true" : "false");
    const errorEl = errorFor(field);
    if (errorEl) errorEl.textContent = message || "";
  };

  const validateField = (name) => {
    const field = form.elements[name];
    const rule = FIELD_RULES[name];
    if (!field || !rule) return true;
    const value = field.value.trim();
    if (!value) {
      setFieldError(field, rule.message);
      return false;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      setFieldError(field, rule.invalidMessage);
      return false;
    }
    setFieldError(field, "");
    return true;
  };

  const validateAll = () => {
    let valid = true;
    let firstInvalid = null;
    for (const name of Object.keys(FIELD_RULES)) {
      const ok = validateField(name);
      if (!ok) {
        valid = false;
        if (!firstInvalid) firstInvalid = form.elements[name];
      }
    }
    return { valid, firstInvalid };
  };

  // Re-validate a field on blur so an error clears the moment it's fixed,
  // rather than only ever being checked at submit time.
  Object.keys(FIELD_RULES).forEach((name) => {
    const field = form.elements[name];
    if (field) field.addEventListener("blur", () => validateField(name));
  });

  const setStatus = (kind, message) => {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("form-status--success", "form-status--error");
    if (kind) status.classList.add(`form-status--${kind}`);
  };

  const setSending = (isSending) => {
    if (!submitBtn) return;
    submitBtn.disabled = isSending;
    submitBtn.setAttribute("aria-busy", String(isSending));
    submitBtn.textContent = isSending ? "Sending…" : "Send message";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot: a real visitor never fills this (it's aria-hidden and out
    // of tab order); a filled value means something auto-filled every
    // input on the page. Report success without sending anything, so
    // there's no observable difference for the bot to learn from.
    if (honeypot && honeypot.value) {
      form.reset();
      setStatus("success", "Thanks — your message is on its way.");
      return;
    }

    const { valid, firstInvalid } = validateAll();
    if (!valid) {
      setStatus("error", "Please fix the highlighted fields and try again.");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    setSending(true);
    setStatus(null, "");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        form.reset();
        setStatus("success", "Thanks — your message is on its way. I usually reply within a day.");
      } else {
        setStatus("error", "Something went wrong sending that. Please try again, or email directly.");
      }
    } catch (err) {
      // Network failure (offline, blocked request, etc.) — same inline
      // error path as a non-OK response.
      setStatus("error", "Something went wrong sending that. Please try again, or email directly.");
    } finally {
      setSending(false);
    }
  });
}

function init() {
  initThemeToggle();
  initScrollState();
  initReveal();
  initHeroFlow();
  initHeroGlow();
  initMagnetic();
  initMobileNav();
  initBeforeAfter();
  // Runs after initBeforeAfter(): it swaps the server-rendered default
  // featured widget out for a random pick and wires the replacement itself,
  // so the default is never double-wired first.
  initWorkFeaturedRandom();
  initWorkFilters();
  initContactForm();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

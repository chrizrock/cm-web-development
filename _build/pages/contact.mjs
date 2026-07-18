// Contact page (Task 11) — the working Formspree form. Composes: an
// intro/hero (open-to-work framing, an availability + response-time note),
// the form itself (name/email/project type/message + an accessibly-hidden
// honeypot, posting straight to the real Formspree endpoint below), a
// direct-channels grid sourced from site.json.contact (email/WhatsApp/
// Discord/GitHub/location). Receives ALREADY entity-decoded data ({ site } — see the data note in
// components.mjs). Sections carry data-reveal individually per the brief.
//
// Progressive enhancement: the <form> below is a plain
// action="…" method="POST" element — it works with zero JS, posting a
// normal application/x-www-form-urlencoded submission straight to
// Formspree and letting Formspree's own hosted "thank you" page take over.
// assets/js/main.js's initContactForm() only enhances this: it intercepts
// submit, adds novalidate itself (not in this markup — see the comment in
// main.js), runs inline validation, and does an async fetch instead. If JS
// never runs, none of that wiring exists and the native fallback above is
// exactly what fires.
import { html, raw, attr } from "../lib/render.mjs";
import { section } from "../partials/components.mjs";

// The real, live Formspree endpoint for this form (not a placeholder).
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mnjepezn";

const PROJECT_TYPES = [
  "New build",
  "Rebuild or redesign",
  "E-commerce or cart upgrade",
  "WordPress care",
  "Something else",
];

/**
 * textField({ id, name, label, type, autocomplete }) -> one labeled text/
 * email input + its (initially empty) inline error paragraph. The error
 * paragraph's id is wired via aria-describedby so a screen reader announces
 * it alongside the field the moment main.js populates it; role="alert"
 * means that population is itself announced (an assertive live region),
 * with no separate aria-live attribute needed.
 */
function textField({ id, name, label, type = "text", autocomplete }) {
  const errorId = `${id}-error`;
  return html`<div class="form-field">
  <label class="form-label" for="${id}">${label} <span class="form-required" aria-hidden="true">*</span></label>
  <input class="form-input" type="${type}" id="${id}" name="${name}" required
    aria-required="true" aria-describedby="${errorId}"${raw(attr({ autocomplete }))} />
  <p class="form-error" id="${errorId}" role="alert"></p>
</div>`;
}

/**
 * selectField({ id, name, label, options }) -> the project-type <select>,
 * same label/error/aria wiring as textField. The empty first option is
 * disabled so it can't be re-selected once a real choice is made, and
 * `required` blocks submitting it as the empty default (native fallback)
 * or against main.js's own validation.
 */
function selectField({ id, name, label, options }) {
  const errorId = `${id}-error`;
  const optionItems = options.map((opt) => html`<option value="${opt}">${opt}</option>`);
  return html`<div class="form-field">
  <label class="form-label" for="${id}">${label} <span class="form-required" aria-hidden="true">*</span></label>
  <select class="form-input form-select" id="${id}" name="${name}" required
    aria-required="true" aria-describedby="${errorId}">
    <option value="" disabled selected>Choose one…</option>
    ${optionItems}
  </select>
  <p class="form-error" id="${errorId}" role="alert"></p>
</div>`;
}

/** textareaField({ id, name, label }) -> the message field, same pattern. */
function textareaField({ id, name, label }) {
  const errorId = `${id}-error`;
  return html`<div class="form-field">
  <label class="form-label" for="${id}">${label} <span class="form-required" aria-hidden="true">*</span></label>
  <textarea class="form-input form-textarea" id="${id}" name="${name}" rows="6" required
    aria-required="true" aria-describedby="${errorId}"></textarea>
  <p class="form-error" id="${errorId}" role="alert"></p>
</div>`;
}

/**
 * honeypotField() -> the spam trap. Real users never see or reach it:
 * .sr-only clips it out of the visual layout (not display:none, which some
 * bots skip), aria-hidden="true" removes the whole thing from the
 * accessibility tree so screen-reader users never land on it either, and
 * tabindex="-1" plus autocomplete="off" keep it out of keyboard tab order
 * and browser autofill. A simple bot that blindly fills every input still
 * fills this one — main.js checks it and no-ops the "submission."
 */
function honeypotField() {
  return html`<div class="sr-only" aria-hidden="true">
  <label for="cf-gotcha">Leave this field blank</label>
  <input type="text" id="cf-gotcha" name="_gotcha" tabindex="-1" autocomplete="off" />
</div>`;
}

/**
 * channelCard({ label, value, href, external }) -> one direct-channel tile.
 * href is omitted for Discord (a handle, not a link); external adds
 * target=_blank + rel=noopener noreferrer for the two channels that
 * navigate off-site (WhatsApp, GitHub) — mailto: stays same-tab like every
 * other mailto link on the site.
 */
function channelCard({ label, value, href, external = false }) {
  const valueEl = href
    ? html`<a class="channel-value" href="${href}"${raw(
        external ? ' target="_blank" rel="noopener noreferrer"' : ""
      )}>${value}</a>`
    : html`<span class="channel-value">${value}</span>`;
  return html`<div class="card channel-card" data-reveal>
  <p class="channel-label">${label}</p>
  ${valueEl}
</div>`;
}

export default function contact({ site }) {
  const { contact, meta } = site;

  // -- 1. INTRO/HERO: open-to-work framing + availability/response note ----
  const intro = html`<section class="section section--anchor contact-intro" data-reveal>
  <div class="container contact-intro-inner">
    <p class="eyebrow">${meta.siteName} &middot; Contact</p>
    <h1 class="contact-intro-title">Let's talk about the site.</h1>
    <p class="contact-intro-lede measure">
      Open to front-end and WordPress work — new builds, rebuilds, cart and
      theme upgrades, and ongoing care. Tell me what's live (or what isn't
      built yet) and I'll tell you what I'd do first.
    </p>
    <ul class="contact-meta-row">
      <li class="contact-meta-item"><span class="contact-status-dot" aria-hidden="true"></span>Open to new projects</li>
      <li class="contact-meta-item">Usually replies within a day</li>
    </ul>
  </div>
</section>`;

  // -- 2. THE FORM -------------------------------------------------------------
  const formSection = html`<section class="section contact-form-section" data-reveal>
  <div class="container">
    <div class="contact-form-card card">
      <form class="contact-form" id="contact-form" data-contact-form
        action="${FORMSPREE_ENDPOINT}" method="POST">
        <input type="hidden" name="_subject" value="New project inquiry — ${meta.siteName} contact form" />
        ${honeypotField()}
        <div class="form-row">
          ${textField({ id: "cf-name", name: "name", label: "Name", autocomplete: "name" })}
          ${textField({ id: "cf-email", name: "email", label: "Email", type: "email", autocomplete: "email" })}
        </div>
        ${selectField({ id: "cf-project-type", name: "project_type", label: "Project type", options: PROJECT_TYPES })}
        ${textareaField({ id: "cf-message", name: "message", label: "Message" })}
        <div class="form-actions">
          <button type="submit" class="btn btn--primary form-submit" data-form-submit>Send message</button>
          <p class="form-status" data-form-status aria-live="polite"></p>
        </div>
      </form>
    </div>
  </div>
</section>`;

  // -- 3. DIRECT CHANNELS -------------------------------------------------------
  const channelCards = [
    channelCard({ label: "Email", value: contact.email, href: `mailto:${contact.email}` }),
    channelCard({ label: "WhatsApp", value: contact.whatsappDisplay, href: contact.whatsapp, external: true }),
    channelCard({ label: "Discord", value: contact.discord }),
    channelCard({ label: "GitHub", value: "View profile", href: contact.github, external: true }),
  ];

  const channelsSection = section({
    id: "channels",
    eyebrow: "Prefer another way",
    title: "Direct channels.",
    intro: `Same person on the other end of all of these. ${contact.location}.`,
    reveal: true,
    children: html`<div class="channels-grid">${channelCards}</div>`,
  });

  return html`${intro}${formSection}${channelsSection}`;
}

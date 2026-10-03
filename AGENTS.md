# AGENTS.md — Salut Transport website (salut.my)

Shared guide for every AI coding agent working on this repo (Codex, Claude, and others).
Read this fully before changing anything. The owner is not a developer, so keep changes
small, explain them in plain language, and never push straight to `main`.

## What this is

Marketing + registration site for **Salut Transport**, a school van service in
Bandar Baru Bangi, Selangor. Audience: Malaysian parents, mostly on mobile phones.

- Live site: https://salut.my
- Repo: `saluttransport/landing-page` (GitHub)
- Hosting: Netlify project `saluttransport`. Every merge to `main` auto-deploys to production.
  Pull requests get a Netlify Deploy Preview link. Use it to check changes before merging.

## Stack

Plain static site. No framework, no bundler, no `package.json`, no build step
(`netlify.toml` → `publish = "."`).

| File / folder | Purpose |
|---|---|
| `index.html` | Homepage (hero, schools covered, pricing, FAQ, WhatsApp CTA) |
| `pendaftaran.html` | Multi-step 2027 registration form |
| `terms.html`, `privacy.html`, `refund.html`, `cancellation.html`, `service-delivery.html`, `contact.html` | Policy / content pages |
| `style.css` | Base design system (large; many layered "refinement" sections) |
| `concept.css` | Overrides for `index.html` + `pendaftaran.html` |
| `content-fixes.css` | Overrides for the policy/content pages |
| `chrome.css` | Shared header, mobile drawer and footer on every page (classes prefixed `st-`). The markup is repeated in all 8 HTML files, so change it everywhere together |
| `home.css` | Homepage sections (`index.html` only). Classes are prefixed `st-` so older CSS layers cannot reach them |
| `reg.css` | Registration page look (`pendaftaran.html` only), classes prefixed `st-reg` |
| `chat.css` | WhatsApp-style chat panel opened by the floating WhatsApp button on every page (classes prefixed `st-chat`). Loaded by `site.js`, which also builds the panel's markup |
| `policy.css` | Policy pages and `contact.html` (classes prefixed `st-sub`, `st-policy`, `st-contact`). The policy text inside is official: change layout only |
| `mobile-fixes.css` | Minified mobile overrides, **injected by `site.js`** (not linked in HTML) |
| `site.js` | All client JS: theme toggle, nav menu, WhatsApp chat, school map, form logic |
| `netlify/functions/registration.ts` | `POST /api/registration`: validates form data and forwards it to a Google Apps Script |
| `assets/` | Images. Use optimised `*-opt.webp` / `*-opt-mobile.webp` versions in pages |

## Rules

### Workflow
1. **Never commit directly to `main`.** Work on a branch named `codex/<topic>` or `claude/<topic>`,
   then open a pull request. The owner merges.
2. **One task per PR**, small and focused. Two agents must not edit the same files at the same time.
   Before starting, check open PRs/branches for overlapping work.
3. PR description: explain **in simple Bahasa Melayu or English** what changed and why, plus what
   to check on the Deploy Preview (mobile and desktop).
4. If you add a note for the other agent, put it under **Handoff notes** at the bottom of this file.

### Content & language
- All user-facing text is in **Bahasa Melayu** (`<html lang="ms">`). Keep that tone: warm, simple,
  aimed at parents. Don't translate pages to English.
- Business details must stay consistent everywhere: WhatsApp/phone `+60123539977`,
  email `saluttransport@gmail.com`, address in the homepage JSON-LD.
- Footer taglines mention **Bandar Baru Bangi** only (Sg Ramal was removed on purpose).

### Design
- Mobile first. Test at ~375px wide and at desktop width. Most visitors are on phones.
- **Source of truth for design:** the owner's approved prototype at
  https://salut-transport-bangi.saluttransport.chatgpt.site/ (behind the owner's OpenAI login; ask the
  owner to open it). Follow its layout, copy, colours and components. Two exceptions, which the
  prototype itself marks as previews: keep the real registration fields and `/api/registration`, and keep
  the official policy text word for word (only its layout follows the prototype).
- Identity: navy `#102b3c` + yellow `#f5c84e`, teal accents, fonts **Poppins** (headings) and
  **Open Sans** (body). Light and dark mode must both work (`data-theme` / `body.darkMode`).
- The hero is light (cream overlay on the photo) in light mode and dark navy in dark mode, as in the prototype.
- CSS is layered: later files and later sections override earlier ones. Before adding a new
  override, search all five CSS files (including `mobile-fixes.css` and `go-live.css`) for the selector
  so you don't fight an existing rule. Prefer editing the existing rule over stacking another `!important`.
- Watch out: any ancestor with `overflow: hidden` breaks `position: sticky`
  (this already caused a bug in the registration header).

### School list (keep in sync!)
The list of covered schools lives in **three places**. Change all three together:
1. `index.html`: `.schoolCard` buttons (school locator + map)
2. `pendaftaran.html`: `<option>`s in the school `<select>`
3. `netlify/functions/registration.ts`: the `SCHOOLS` set (server rejects unknown schools)

### Registration function & data
- The form collects children's and parents' personal data (names, phone numbers, IC numbers).
  Treat it as sensitive: no logging of form contents, no new third-party scripts on `pendaftaran.html`.
- If you add or rename a form field, update `ALLOWED_FIELDS` and `validate()` in
  `registration.ts`. The server rejects unexpected fields.
- Secrets are **Netlify environment variables** only. Never hard-code or commit them:
  `SALUT_REGISTRATION_APPS_SCRIPT_URL`, `SALUT_REGISTRATION_SHARED_SECRET`, `SALUT_ALLOWED_ORIGINS`.
- **This repo is public.** Never commit `.env` files, keys, spreadsheets, or customer data.

### Don't touch without asking the owner
- `robots.txt`, `sitemap.xml`, canonical tags (SEO: Google indexing)
- `netlify.toml` headers / caching
- Deleting images in `assets/` (some are kept on purpose; see `.netlifyignore`)
- Anything in `.gitignore`d sibling projects (`salut-platform/`, automation folders, etc.)

## Checking your work
There is no test suite. Before opening a PR:
- Open the changed pages locally (`npx serve .` or any static server) at mobile and desktop widths,
  in both light and dark mode.
- Check the browser console for errors.
- If you touched the form or function, verify with `netlify dev` if available, or describe in the
  PR exactly what needs to be tested on the Deploy Preview.

## Known issues / backlog
- `concept.css` still has unused `.conceptRibbon` styles from the preview build (safe to remove later).

## Handoff notes
<!-- Agents: add dated notes here, newest first. Example:
- 2026-09-30 (codex): Started branch codex/faq-update, touching index.html FAQ only.
-->
- 2026-10-03 (claude): Branch `claude/family-form`: `pendaftaran.html` is one form per family with up to 5 child cards
  (`[data-child]`, field names end in `-1` … `-5`, added/removed in `site.js`). Parts are now 3: Anak & Perjalanan (each child
  has their own session/trip/route), Ibu Bapa (+ alamat), Pengesahan. The page posts `{…family fields, children: [...]}`;
  `registration.ts` still accepts the old one-child body and forwards both to Apps Script as schema `2027-website-v3`, so the
  Apps Script must understand v3 before this goes live. Child errors come back as `field-n` (e.g. `sekolah-2`).
- 2026-10-03 (claude): Branch `claude/hero-compact`: on the homepage the hero now fills the first screen minus the header and the
  trust strip (`.st-proof`), so the strip is visible without scrolling. Sizes follow the screen height (`svh`); `--st-head` and
  `--st-proof` on `.st-home` must match the header and strip heights. On phones the strip is one row of four, and the
  "Dipercayai oleh 200+ keluarga" line is hidden and the gallery dots sit above "Scroll untuk kenali servis kami". Block is at the end of `home.css`.
- 2026-10-02 (claude): Branch `claude/share-preview-404`: og:image/twitter:image are absolute URLs and every page has og:url (WhatsApp/Facebook previews need them).
  `404.html` is the Malay not-found page; Netlify serves it for any missing path, so it uses `<base href="/">` and has no
  "#main" skip link. Keep its header/footer in step with the other pages. The registration form no longer promises an e-mail receipt.
- 2026-10-02 (claude): Branch `claude/single-parent`: the form needs at least one guardian (ayah or ibu), not both.
  A guardian who is filled in needs a name and phone, and at least one guardian needs an IC. `site.js`
  (`updateGuardianRequired`) switches the `required` flags and the * marks as the parent types, and
  `validate()` in `registration.ts` checks the same rule. Empty guardian fields reach the Apps Script as "".
- 2026-10-02 (claude): Branch `claude/form-hardening`: `/api/registration` now has a Netlify rate limit
  (8 per minute per IP, answers 429). A 400 reply names the rejected form field in `error.field` (never its
  value), and `site.js` opens that part of the form with a message under the field. Date of birth is read
  from its parts so 1 January births no longer get an age one year too high (the server runs in UTC).
- 2026-10-02 (claude): Branch `claude/chat-whatsapp-style` restyles the chat panel to look like WhatsApp (`chat.css`,
  new `st-chat-*` markup in `site.js`). Texts, the three quick replies and the wa.me links are unchanged; the old
  `.mobileWhatsAppChat` rules in `style.css` / `mobile-fixes.css` / `go-live.css` no longer match anything.
- 2026-10-02 (claude): Branch `claude/reg-mobile-polish` makes the step bar on `pendaftaran.html` sticky
  (`.st-reg-sticky` inside the form card; its `top` matches the header height 80/70/67px) and adds a short
  1–4 step list to it on screens up to 800px. Both step lists use `[data-reg-steps]`. It also stops iPhone
  Safari drawing the date-of-birth box wider than the other fields.
- 2026-10-02 (claude): Branch `claude/seo-indexing` adds a canonical tag to every page (homepage already had one),
  matching the URLs in `sitemap.xml`, and removes the stale "robots.txt blocks crawlers" note: `robots.txt` on
  `main` and salut.my already allows crawling.
- 2026-10-02 (claude): Branch `claude/policy-prototype` gives the 5 policy pages and `contact.html` the prototype
  layout (`policy.css`). The policy wording, its order and its links are unchanged (checked against `main` by
  script); only the "1)" numbering moved into the page layout. The contact page keeps every official detail,
  including the business name. `content-fixes.css` no longer styles these pages' main content.
- 2026-10-02 (claude): Branch `claude/registration-prototype` gives `pendaftaran.html` the prototype look
  (`reg.css`) and shows the form one part at a time (block after the registration code in `site.js`).
  The 25 field names, types, options, `required` flags and `/api/registration` are unchanged; the form is
  now found by `[data-registration-form]` and its status by `[data-form-status]`. Without JavaScript all
  four parts stay visible. IC fields now check for 12 digits in the browser.
- 2026-10-02 (claude): Branch `claude/header-footer-prototype` replaces the header and footer on all 8
  pages with the prototype version (`chrome.css`, plus the header and theme code at the top of `site.js`).
  The old `.nav` / `.menuToggle` / `.mobileNavMenu` / `.footerGrid` markup and its JS are gone. On the
  homepage, links use `#section`; on other pages they use `index.html#section`. Please avoid editing the
  HTML files, `site.js` and `chrome.css` until it is merged.
- 2026-10-02 (claude): Branch `claude/homepage-prototype` rebuilds the homepage body (hero to the
  "Semak slot" form) to match the owner's approved prototype, in `index.html`, `home.css` and a new
  homepage block at the end of `site.js`. Section ids are unchanged so links from other pages still work.
  Header, footer and the other pages are not touched yet. Please avoid editing these files until it is merged.

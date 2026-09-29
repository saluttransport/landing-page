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
- Keep the existing identity: dark green/ink + gold (`var(--yellow)`), fonts **Fraunces** (headings)
  and **Nunito Sans** (body). Light and dark mode must both work (`data-theme` / `body.darkMode`).
- The hero section always keeps its dark photo styling, even in light mode.
- CSS is layered: later files and later sections override earlier ones. Before adding a new
  override, search all four CSS files (including `mobile-fixes.css`) for the selector
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
- `robots.txt`, `sitemap.xml`, canonical tags (SEO: see Known issues)
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
- `robots.txt` still blocks all crawlers (`Disallow: /`), left over from the "salut-ten-concept"
  preview build, and the canonical tag in `index.html` is commented out. salut.my is therefore
  not being indexed by Google. Fix only when the owner approves.
- `concept.css` still has unused `.conceptRibbon` styles from the preview build (safe to remove later).

## Handoff notes
<!-- Agents: add dated notes here, newest first. Example:
- 2026-09-30 (codex): Started branch codex/faq-update, touching index.html FAQ only.
-->

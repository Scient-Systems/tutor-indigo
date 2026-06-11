# Meridian → Open edX theme bridge

Canonical design system: `sqa-homepage/DESIGN_SYSTEM.md` ("MERIDIAN", v2 —
replaces "Night Quest"). This doc maps those tokens onto the two Open edX
theming systems and records the adaptation decisions.

⚠️ **`git add` discipline:** new files in `tutorindigo/templates/` MUST be
committed — a VPS build once failed because an untracked partial wasn't
pushed. SCSS partial `extra/_night-quest.scss` keeps its legacy filename for
exactly this reason (it now holds Meridian polish).

## Core adaptation decisions

1. **Frost is the app surface, midnight is the chrome.** Reading surfaces use
   `frost` (#F1F5FA, cool blue-white — never cream) with `ink` text. Midnight
   chrome (header/footer/login/heroes) carries static aurora glints + a faint
   starfield (zero-animation CSS gradients).
2. **Dark mode = deep space with atmosphere.** `body.indigo-dark-theme` gets
   fixed aurora washes + a survey dot-grid (`extra/_night-quest.scss`) so every
   page reads as one continuous environment; `.window-wrap` is transparent.
3. **One accent: ember.** Primary CTAs (Register, search submit, `.btn-brand`)
   are the copper gradient `#FF8A57 → #F4602A` with **ink text — never white**.
4. **Glow blue is the active/luminous voice.** `#6FA8FF` for active nav
   underlines (with a soft glow shadow), dark-theme links, "Learn more" course
   buttons on night (`#9CC4FF → #5E96F5` gradient, ink text).
5. **Lit edges.** Night cards get a brighter top border
   (`rgba(190,212,255,.3)`) — the single-light-source rule from the homepage.
6. **Shapes**: buttons 12px radius (pills retired; round chips/avatars stay),
   cards 18px, hero panels 24px.

## Token map

| Meridian token | Hex | Legacy SCSS (`_variables.scss`) | Paragon/brand |
|---|---|---|---|
| abyss | `#060B1A` | `$sqa-night-950` (footer) | dark `header.bg` |
| midnight | `#0A1226` | `$sqa-night-900`, `$body-bg-d` | dark `body.bg` |
| sapphire | `#101B38` | `$sqa-night-800`, `$light-overlay-d` | dark `bg.light-overlay` |
| hairline-night | `rgba(151,170,215,.14)` | `$sqa-night-line` | hardcoded in partials |
| frost | `#F1F5FA` | `$sqa-paper` (body bg) | light `body.bg` |
| frost-2 | `#E7EDF6` | `$sqa-paper-soft` | — |
| ink | `#101A33` | `$sqa-ink`, `$dark`, `$primary` (via `INDIGO_PRIMARY_COLOR`) | light `primary.base`, `text.base` |
| ink-soft | `#4F5E7E` | `$sqa-ink-soft`, `$light-dark` | light `text.light/primary` |
| moon | `#E9EEFA` | `$sqa-star`, `$text-color-d` | dark `text.base` |
| moon-dim | `#8E9CC0` | `$sqa-star-dim` | dark `gray.500`, `text.footer` |
| glow | `#6FA8FF` | `$sqa-glow`, `$primary-d` | dark `primary.base` |
| ember | `#F4602A` | `$sqa-ember`, `$quest-yellow` (alias!) | `brand.base` (dark) |
| ember-soft | `#FF8A57` | `$sqa-ember-soft`, `$quest-orange` (alias) | gradient top |
| sky | `#2B5FD0` | `$quest-blue` (alias) | light `brand/info.base` |
| mint | `#1F9D5B` / `#5BD392` dark | `$quest-green` / `$success-d` | dark `success.base` |
| rose | `#CC3D2A` / `#FF8E7A` dark | `$quest-red` / `$danger-d` | dark `danger.base` |

Legacy `$quest-*` variable names persist as **aliases** so old partials compile.

## Typography

Sora (display, −0.02em tracking) · Hanken Grotesk (body) · JetBrains Mono (code).
One Google Fonts @import in `_variables.scss` / brand `_fonts.scss` / payment `index.scss`:
`...css2?family=Sora:wght@400;500;600;700&family=Hanken+Grotesk:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600&display=swap`

## Where things live (legacy theme)

| Surface | File |
|---|---|
| Tokens + dark remap | `lms/static/sass/partials/lms/theme/_variables.scss` |
| Body fonts, 12px buttons | `.../theme/_extras.scss` (head; `.home header` must stay transparent) |
| Midnight header + aurora, glow nav | `lms/static/sass/extra/_header.scss` |
| Abyss footer | `lms/static/sass/extra/_footer.scss` |
| Index hero (midnight panel, ember search) | `lms/static/sass/home/_home.scss` — ⚠️ never reintroduce `.home>header .title { background: none !important }`, it blanks the hero |
| Dark atmosphere, card system, Learn-more buttons | `lms/static/sass/extra/_night-quest.scss` (Meridian content, legacy name) |
| Discover page (search row, cards) | `lms/static/sass/courseware/_discover.scss` |

`INDIGO_PRIMARY_COLOR` default `#101A33` and `WELCOME_MESSAGE` "Where curious
minds become builders" live in `tutorindigo/plugin.py`. ⚠️ VPS `config.yml`
overrides beat these — check `tutor config printvalue INDIGO_PRIMARY_COLOR` /
`INDIGO_WELCOME_MESSAGE` and unset stale values.

## MFEs (brand fork `Scient-Systems/brand-openedx`, branch `ulmo/indigo`)

Two layers (wired in `plugin.py`):
1. **Build-time** `@edx/brand` (→ `tutor images build mfe`): Sora/Hanken fonts,
   aurora header chrome, abyss footer, login hero (aurora + ember-gradient
   accent text + ember `.btn-brand` + lit-edge 24px content card), 12px
   buttons, profile glow.
2. **Runtime** `PARAGON_THEME_URLS` (raw `dist/{light,dark}.min.css`): frost
   body / ink text (light), midnight + glow primary + ember brand (dark).
   **Token iteration = `make build` → commit dist/ → push → LMS restart.**

Payment MFE: own `src/index.scss` aurora header; pages are inline-styled
(midnight bg, sapphire cards, ember accent, tier colors: basic `#6FA8FF`,
premium `#FF8A57`, enterprise `#5BD392`).

### Deploy (VPS)
```
# A. legacy theme: push → git pull && tutor config save && tutor images build openedx
#    && tutor images push openedx && kubectl -n openedx rollout restart deployment/lms deployment/cms
# B. brand SCSS / payment MFE: tutor images build mfe && push && rollout restart mfe lms
# C. brand tokens only: push (dist/ committed) → rollout restart lms (CSS cached ≤5 min)
```

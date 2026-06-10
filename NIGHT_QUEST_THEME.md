# Night Quest → Open edX theme bridge

Canonical design system: `sqa-homepage/DESIGN_SYSTEM.md` ("The Night Quest").
This doc maps those tokens onto the two Open edX theming systems and records the
design decisions made when adapting a marketing design to an *application* UI.

## Core adaptation decisions

1. **Paper is the app surface, night is the chrome.** Courseware/dashboard are
   reading environments — they use `paper` (#FBF5EA) backgrounds with `ink`
   text. The night cosmos (navy + starfields) is reserved for the header,
   footer, hero bands, and the dark-mode variant. No parallax planets inside
   the app; starfields are static CSS gradients (no animation) in chrome.
2. **Dark mode = the cosmos.** Indigo's dark theme is variable-driven, so the
   `-d` variables are remapped to night tokens. Toggling dark mode lands the
   user in night-900 space.
3. **Yellow stays the launch color.** `quest-yellow` is used only for primary
   CTAs (Register, search submit) and active-tab underlines — never decorative
   at scale.
4. **Primary = ink.** `INDIGO_PRIMARY_COLOR` defaults to `#1D2B50` (ink navy,
   the logo border color). Buttons are ink with white text (AA-safe); hovers
   shift toward `quest-blue`.

## Token map

| Night Quest token | Hex | Legacy SCSS (`_variables.scss`) | Paragon/brand (Phase 2) |
|---|---|---|---|
| night-950 | `#070D20` | `$sqa-night-950` (footer) | `$gray-900` / footer bg |
| night-900 | `#0B1530` | `$sqa-night-900`, `$body-bg-d` | dark theme `$body-bg` |
| night-800 | `#111E42` | `$sqa-night-800`, `$light-overlay-d` | dark `$card-bg` |
| paper | `#FBF5EA` | `$sqa-paper` (body bg) | `$body-bg` |
| paper-soft | `#F3EAD7` | `$sqa-paper-soft` | `$light-200` |
| ink | `#1D2B50` | `$sqa-ink`, `$dark`, `$primary` (via `INDIGO_PRIMARY_COLOR`) | `$primary-500`, body text |
| ink-soft | `#5C6A8C` | `$sqa-ink-soft`, `$light-dark` | `$gray-500` |
| star | `#EEF2FB` | `$sqa-star`, `$text-color-d` | dark body text |
| star-dim | `#8E9BBF` | `$sqa-star-dim`, `$text-color-primary`-ish | dark muted text |
| quest-red | `#EF4D4D` | `$quest-red` | `$danger-500` |
| quest-blue | `#3B7BE8` | `$quest-blue` (links/hovers); `#9DBCF7` as `$primary-d` | `$info-500` / link color |
| quest-green | `#3FB868` | `$quest-green` | `$success-500` |
| quest-yellow | `#FFC83D` | `$quest-yellow` (CTAs, active tabs) | `$warning-300` / brand CTA |
| quest-orange | `#FF8A3D` | `$quest-orange` | accent |

## Typography

| Role | Font | Legacy var | Notes |
|---|---|---|---|
| Display/headings | Fredoka 400–700 | `$font-family-title` | h1–h6, nav items, card titles |
| Body | Karla 400–700 | `$font-family-body` | body, p, label, button |
| Code | JetBrains Mono 400/700 | `$font-family-mono` | decorative/code voice |

Loaded via one Google Fonts `@import` in `_variables.scss` (replaces Inter).

## Shape & elevation

- Buttons/chips: pill (`border-radius: 999px`) — overrides indigo's square `0`.
- Cards: `1.25rem` radius, paper shadow `0 10px 30px rgba(29,43,80,0.08)`,
  hover lift `translateY(-6px)` + `0 18px 44px rgba(29,43,80,0.13)`.
- Night hairlines: `rgba(255,255,255,0.08)`. No blurry glows on paper.

## Where things live (legacy theme)

| Surface | File |
|---|---|
| Tokens + dark remap | `lms/static/sass/partials/lms/theme/_variables.scss` |
| Body/paper, fonts split, pill buttons | `.../theme/_extras.scss` (head) |
| Night header + starfield, nav, dropdown | `lms/static/sass/extra/_header.scss` |
| Night footer | `lms/static/sass/extra/_footer.scss` |
| Index hero (night panel + search) | `lms/static/sass/home/_home.scss` |
| Card lift, selection, focus, shared polish | `lms/static/sass/extra/_night-quest.scss` |

`INDIGO_PRIMARY_COLOR` default lives in `tutorindigo/plugin.py`. If the VPS
`config.yml` overrides it, the new default won't apply — check with
`tutor config printvalue INDIGO_PRIMARY_COLOR` and unset if needed.

## Phase 2 pointer (MFEs)

MFE styling comes from `PARAGON_THEME_URLS` in `plugin.py` (runtime CSS, served
through the LMS MFE-config API — **no MFE rebuild needed to iterate**). Fork
`edly-io/brand-openedx` (`ulmo/indigo` branch), apply the Paragon column above,
build `dist/light.min.css` + `dark.min.css`, host, and point the two URLs at it.

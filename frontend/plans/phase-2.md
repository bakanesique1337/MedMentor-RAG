# Phase 2 Plan: Design System (Tailwind-Based)

## Scope

Build the visual foundation for the MVP frontend so page implementation can reuse stable tokens,
semantic utilities, and accessible interaction states instead of ad hoc styling.

## Phase Goal

Define a neutral/light medical product direction with green accents, then encode that direction
in CSS variables, Tailwind v4 theme directives, and reusable layout primitives.

## Inputs

- Master roadmap: `PLAN.md` (`P2`, `P2.1`, `P2.2`, `P2.3`, `P2.4`).
- Existing frontend foundation delivered in `P1`.
- Project style rules from `CLAUDE.md`, `.claude/rules/*`, and lint configs.
- Current app entry styling files (`src/assets/main.css`, `src/assets/variables.css`,
  `src/assets/base.css`, `src/assets/typography.css`, `src/assets/utilities.css`).

## Technical Context: Tailwind v4

The project uses **Tailwind v4**. Tailwind v4 is CSS-first: theme customization is done via the `@theme` directive
inside a CSS file, not a JavaScript config. This changes how tokens are registered:

- Custom tokens go inside `@theme { }` in `main.css` or an imported theme file.
- Values inside `@theme` become both CSS custom properties AND Tailwind utility classes automatically.
- Raw palette tokens that should NOT generate utilities go in `:root { }` outside `@theme`.
- Tailwind v4 preflight is active by default with `@import "tailwindcss"` -- no extra step needed.

---

## Tasks

### P2.0 Pre-Task: Baseline Audit And Conflict Resolution

Before adding tokens, resolve existing inconsistencies in the current CSS files.

- `src/assets/base.css` sets `font-size: 15px` on `body`. This conflicts with the P2.3 plan
  to set `html { font-size: 62.5% }` (making `1rem = 10px`). Resolve explicitly:
    - Set `html { font-size: 62.5%; }` in the `@layer base` reset block.
    - Remove `font-size: 15px` from `body`.
    - Set `body { font-size: 1.5rem; }` (= 15px in the new scale) or choose a token-driven value.
- Confirm `src/assets/variables.css` is empty and ready to receive raw palette tokens.
- Confirm `src/assets/typography.css` and `src/assets/utilities.css` are empty and ready.
- Confirm `src/assets/main.css` import order will load variables before base, base before utilities.
- Decide the token naming convention (see P2.1) before writing any variable.

Goal: no baseline conflicts, clear file responsibilities, naming convention locked.

---

### P2.1 Color Tokens

Define raw palette tokens in CSS variables and keep naming stable enough for component reuse.

#### Naming Convention (locked here, applied everywhere)

- Raw palette: `--color-{hue}-{step}` (e.g., `--color-green-500`, `--color-slate-100`).
  Lives in `:root {}` outside `@theme`. Does NOT generate Tailwind classes on its own.
- Semantic tokens: `--{role}` (e.g., `--surface-base`, `--text-primary`, `--border-subtle`).
  Registered in `@theme {}` so Tailwind generates utilities like `bg-surface-base`, `text-text-primary`.

#### Palette Groups

- `base` (neutral grays, slate tones for backgrounds and surfaces)
- `primary` (medical blue -- actions, key highlights, trust and professionalism)
- `secondary` (teal -- supporting interactive elements, health accent)
- `success` (green -- correct answers, positive feedback)
- `info` (blue-light -- informational states, RAG source labels)
- `warning` (amber -- caution states, incomplete diagnosis)
- `error` (red -- critical states, wrong diagnosis feedback)

#### Hex Values (locked palette)

Raw palette tokens for `variables.css`. Full 11-step scale for primary and secondary;
abbreviated scales for status groups.

**Primary -- Medical Blue**
```css
--color-blue-50:  #EFF6FF;
--color-blue-100: #DBEAFE;
--color-blue-200: #BFDBFE;
--color-blue-300: #93C5FD;
--color-blue-400: #60A5FA;
--color-blue-500: #3B82F6;
--color-blue-600: #2563EB;
--color-blue-700: #1D4ED8;
--color-blue-800: #1E40AF;
--color-blue-900: #1E3A8A;
--color-blue-950: #172554;
```

**Secondary -- Teal**
```css
--color-teal-50:  #F0FDFA;
--color-teal-100: #CCFBF1;
--color-teal-200: #99F6E4;
--color-teal-300: #5EEAD4;
--color-teal-400: #2DD4BF;
--color-teal-500: #14B8A6;
--color-teal-600: #0D9488;
--color-teal-700: #0F766E;
--color-teal-800: #115E59;
--color-teal-900: #134E4A;
```

**Success -- Green**
```css
--color-green-50:  #F0FDF4;
--color-green-100: #DCFCE7;
--color-green-400: #4ADE80;
--color-green-500: #22C55E;
--color-green-600: #16A34A;
--color-green-700: #15803D;
```

**Warning -- Amber**
```css
--color-amber-50:  #FFFBEB;
--color-amber-100: #FEF3C7;
--color-amber-400: #FBBF24;
--color-amber-500: #F59E0B;
--color-amber-600: #D97706;
--color-amber-700: #B45309;
```

**Error -- Red**
```css
--color-red-50:  #FEF2F2;
--color-red-100: #FEE2E2;
--color-red-400: #F87171;
--color-red-500: #EF4444;
--color-red-600: #DC2626;
--color-red-700: #B91C1C;
```

**Neutral -- Slate (backgrounds, text, borders)**
```css
--color-slate-50:  #F8FAFC;
--color-slate-100: #F1F5F9;
--color-slate-200: #E2E8F0;
--color-slate-300: #CBD5E1;
--color-slate-400: #94A3B8;
--color-slate-500: #64748B;
--color-slate-600: #475569;
--color-slate-700: #334155;
--color-slate-800: #1E293B;
--color-slate-900: #0F172A;
```

**Semantic token mapping (for `[data-theme="light"]` block in `main.css`)**

| Semantic token           | Raw token              | Hex       | Role                          |
|--------------------------|------------------------|-----------|-------------------------------|
| `--surface-base`         | `--color-slate-50`     | `#F8FAFC` | App background                |
| `--surface-elevated`     | `#FFFFFF`              | `#FFFFFF` | Cards, panels                 |
| `--surface-sunken`       | `--color-slate-100`    | `#F1F5F9` | Inputs, code blocks           |
| `--surface-muted`        | `--color-slate-200`    | `#E2E8F0` | Disabled surfaces             |
| `--text-primary`         | `--color-slate-900`    | `#0F172A` | Main content (>= 7:1)         |
| `--text-secondary`       | `--color-slate-600`    | `#475569` | Labels, metadata (>= 4.5:1)   |
| `--text-tertiary`        | `--color-slate-400`    | `#94A3B8` | Hints, timestamps (>= 3:1)    |
| `--text-disabled`        | `--color-slate-300`    | `#CBD5E1` | Suppressed, non-interactive   |
| `--text-inverse`         | `#FFFFFF`              | `#FFFFFF` | Text on dark surfaces         |
| `--border-subtle`        | `--color-slate-200`    | `#E2E8F0` | Hairline separators           |
| `--border-default`       | `--color-slate-300`    | `#CBD5E1` | Inputs, cards                 |
| `--border-strong`        | `--color-slate-400`    | `#94A3B8` | Emphasis, active outlines     |
| `--interactive-primary`  | `--color-blue-600`     | `#2563EB` | CTA, primary buttons          |
| `--interactive-primary-hover` | `--color-blue-700` | `#1D4ED8` | Primary hover                |
| `--interactive-secondary`| `--color-teal-600`     | `#0D9488` | Secondary buttons, accents    |
| `--focus-ring`           | `--color-blue-500`     | `#3B82F6` | Universal focus ring          |
| `--success-surface`      | `--color-green-50`     | `#F0FDF4` | Correct answer background     |
| `--success-text`         | `--color-green-700`    | `#15803D` | Correct answer text           |
| `--success-border`       | `--color-green-600`    | `#16A34A` | Correct answer border         |
| `--warning-surface`      | `--color-amber-50`     | `#FFFBEB` | Caution background            |
| `--warning-text`         | `--color-amber-700`    | `#B45309` | Caution text                  |
| `--warning-border`       | `--color-amber-500`    | `#F59E0B` | Caution border                |
| `--error-surface`        | `--color-red-50`       | `#FEF2F2` | Wrong answer background       |
| `--error-text`           | `--color-red-700`      | `#B91C1C` | Wrong answer text             |
| `--error-border`         | `--color-red-600`      | `#DC2626` | Wrong answer border           |
| `--skeleton-base`        | `--color-slate-200`    | `#E2E8F0` | Skeleton loader fill          |
| `--skeleton-highlight`   | `--color-slate-100`    | `#F1F5F9` | Skeleton shimmer highlight    |

#### Rules

- Keep visual direction light and neutral; green is the main product accent.
- Reserve stronger saturation for actions, status, and emphasis, not for default surfaces.
- Avoid one-off hardcoded hex values in components once tokens exist.
- Each semantic group (success/info/warning/error) must have at least three values:
  `{group}-surface`, `{group}-text`, `{group}-border`.
  This ensures status feedback can be rendered without palette leakage.

#### Medical Context Note

Green is the correct primary for MedMentor (health, go, correct). However, reserve
pure saturated green for positive/correct feedback. Use desaturated green (sage) for
neutral primary actions to avoid visual confusion between "primary button" and "correct answer."

Goal: a coherent token palette that can drive all MVP surfaces and controls.

---

### P2.2 Semantic Tokens

Map raw palette values into semantic UI roles so components depend on intent, not literal color names.

#### Surface Tokens

- `--surface-base` -- app background (near-white, slightly warm)
- `--surface-elevated` -- cards, panels, floating elements (white or very light)
- `--surface-sunken` -- inset areas, inputs, code blocks
- `--surface-muted` -- disabled surfaces, empty states
- `--surface-overlay` -- modal/drawer backdrop fill (semi-transparent)

#### Text Tokens

- `--text-primary` -- main readable content (high contrast, >= 7:1 on surface-base)
- `--text-secondary` -- supporting labels, metadata (>= 4.5:1)
- `--text-tertiary` -- placeholders, hints, timestamps (>= 3:1, never for body copy)
- `--text-disabled` -- visually suppressed, not interactive
- `--text-inverse` -- text on dark/colored surfaces (e.g., primary button label)
- `--text-on-status` -- text rendered on status-colored surfaces

#### Border Tokens

- `--border-subtle` -- hairline separators, structural outlines (low visual weight)
- `--border-default` -- standard input and card borders
- `--border-strong` -- emphasis borders, active element outlines

#### Interactive State Tokens

Define per-role interactive variants rather than a single global set:

- `--interactive-primary-{default|hover|active|disabled}` -- primary action fill
- `--interactive-secondary-{default|hover|active|disabled}` -- secondary action fill
- `--interactive-ghost-{hover|active}` -- ghost/text button hover surface
- `--focus-ring` -- universal focus ring color (single source of truth)
- `--focus-ring-offset` -- ring offset (usually `--surface-base` or transparent)

#### Status Token Families

Each status group (success / info / warning / error) provides:

- `--{status}-surface` -- background for status banners, toasts
- `--{status}-text` -- text inside status surfaces
- `--{status}-border` -- border for status banners, inputs in error/warning state
- `--{status}-icon` -- icon fill inside status areas (may match text or be bolder)

#### Skeleton And Loading Tokens (required for streaming AI responses)

- `--skeleton-base` -- base fill for skeleton loaders
- `--skeleton-highlight` -- shimmer highlight color for animation
- `--skeleton-radius` -- consistent rounding for skeleton blocks

These are critical: the chat view has streaming AI responses. Without skeleton tokens,
loading states will be styled ad hoc across components.

#### Dark Mode Strategy

MVP launches in light mode only. The token structure must be designed so that dark mode can be
added later by only adding one new CSS block -- zero changes in components or Tailwind classes.

##### Chosen approach: `[data-theme]` attribute on `<html>`

Use `[data-theme="light"]` as the default scope for all semantic tokens.
Rationale: gives runtime control for a "system / light / dark" toggle (storable in
`UserSettings.settings`) without any CSS rework. A media-query-only approach would make
runtime toggling impossible without JavaScript overrides.

Set `data-theme="light"` directly in `index.html`:

```html

<html lang="ru" data-theme="light">
```

This ensures the correct theme is applied before any JS runs, preventing flash.

##### Critical Tailwind v4 detail: `@theme inline`

In Tailwind v4, `@theme { }` by default bakes token values into the compiled CSS as static values.
Example without `inline`:

```css
/* compiled output -- hardcoded, ignores CSS variable changes */
.bg-surface-base {
    background-color: #f8f9fa;
}
```

With `@theme inline { }`, Tailwind generates `var()` references instead:

```css
/* compiled output -- reads the current variable value at runtime */
.bg-surface-base {
    background-color: var(--surface-base);
}
```

**All semantic color tokens must be registered inside `@theme inline { }`**, not plain `@theme { }`.
Only then will changing `[data-theme]` actually change what utilities render.
Scale tokens (spacing, radius, shadow, z-index, font-size) are not theme-dependent and
can go in plain `@theme { }`.

##### CSS structure to implement

```
/* variables.css -- raw palette, always in :root, never overridden */
:root {
  --color-green-500: #...;
  --color-slate-100: #...;
  /* full palette for both themes goes here */
}

/* main.css -- semantic tokens scoped per theme */
[data-theme="light"] {
  --surface-base: var(--color-slate-50);
  --text-primary: var(--color-slate-900);
  /* ... all semantic tokens ... */
}

/* future dark theme -- only this block needs to be added */
[data-theme="dark"] {
  --surface-base: var(--color-slate-900);
  --text-primary: var(--color-slate-50);
  /* ... same token names, different palette values ... */
}

/* main.css -- register semantic colors for Tailwind utility generation */
@theme inline {
  --color-surface-base: var(--surface-base);
  --color-text-primary: var(--text-primary);
  /* ... */
}

/* scale tokens -- not theme-dependent, go in plain @theme */
@theme {
  --spacing-1: 0.8rem;
  --radius-md: 0.8rem;
  /* ... */
}
```

##### Do NOT use Tailwind's built-in `dark:` variant

Tailwind's `dark:` prefix uses its own `prefers-color-scheme` or `.dark` class mechanism.
It conflicts with the `[data-theme]` approach and must not be used in components.
If a component uses `dark:bg-slate-900`, it will not respond to `[data-theme]` toggling.
All theme-sensitive styling must flow through semantic tokens only.

##### Vue integration (plan for a later phase)

When user theme toggling is implemented, create `src/composables/useTheme.ts` that:

- reads and sets `document.documentElement.setAttribute('data-theme', value)`
- persists the choice to `localStorage`
- initializes from `localStorage` or `prefers-color-scheme` media query on app mount
- exposes the current theme value reactively for UI (toggle button icon, settings page)

This composable does not need to exist in P2, but the CSS structure built here must support it.

Goal: components can be styled through semantic roles without palette leakage.
Adding dark mode later requires only adding one `[data-theme="dark"] { }` block in CSS --
no component changes, no Tailwind class changes.

---

### P2.3 Scale System

Establish the shared rhythm system before the UI kit starts.

#### Root Scale

- Set `html { font-size: 62.5%; }` so `1rem = 10px`. Update `body` font-size to a rem value.
- All dimensions in `rem`; exception: `1px` borders and hairlines.

#### Spacing Scale

- Base step: `0.8rem` (8px).
- Named steps in `@theme`: `--spacing-1: 0.8rem`, `--spacing-2: 1.6rem`, `--spacing-3: 2.4rem`,
  etc. following `n * 0.8rem` rhythm.
- Define micro step: `--spacing-0-5: 0.4rem` for tight padding inside badges, chips.
- Tailwind v4 maps `@theme --spacing-*` to `p-*`, `m-*`, `gap-*` utilities automatically.
- Treat any off-scale value as a named exception; do not allow raw `rem` values in components.

#### Typography Scale

Define in `@theme` so Tailwind generates `text-*` utilities:

- `--font-size-display` -- hero/page title (3.2rem -- 32px)
- `--font-size-h1` -- section heading (2.4rem -- 24px)
- `--font-size-h2` -- subsection heading (2.0rem -- 20px)
- `--font-size-h3` -- group heading (1.7rem -- 17px)
- `--font-size-body` -- standard prose (1.5rem -- 15px, matches current body)
- `--font-size-body-sm` -- supporting copy (1.3rem -- 13px)
- `--font-size-label` -- form labels, table headers (1.2rem -- 12px)
- `--font-size-caption` -- hints, timestamps, micro-labels (1.1rem -- 11px)
- `--font-size-mono` -- vitals, lab values, dosages (1.3rem -- 13px, monospace)

Font weight tokens (also in `@theme`):

- `--font-weight-regular: 400`
- `--font-weight-medium: 500`
- `--font-weight-semibold: 600`
- `--font-weight-bold: 700`

Line height tokens:

- `--leading-tight: 1.25` -- headings
- `--leading-normal: 1.5` -- body
- `--leading-relaxed: 1.75` -- long-form medical text (improves readability of dense content)

Medical copy note: clinical text is dense. Use `leading-relaxed` for patient dialogue and case
descriptions. Use `leading-tight` only for headings and UI labels.

#### Numeric Data Rules

Medical interfaces display vitals, lab values, and dosages. Two rules apply globally:

**`font-variant-numeric: tabular-nums`** -- add to `@layer base` on `body` (or as a utility class
`.tabular`). Ensures all digits occupy equal width so values like `ЧСС 98` and `ЧСС 140` align
correctly in lists and tables. Without it, numbers shift width as values update during streaming,
causing layout jitter.

**`max-width: 65ch`** -- define as a utility token `--prose-width: 65ch` and apply to chat bubbles,
case description blocks, and any long-form clinical text container. The `ch` unit is relative to the
width of the `0` glyph -- at body font size this yields ~520px, the optimal line length for dense
prose. Lines wider than 75ch measurably increase reading errors and fatigue on medical text.

Register in `@theme` so Tailwind generates the utility:
```
--prose-width: 65ch;
```

Apply in components as `max-w-prose-width` on `.chat-bubble` and `.case-description` containers.

#### Radius Scale

- `--radius-sm: 0.4rem` -- badges, chips, small inputs
- `--radius-md: 0.8rem` -- buttons, cards, inputs
- `--radius-lg: 1.2rem` -- panels, modals
- `--radius-xl: 1.6rem` -- large cards, overlays
- `--radius-full: 9999px` -- pills, avatar circles

#### Shadow Scale

- `--shadow-sm` -- subtle card lift (1--2px blur)
- `--shadow-md` -- standard card (4--8px blur)
- `--shadow-lg` -- panels, side drawers (12--20px blur)
- `--shadow-overlay` -- modals, dropdowns (heavy depth)
- `--shadow-focus` -- keyboard focus depth ring (distinct from outline, adds glow)

#### Z-Index Scale

Missing from the original plan. Without a locked z-index scale, component authors
default to arbitrary values and conflicts appear in production.

Define named z-levels in `@theme`:

- `--z-base: 0` -- document flow
- `--z-raised: 10` -- sticky headers, sticky footers
- `--z-dropdown: 100` -- menus, autocomplete, date pickers
- `--z-sticky: 200` -- persistent floating elements
- `--z-overlay: 300` -- modal backdrops
- `--z-modal: 400` -- modal content
- `--z-toast: 500` -- toast notifications (must clear modals)
- `--z-tooltip: 600` -- tooltips (must clear everything)

Rule: never use a raw integer for `z-index` in components. Always reference a z-level token.

Goal: layout and component sizing become predictable and mechanically repeatable.

---

### P2.4 Accessibility Baseline

Bake accessibility into the theme layer before component work begins.

- Tailwind v4 preflight is included automatically via `@import "tailwindcss"`. No additional reset needed.
  Verify that existing `@layer base` rules in `base.css` do not conflict with preflight.
- Validate contrast ratios using the defined tokens:
    - `--text-primary` on `--surface-base`: target >= 7:1 (AAA for body copy)
    - `--text-secondary` on `--surface-base`: target >= 4.5:1 (AA)
    - `--text-tertiary`: >= 3:1 minimum; do NOT use for body copy or interactive labels
    - Status text on status surfaces: >= 4.5:1 each
- Add consistent `:focus-visible` treatment:
    - Use `--focus-ring` color with a 2px solid outline + 2px `--focus-ring-offset`.
    - Apply via `@layer base` or a reusable `.focus-ring` utility class.
    - Remove `:focus` ring (use `:focus-visible` only) to avoid ring on mouse click.
- Define keyboard-visible interaction separately from pointer hover:
    - Hover: change background/color.
    - Focus-visible: always show outline ring regardless of hover state.
- Disabled states:
    - Maintain minimum 3:1 contrast for disabled labels (do not go fully transparent).
    - Add `cursor: not-allowed` + `pointer-events: none` in the global disabled token rule.
- Reduced motion:
    - Any transition or animation defined in the theme must be wrapped or disabled under
      `@media (prefers-reduced-motion: reduce)`. Define a global rule in `base.css`:
      `* { transition-duration: 0ms; animation-duration: 0ms; }` inside the media query.
    - This is especially important for the skeleton shimmer animation in chat.

Goal: the design system is safe to consume across the app without re-solving accessibility per component.

---

### P2.5 Motion And Transition Tokens

New task. Absent from original plan. Required before component work to avoid inconsistent
animation behavior across the chat UI (skeleton shimmer, message appear, streaming typing indicator).

Define transition tokens in `@theme`:

Duration tokens:

- `--duration-instant: 0ms` -- state changes that should feel immediate (toggle switches)
- `--duration-fast: 100ms` -- micro-interactions (button press, badge appearance)
- `--duration-normal: 200ms` -- standard UI transitions (hover, focus, drawer open)
- `--duration-slow: 350ms` -- page-level transitions, modal open
- `--duration-skeleton: 1500ms` -- skeleton shimmer cycle

Easing tokens:

- `--ease-default: cubic-bezier(0.4, 0, 0.2, 1)` -- standard ease-in-out (material standard)
- `--ease-enter: cubic-bezier(0, 0, 0.2, 1)` -- elements entering the screen (decelerate)
- `--ease-exit: cubic-bezier(0.4, 0, 1, 1)` -- elements leaving (accelerate)
- `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` -- bouncy spring (use sparingly)

Animation rules:

- All component transitions use token-driven duration + easing.
- No `transition: all` -- always specify explicit properties.
- Skeleton shimmer uses `@keyframes` defined in `utilities.css`.
- All animations respect `prefers-reduced-motion` (see P2.4).

Goal: animation behavior is consistent and controllable from a single source.

---

### P2.6 Font Loading Strategy

New task. Currently `Inter` is listed in `body` font-family in `base.css` but is not
explicitly loaded. Browsers will fall back to system fonts silently, causing visual
inconsistencies across machines.

- Add Inter via a `@font-face` block or a CDN `<link>` in `index.html`.
  Preferred: `@font-face` with `font-display: swap` to prevent invisible text during load.
- Load only the weights actually used: Regular (400), Medium (500), SemiBold (600), Bold (700).
- If self-hosting is not set up, add a `<link rel="preconnect">` + Google Fonts CDN link
  to `index.html` as a bootstrap step and note it as a future self-host candidate.
- Add `--font-family-sans` and `--font-family-mono` tokens in `@theme`:
    - sans: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
    - mono: `'JetBrains Mono', 'Fira Code', ui-monospace, monospace` (for medical data values)
- Reference `--font-family-sans` in `body` instead of the hardcoded stack.

Goal: consistent typography across all development and production environments.

---

### P2.7 Global Polish Layer

New task. Small foundational rules that elevate perceived quality of the entire interface.
These belong in the theme layer, not in individual components.

Add to `@layer base` in `base.css`:

- `::selection` -- use `--primary-surface` as background, `--primary-text` as color.
  Chat apps get selected frequently; unstyled selection looks unbranded.
- Scrollbar styling (`@layer base`, webkit + standard):
    - Width: 6px (narrow, unobtrusive in the chat column).
    - Track: `--surface-sunken`.
    - Thumb: `--border-default`, hover: `--border-strong`.
      The chat viewport will have a persistent scrollbar; custom styling removes the
      jarring OS-default scrollbar from the product feel.
- `input[type="number"]` -- hide spinner arrows (`-moz-appearance: textfield`,
  `::-webkit-inner-spin-button { display: none }`). Medical inputs for dosages etc.
  should not have browser number spinners.
- `img, video` -- `display: block; max-width: 100%` to prevent inline-element layout issues.
- Smooth scrolling: `html { scroll-behavior: smooth }` scoped inside
  `@media (prefers-reduced-motion: no-preference)`.

Goal: baseline polish is applied globally, not rediscovered per component.

---

## Suggested File Targets

- `index.html` -- add `data-theme="light"` to `<html>`, font preconnect/link if using CDN
- `src/assets/variables.css` -- raw palette tokens in `:root {}` (full palette for both themes)
- `src/assets/main.css` -- `[data-theme="light"]` semantic token block; `@theme inline {}` for
  color utilities; plain `@theme {}` for scale tokens (spacing, radius, shadow, z-index, font)
- `src/assets/base.css` -- `@layer base` resets, font-face, global polish rules
- `src/assets/typography.css` -- `@layer base` type scale rules, prose defaults
- `src/assets/utilities.css` -- `@layer utilities` custom classes (skeleton shimmer keyframes, focus-ring)
- `src/constants/tokens.ts` -- only if TS constants for z-levels or durations are needed by JS logic

## Definition Of Done (DoD)

- [x] Raw palette tokens exist in `:root {}` in `variables.css` -- complete palette for both themes.
- [x] Semantic tokens are scoped under `[data-theme="light"] {}`, not bare `:root {}`.
- [x] `index.html` has `data-theme="light"` on `<html>` element.
- [x] All semantic color tokens are registered in `@theme inline {}` so utilities use `var()` references.
- [x] Scale tokens (spacing, radius, shadow, z-index, font-size) are in plain `@theme {}`.
- [x] Tailwind `dark:` variant is NOT used anywhere in the codebase.
- [x] Skeleton/loading tokens are defined under `[data-theme="light"] {}`.
- [x] Motion tokens (duration, easing) are defined in `@theme {}`.
- [x] Focus-visible styles exist globally and are reusable via `.focus-ring` utility.
- [x] Font loading is explicit and verified across environments.
- [x] No hardcoded color values in components -- only semantic token utilities.
- [x] `html { font-size: 62.5% }` is set; `body { font-size: 15px }` conflict is resolved.
- [x] `prefers-reduced-motion` rule exists in `base.css`.
- [x] `bun run el:check` passes.
- [x] `bun run sl:check` passes.
- [x] Any token-related lint or type checks still pass.

## Risks And Mitigations

**Risk: token naming becomes too palette-specific.**
Mitigation: naming convention is locked in P2.1 -- raw tokens use `--color-{hue}-{step}`,
semantic tokens use `--{role}`. Style components against semantic roles only.

**Risk: spacing scale drifts once page work starts.**
Mitigation: define a compact but explicit scale in `P2` and treat off-scale values as exceptions
that need justification. Stylelint rule can flag raw rem values not matching the scale.

**Risk: accessibility gets deferred to component phase.**
Mitigation: define focus, contrast, and disabled-state rules in the theme layer now so UI-kit
work inherits them by default.

**Risk: Tailwind v4 `@theme` conflicts with manually declared `:root` variables.**
Mitigation: keep raw palette in `:root` (no Tailwind utility generation), semantic tokens in
`@theme` (Tailwind utilities generated). Never mix the two in the same block.

**Risk: dark mode retrofitting is expensive if not prepared now.**
Mitigation: semantic tokens live in `[data-theme="light"]` from day one. Adding dark mode
later = one new `[data-theme="dark"] {}` block. No component or Tailwind class changes needed.

**Risk: Tailwind utilities bake in hardcoded hex values, breaking runtime theme switching.**
Mitigation: semantic color tokens must be registered via `@theme inline {}`, not plain `@theme {}`.
Verify during P2.0 audit that the correct directive is used. A quick test: inspect compiled CSS
and confirm that color utilities contain `var(--)` references, not hex values.

**Risk: skeleton tokens are skipped as "not needed yet."**
Mitigation: streaming AI responses are a core chat feature and appear in P4/P7. Skeleton tokens
must exist in P2 or every chat-loading state will use ad hoc colors.

**Risk: z-index conflicts between dropdown menus, modals, and toast notifications.**
Mitigation: z-index scale is defined in P2.3 and all components must reference z-level tokens.
Any exception requires explicit justification and a comment in the component.

## Execution Order

1. Audit active styling entrypoints and confirm Tailwind v4 setup (P2.0).
2. Add `data-theme="light"` to `<html>` in `index.html`.
3. Resolve the `font-size: 15px` / `62.5%` conflict in `base.css` (P2.0).
4. Lock naming convention for raw vs semantic tokens (P2.1 preamble).
5. Add raw palette tokens (full palette) to `variables.css` in `:root {}` (P2.1).
6. Add `[data-theme="light"] {}` semantic token block to `main.css` (P2.2).
7. Register semantic colors in `@theme inline {}` in `main.css` (P2.2 dark mode section).
8. Add scale tokens in plain `@theme {}` in `main.css` (P2.3).
9. Add motion tokens to `@theme {}` and skeleton keyframes to `utilities.css` (P2.5).
10. Add font loading to `index.html` and font-family tokens to `@theme {}` (P2.6).
11. Add focus-visible, disabled, reduced-motion, and polish rules to `base.css` (P2.4 + P2.7).
12. Verify compiled CSS contains `var(--)` references in color utilities, not hex values.
13. Run style/lint verification (`el:check`, `sl:check`).

## Progress Checklist

- [x] P2.0 baseline audit and conflict resolution completed.
- [x] P2.1 color tokens and naming convention defined.
- [x] P2.2 semantic UI tokens defined, including skeleton and dark mode structure.
- [x] P2.3 spacing, typography, radius, shadow, and z-index scales defined in `@theme`.
- [x] P2.4 accessibility baseline added (focus-visible, contrast, reduced-motion).
- [x] P2.5 motion and transition tokens defined.
- [x] P2.6 font loading strategy implemented.
- [x] P2.7 global polish layer added.
- [x] P2 DoD verification completed.

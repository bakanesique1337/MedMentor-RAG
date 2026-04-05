# Phase 3 Plan: UI Kit (MVP Scope)

## Status

- [x] `P3.1` Base patterns and conventions implemented in `src/components/ui` with shared
  state vocabulary (`variant`, `size`, `disabled`, `loading`, `invalid`, `readonly`),
  slot naming, `v-model` contracts, and `utils.ts` class helpers.
- [x] `P3.2` Action and feedback primitives implemented:
  `VButton`, `VSpinner`, `VAlert`.
- [x] `P3.3` Form controls implemented:
  `VField`, `VInput`, `VTextarea`, `VSelect`, `VCheckbox`.
- [x] `P3.4` Surface and identity components implemented:
  `VCard`, `VBadge`, `VTag`, `VAvatar`.
- [x] `P3.5` Justified overlay/navigation components implemented:
  `VModal`, `VDropdown`, `VTooltip`.
- [x] `P3.6` Loading and empty-state primitives implemented:
  `VSkeleton`, `VEmptyState`.
- [x] Showcase integration added in `src/views/HomeView.vue`.
- [x] Verification passed:
  `bun run type-check`, `bun run el:check`, `bun run sl:check`, `bun run build`.

## Scope

Build a reusable UI kit in `src/components/ui` so all MVP screens can be assembled from
consistent primitives instead of page-level one-off controls.

## Phase Goal

Turn the design tokens and semantic conventions from `P2` into typed, accessible Vue
components with predictable prop APIs, stable slots, and unified interaction states.

## Inputs

- Master roadmap: `PLAN.md` (`P3`, `P3.1`, `P3.2`, `P3.3`, `P3.4`, `P3.5`, `P3.6`).
- Phase 2 design system decisions in `plans/phase-2.md`.
- Frontend foundation delivered in `P1` (router, types, constants, project structure).
- Project rules from `CLAUDE.md`, `.claude/rules/*`, and lint configs.
- Existing assets and CSS entrypoints in `src/assets/`.
- Available dependency baseline: `@vueuse/core` is already installed in the project and is allowed for low-overhead UI behavior helpers.

## Locked VueUse Usage For P3

Use only the following VueUse modules in the UI kit. They are considered the approved minimum set
because they reduce boilerplate without adding significant architectural complexity.

- `useVModel`
  - Required for `VInput`, `VTextarea`, `VSelect`, and `VCheckbox`.
  - Purpose: standardize `v-model` wiring with `modelValue` / `update:modelValue`.
- `onClickOutside`
  - Required for `VModal`, `VDropdown`, and any tooltip/popover-like primitive that closes on outside interaction.
  - Purpose: avoid manual document listeners and cleanup code.
- `onKeyStroke`
  - Required for keyboard dismissal and interaction handling in overlays.
  - Primary use: `Escape` handling in `VModal` and `VDropdown`.
- `useScrollLock`
  - Required for `VModal` and `VDrawer` if `VDrawer` is implemented.
  - Purpose: lock document scrolling during overlay interaction without custom body-scroll code.
- `useTextareaAutosize`
  - Required for `VTextarea` when used in chat/message composition flows.
  - Purpose: keep textarea growth behavior simple and reusable.
- `useEventListener`
  - Allowed as the low-level fallback only when the approved higher-level helpers above do not fully cover the interaction.
  - Purpose: handle rare UI events while still relying on automatic mount/unmount cleanup.

Rules:

- Do not add `@vueuse/integrations` in `P3`.
- Do not introduce additional VueUse modules into the UI kit unless the phase plan is updated explicitly.
- Prefer CSS and native browser behavior first; use VueUse only where it clearly removes repetitive event/state plumbing.

## Component Design Principles

- Components live in `src/components/ui/` and stay presentation-focused.
- Business logic, API calls, and page orchestration do not belong in the UI kit.
- Prefer explicit props and slots over hidden behavior or highly dynamic configuration objects.
- All visual states must come from semantic tokens and Tailwind utilities, not hardcoded colors.
- Every interactive component must expose loading, disabled, and focus-visible behavior where applicable.
- Prefer composition:
  - `VField` wraps labels, hints, validation, and help text.
  - input-like controls integrate with `VField` instead of duplicating field chrome.
- Keep prop APIs small. If a variant is not needed by MVP pages, do not add it yet.

---

## Tasks

### P3.1 Base Patterns And Conventions

Lock the internal conventions before building individual components.

- Define common prop patterns:
  - `variant`, `size`, `disabled`, `loading`, `invalid`, `readonly` where relevant.
- Standardize event shape for form controls:
  - Vue `v-model` via `modelValue` and `update:modelValue`.
- Standardize slot naming:
  - `default`, `label`, `hint`, `error`, `prefix`, `suffix`, `icon`.
- Decide class composition strategy:
  - use simple computed class maps inside components,
  - avoid introducing a variant library unless the repo already depends on one.
- Add a minimal shared utility if needed for class normalization, but do not create a generic abstraction too early.
- Establish accessibility defaults:
  - pass through native attributes,
  - preserve keyboard semantics,
  - expose `aria-*` hooks where native semantics are insufficient.

Goal: every later component follows the same API shape and state vocabulary.

---

### P3.2 Action And Feedback Primitives

Build the smallest components first because later controls depend on them visually.

#### `VButton`

Required capabilities:

- Variants:
  - `primary`
  - `secondary`
  - `ghost`
  - `danger`
- Sizes:
  - `sm`
  - `md`
  - `lg`
- States:
  - default
  - hover
  - active
  - disabled
  - loading
  - focus-visible
- Slots:
  - default label slot
  - optional leading icon slot
  - optional trailing icon slot

Behavior rules:

- Loading state disables repeated clicks.
- Button width must not jump when loading spinner appears.
- Native `type="button"` should be the default to avoid accidental form submits.

#### `VSpinner`

- Size variants aligned with button/icon sizing.
- Token-driven color variants:
  - neutral
  - primary
  - inverse
- Must work standalone and inside `VButton`.

#### `VAlert`

- Status variants:
  - `info`
  - `success`
  - `warning`
  - `error`
- Supports title, body, and optional action slot.
- Used for auth errors, simulation conflicts, empty/recovery messaging.

Goal: establish polished action and feedback primitives reused across all pages.

---

### P3.3 Form Controls

Build the MVP form set needed for login, profile, diagnosis selection, and chat input.

#### `VField`

Responsibilities:

- render label,
- optional required marker,
- hint text,
- validation error text,
- connect label and message IDs to the input via `for`, `aria-describedby`, and `aria-invalid`.

`VField` should be composable, not tightly coupled to one specific input implementation.

#### `VInput`

- Supports text-like types used in MVP:
  - `text`
  - `password`
  - `email`
  - `search`
- Optional prefix/suffix slots.
- Supports disabled, readonly, invalid, and placeholder states.

#### `VTextarea`

- For chat message input and longer settings fields.
- Supports min rows and manual resize policy.
- Invalid and disabled visuals must match `VInput`.

#### `VSelect`

- Native select is acceptable for MVP.
- Must support placeholder option, disabled options, and invalid state.
- Diagnosis selection UI can use this component unless P7 later requires a richer selector.

#### `VCheckbox`

- Needed for settings/preferences if present in profile flow.
- Provide label slot and descriptive text support via `VField` or inline props.

Rules:

- Do not build a custom combobox/autocomplete in MVP scope.
- Do not introduce masked inputs unless a real screen requires them.

Goal: all MVP forms can be built without custom handcrafted inputs.

---

### P3.4 Surface And Identity Components

These components provide the structural building blocks for cases, profile summaries, and chat metadata.

#### `VCard`

- Variants:
  - default
  - elevated
  - outlined
  - interactive
- Optional header, body, footer slots.
- Interactive variant must show clear hover/focus states without changing layout.

#### `VBadge`

- Compact status badge for difficulty, category, or state labels.
- Variants:
  - neutral
  - primary
  - success
  - warning
  - error

#### `VTag`

- Similar to `VBadge` but optimized for multi-tag case metadata.
- Must support wrapping without visual collisions.

#### `VAvatar`

- Fallback initials mode is enough for MVP.
- Optional image source support can exist, but fallback behavior is mandatory.
- Used for profile and chat participant affordances.

Goal: pages can express hierarchy, grouping, and lightweight identity consistently.

---

### P3.5 Overlay And Navigation Components

Only build the overlay/navigation primitives that are justified by MVP flows.

#### `VModal`

- Needed for confirmations, important warnings, or diagnosis confirmation flow if chosen later.
- Requirements:
  - open/close prop contract,
  - escape key support,
  - backdrop click behavior defined explicitly,
  - focus trap or at minimum deterministic focus handoff,
  - scroll locking.

#### `VDrawer`

- Optional but in-scope for mobile navigation or contextual side panels.
- Build only if AppLayout or chat UX genuinely needs it.
- If not immediately needed, document it as deferred rather than implementing speculative complexity.

#### `VDropdown`

- Use only for simple menu/content toggles.
- Must support keyboard close behavior and outside click handling.

#### `VTooltip`

- Keep minimal.
- Only use for supplementary hints, never critical information.
- Avoid hover-only access; content should remain non-essential.

#### `VTabs`

- Useful for profile/history/stats segmentation if that page adopts a tabbed layout.
- Keyboard support required if implemented.

#### `VPagination`

- Implement only if the cases list or history list actually needs paging in MVP.
- If backend volume stays small, document as deferred and omit implementation.

Goal: cover overlays and navigation patterns without bloating the UI kit with unused widgets.

#### Deferred Components (Explicit)

- `VDrawer`
  - Deferred.
  - Reason: current `AppLayout`, `ChatView`, and mobile navigation are still placeholder-level,
    so there is no concrete MVP flow that justifies side-panel complexity yet.
- `VTabs`
  - Deferred.
  - Reason: profile/history segmentation has not been implemented in `P7`, so tab semantics would
    be speculative and risk churn.
- `VPagination`
  - Deferred.
  - Reason: cases/history pages do not yet load real backend volume and the roadmap explicitly
    allows omission while list sizes remain small.

---

### P3.6 Loading, Empty, And Transitional States

The MVP includes asynchronous fetches and streaming chat, so empty and loading primitives are required.

#### `VSkeleton`

- Token-driven skeleton blocks for cards, forms, and chat placeholders.
- Support a few simple shapes:
  - line
  - rectangle
  - circle
- Optional shimmer animation based on P2 skeleton tokens.

#### `VEmptyState`

- Supports title, description, optional illustration/icon slot, and action slot.
- Used for:
  - no cases available,
  - no history,
  - missing profile data,
  - recoverable empty responses.

Rules:

- Loading and empty states must not be page-specific.
- Chat streaming placeholders should reuse `VSkeleton` or a thin wrapper built outside the UI kit.

Goal: MVP pages can communicate waiting, absence, and recovery states consistently.

---

## Recommended File Layout

Keep the folder shallow and predictable:

- `src/components/ui/VButton.vue`
- `src/components/ui/VSpinner.vue`
- `src/components/ui/VAlert.vue`
- `src/components/ui/VField.vue`
- `src/components/ui/VInput.vue`
- `src/components/ui/VTextarea.vue`
- `src/components/ui/VSelect.vue`
- `src/components/ui/VCheckbox.vue`
- `src/components/ui/VCard.vue`
- `src/components/ui/VBadge.vue`
- `src/components/ui/VTag.vue`
- `src/components/ui/VAvatar.vue`
- `src/components/ui/VModal.vue`
- `src/components/ui/VDrawer.vue` (only if justified)
- `src/components/ui/VDropdown.vue`
- `src/components/ui/VTooltip.vue`
- `src/components/ui/VTabs.vue`
- `src/components/ui/VPagination.vue` (only if justified)
- `src/components/ui/VSkeleton.vue`
- `src/components/ui/VEmptyState.vue`

If exports are centralized, add `src/components/ui/index.ts` only after at least several components exist.
Do not add a barrel file preemptively if imports stay clearer without it.

---

## Out Of Scope For P3

- Visual documentation site or Storybook setup.
- Full headless accessibility abstraction library migration.
- Rich text editor, combobox, autocomplete, date picker, or command palette.
- Animation-heavy components that are not tied to MVP workflows.
- Theme switcher implementation (the token structure already prepares for it in `P2`).
- Page-specific composites such as `CaseCard` or `ChatMessageBubble`; those belong to later feature phases.

---

## Definition Of Done (DoD)

- [x] UI kit components exist for all controls required by MVP pages.
- [x] Every implemented component uses semantic tokens and avoids hardcoded one-off colors.
- [x] Form controls support `v-model` and proper invalid/disabled states.
- [x] `VField` provides accessible label, hint, and error wiring.
- [x] `VButton` loading state prevents duplicate actions and preserves layout stability.
- [x] Overlay components, if implemented, support keyboard escape and predictable focus behavior.
- [x] Loading and empty states are covered by reusable primitives, not page-local markup.
- [x] Deferred components (`VDrawer`, `VPagination`, optional `VTabs`) are explicitly justified if omitted.
- [x] No `any`, no forbidden patterns from repo rules.
- [x] `bun run type-check` passes after implementation.

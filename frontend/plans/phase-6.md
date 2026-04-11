# Phase 6 Plan: Layout, Header, And Footer

## Scope

Build the final MVP layout shell around the already-locked nested route structure so
public and authenticated pages share consistent navigation, clear user status, and
stable page framing before `P7` fills in the feature pages.

## Phase Goal

Turn the current minimal layout wrappers into a reusable application shell with:

- a public header/footer pair for landing and public auth entry,
- an authenticated header/footer pair for protected pages,
- consistent content containers and responsive spacing,
- auth-aware navigation driven by the canonical `authGate` store from `P5`,
- layout contracts that `CasesView`, `ProfileView`, and `ChatView` can plug into
  without page-specific navigation hacks.

`P6` does not implement the full business content of `P7` pages. It owns the shared
layout structure and navigation surfaces those pages will live inside.

## Current State

- `frontend/src/components/layout/PublicLayout.vue`:
    - watches `auth=login` and `redirect` query params,
    - opens `AuthModal`,
    - cleans auth-related query params on modal close,
    - does not render header, footer, or a shared content frame.
- `frontend/src/components/layout/AppLayout.vue`:
    - only renders `<RouterView />`,
    - has no authenticated navigation shell,
    - has no logout entry point or user menu.
- `frontend/src/router/index.ts` already follows the locked nested-route strategy:
    - `PublicLayout` for `/`,
    - `AppLayout` for `/cases`, `/profile`, `/chat/:sessionId`,
    - route guard attached only to the AppLayout route.
- `frontend/src/stores/authGate.ts` from `P5` already provides:
    - `isAuthenticated`,
    - `user`,
    - `displayName`,
    - `logout()`,
    - auth modal control,
    - redirect preservation,
    - global `401` invalidation behavior.
- `frontend/src/views/CasesView.vue`, `ProfileView.vue`, and `ChatView.vue` are still
  placeholders, so `P6` must define layout slots and navigation contracts now to avoid
  reworking shell structure during `P7`.
- `frontend/src/views/HomeView.vue` is still a temporary UI-kit demo surface and must be
  treated as transitional when defining the public layout.

## Inputs

- Master roadmap: `PLAN.md` (`P6` and dependent `P7` page requirements).
- Previous detailed plans:
    - `plans/phase-4.md`
    - `plans/phase-5.md`
- Existing layout and auth files:
    - `src/components/layout/PublicLayout.vue`
    - `src/components/layout/AppLayout.vue`
    - `src/components/common/AuthModal.vue`
    - `src/stores/authGate.ts`
    - `src/router/index.ts`
    - `src/router/guards/auth.ts`
- Existing route names and app constants:
    - `src/constants/routes.ts`
- Existing UI-kit primitives from `P3`:
    - `VButton`
    - `VAvatar`
    - `VDropdown`
    - `VBadge`
    - `VAlert`
    - `VCard`
    - `VModal`
- Existing placeholder views that will consume the new shell:
    - `src/views/HomeView.vue`
    - `src/views/CasesView.vue`
    - `src/views/ProfileView.vue`
    - `src/views/ChatView.vue`
    - `src/views/NotFoundView.vue`

## Locked Decisions For P6

### Layout Ownership

- `PublicLayout.vue` and `AppLayout.vue` remain the only route-level layout wrappers.
- `App.vue` stays as a plain `<RouterView />`.
- Header and footer logic lives inside dedicated layout components, not inside views.
- Views may expose page-specific headings/actions, but they do not own global navigation.

### Component Targets

Create dedicated layout components instead of embedding large template blocks directly
inside `PublicLayout.vue` and `AppLayout.vue`.

Recommended file targets:

- `src/components/layout/TheHeader.vue`
- `src/components/layout/TheFooter.vue`
- optional focused subcomponents only if they keep the main files readable:
    - `src/components/layout/HeaderNavLink.vue`
    - `src/components/layout/UserMenu.vue`

Only split further if a single-file layout component becomes hard to scan.

### Header Variants

There are exactly two header modes in MVP:

- `public`
    - used on landing/public surfaces,
    - shows product identity and public CTA,
    - exposes auth entry through the fullscreen auth modal flow from `P5`.
- `app`
    - used on authenticated routes,
    - shows navigation to `Cases` and `Profile`,
    - shows current user identity,
    - exposes logout,
    - keeps chat reachable through route context rather than a permanent top-level CTA.

The chat page remains inside `AppLayout`, but the header does not need a persistent
`Chat` navigation item unless there is an active session context. Default MVP nav is:

- `Cases`
- `Profile`

### Footer Variants

There are exactly two footer modes in MVP:

- `public`
    - fuller informational footer for landing,
    - can include concise product/about/support copy,
    - should feel like a real product footer, not placeholder legal filler.
- `app`
    - compact low-noise footer for protected pages,
    - should avoid distracting from the working area.

### Auth Integration Boundary

- Auth state continues to come only from `authGate`.
- `P6` consumes auth state; it does not redesign auth behavior from `P5`.
- Public auth CTA must call canonical auth actions (`openAuthModal`, redirect helpers)
  rather than introducing ad hoc modal state.
- Logout must call `authGate.logout()` and route the user back to `ROUTES.HOME`.

### Route Awareness Rules

- Layout navigation uses named routes from `src/constants/routes.ts`.
- Active-link styling must be deterministic for:
    - `/cases`
    - `/profile`
    - `/chat/:sessionId`
- `Chat` should visually inherit the authenticated app shell while allowing the header
  to reduce noise compared with standard dashboard pages.

### Responsive Behavior

`P6` must define the MVP responsive shell behavior explicitly:

- desktop:
    - horizontal header navigation,
    - centered content container,
    - balanced footer columns on public pages.
- mobile:
    - stacked or wrapped navigation,
    - compact account controls,
    - no hover-only interaction dependency,
    - safe spacing around the fullscreen auth entry flow.

Avoid introducing a large off-canvas mobile nav unless necessary; MVP can use a compact
stacked header if it remains readable and accessible.

### Interaction And Accessibility Rules

- All navigation entries must be keyboard reachable.
- Current route must expose active state visually and, where practical, via `aria-current`.
- Dropdown-based account controls must remain operable without pointer hover.
- Logout must be disabled while pending.
- Layout chrome must not trap focus or conflict with the fullscreen auth modal.

## Tasks

### P6.0 Layout Audit And Shell Contract

Before building components, lock the responsibilities of each layer.

- Confirm `PublicLayout.vue` owns:
    - public header,
    - public footer,
    - auth-query/watch integration,
    - page container around `<RouterView />`.
- Confirm `AppLayout.vue` owns:
    - authenticated header,
    - compact footer,
    - protected content container,
    - logout/user-menu integration.
- Confirm views stay responsible only for page content and page-local actions.
- Define one shared content width strategy so `P7` pages do not each invent their own
  max-width wrappers.

Goal: one stable shell contract before visual/layout implementation starts.

---

### P6.1 Shared Header Component

Build the header as a reusable component with explicit variant props instead of
duplicating public and app markup.

#### Required Responsibilities

- render brand identity and home navigation,
- render variant-specific navigation/actions,
- expose active-link styling,
- expose auth-related CTA or account menu depending on variant,
- support responsive wrapping without layout breakage.

#### Recommended API Shape

- `variant: 'public' | 'app'`
- optional `showChatContext?: boolean`
- optional `chatSessionId?: string | number | null`
- optional event for account-menu close if needed

Only add props that correspond to real MVP shell behavior.

#### Public Variant Requirements

- brand/logo area linking to landing,
- primary CTA:
    - unauthenticated -> open fullscreen auth modal,
    - authenticated -> route to `ROUTES.CASES`,
- optional secondary public anchor/section links only if backed by actual landing sections.

#### App Variant Requirements

- brand/logo area,
- nav links for:
    - `ROUTES.CASES`
    - `ROUTES.PROFILE`
- user identity area using `authGate.displayName` and/or avatar initials,
- account menu or inline action area with:
    - profile shortcut if not redundant,
    - logout action.

#### Chat-Specific Noise Reduction

The chat page is a focused work surface. Header behavior there should:

- keep global app identity and escape routes,
- avoid oversized marketing or dense navigation,
- keep logout/profile accessible without dominating the page.

Goal: one header component that covers both route trees without branching logic spread
across views.

---

### P6.2 Shared Footer Component

Build the footer as a reusable component with explicit `public` and `app` variants.

#### Public Footer Requirements

- product/support-oriented content block,
- concise informational sections such as:
    - simulator purpose,
    - RAG/grounded-learning positioning,
    - navigation shortcuts where useful,
- current-year or product-signature copy if desired,
- visual weight appropriate for the landing page, not a dense corporate footer.

#### App Footer Requirements

- compact footprint,
- restrained text and spacing,
- no marketing-heavy sections,
- works under `/cases`, `/profile`, and `/chat/:sessionId` without reducing usable space.

Goal: footer behavior is standardized now so `P7` pages inherit a finished shell.

---

### P6.3 PublicLayout Finalization

Expand `PublicLayout.vue` from auth-query glue into the complete public shell.

#### Required Work

- mount `TheHeader` with `public` variant,
- mount `TheFooter` with `public` variant,
- preserve the existing auth-intent watcher and modal open behavior,
- preserve deterministic cleanup of:
    - `auth`
    - `redirect`
    - `authError`
- wrap the routed view in a stable content frame,
- ensure the fullscreen auth modal can overlay the header/footer cleanly.

#### Required Behavior

- landing remains accessible without authentication,
- direct navigation to `/?auth=login&redirect=...` still opens the auth modal,
- closing the modal cleans the query state consistently,
- authenticated users can still visit the public landing without broken CTA behavior.

Goal: public pages become real product surfaces instead of modal-host wrappers.

---

### P6.4 AppLayout Finalization

Expand `AppLayout.vue` into the canonical authenticated shell.

#### Required Work

- mount `TheHeader` with `app` variant,
- mount `TheFooter` with `app` variant,
- provide a consistent main content region for protected pages,
- wire logout through `authGate`,
- route back to landing after logout,
- expose route-aware header state for `/cases`, `/profile`, and `/chat/:sessionId`.

#### Required Behavior

- no duplicated auth checks inside layout components; guard remains on the route,
- shell should remain stable during page loading and future page-level skeleton states,
- logout from any protected page should:
    - disable repeated activation,
    - clear local auth state through `authGate`,
    - navigate to `ROUTES.HOME`.

Goal: protected routes gain one shared application frame before `P7` implements content.

---

### P6.5 Navigation State And Account Menu

Define the exact navigation-state behavior so `P7` pages inherit predictable header UX.

#### Active Link Rules

- `/cases` marks `Cases` active.
- `/profile` marks `Profile` active.
- `/chat/:sessionId` should not incorrectly mark unrelated nav entries active.
- If a generic app-section indicator is needed on chat, keep it contextual rather than
  pretending chat is part of `Profile` or `Cases`.

#### Account Control Rules

- use existing `VDropdown` only if it gives clearer interaction than inline actions,
- fallback to inline logout/profile actions if dropdown complexity is not justified,
- if dropdown is used:
    - close on outside click,
    - close on route change,
    - keep keyboard dismissal intact,
    - keep logout pending state visible.

Goal: auth-aware navigation works consistently and does not add fragile overlay behavior.

---

### P6.6 Transitional Integration With Current Views

Adapt the existing placeholder and demo pages so the new shell can land cleanly before `P7`.

#### HomeView

- remove dependence on being the only page-level shell,
- keep temporary landing/demo content inside the new public layout container,
- move top-level auth and navigation chrome responsibility into layout components,
- avoid duplicating sign-in/sign-out controls that now belong in the header.

#### Cases/Profile/Chat Placeholders

- ensure placeholder pages render cleanly inside the new app shell,
- add minimal section wrappers if needed for spacing consistency,
- avoid page-local faux headers that will be replaced in `P7`.

#### NotFound

- decide whether `NotFoundView.vue` should consume public-shell styling patterns or keep a
  standalone minimal layout,
- keep this choice consistent with router behavior and future design polish.

Goal: `P6` lands without waiting for full `P7` page rewrites.

---

### P6.7 Styling, Tokens, And Layout Utilities

Implement the shell styling using the existing tokenized system from `P2`.

#### Required Styling Areas

- header surface, border, and sticky/static behavior,
- footer surface and separators,
- main content min-height strategy,
- shared container widths and page gutters,
- mobile wrapping behavior,
- auth-modal stacking compatibility.

#### Rules

- use semantic token classes rather than ad hoc hardcoded colors,
- keep spacing aligned to the existing scale,
- do not introduce a parallel page-layout utility system unless repeated patterns clearly demand it.

Goal: layout chrome feels native to the design system rather than bolted on.

## Definition Of Done (DoD)

- [ ] `PublicLayout.vue` renders a complete public shell with header, footer, router view, and auth-modal integration.
- [ ] `AppLayout.vue` renders a complete authenticated shell with header, footer, and protected content frame.
- [ ] Dedicated shared header and footer components exist under `src/components/layout/`.
- [ ] Public header CTA uses canonical auth flow from `authGate`.
- [ ] Authenticated header exposes `Cases`, `Profile`, user identity, and logout access.
- [ ] Logout from the authenticated shell routes the user back to landing and respects pending state.
- [ ] Active navigation styling is deterministic and route-aware.
- [ ] Public footer and app footer use distinct variants appropriate to their route contexts.
- [ ] The shell is usable on mobile and desktop without hover-only dependencies.
- [ ] The fullscreen auth modal still opens correctly from public auth intent and layers above shell chrome.
- [ ] `HomeView.vue` no longer owns global auth/navigation chrome.
- [ ] Placeholder protected views render correctly inside the app shell without layout collisions.
- [ ] No page component hardcodes global header/footer behavior.
- [ ] No `any`, no forbidden equality operators, no duplicated auth state outside `authGate`.
- [ ] `bun run type-check` passes.
- [ ] `bun run el:check` passes.
- [ ] `bun run sl:check` passes.
- [ ] `bun run build` passes.

## Risks And Mitigations

**Risk: header/footer logic gets split between layouts and views, forcing cleanup again in `P7`.**
Mitigation: keep all global navigation chrome inside dedicated layout components and keep views content-only.

**Risk: authenticated header grows too complex before real page content exists.**
Mitigation: limit MVP app navigation to `Cases`, `Profile`, and account/logout actions; avoid speculative menus.

**Risk: chat inherits the same noisy shell as dashboard-style pages and loses focus.**
Mitigation: define chat-aware header restraint now, even if the same header component is reused with a lighter mode.

**Risk: public auth CTA and fullscreen modal behavior conflict with layout stacking or sticky header styles.**
Mitigation: verify modal layering, scroll locking, and query-driven open/close behavior after shell integration.

**Risk: mobile navigation becomes over-engineered or inaccessible.**
Mitigation: prefer a compact wrapping header over an unnecessary drawer unless real constraints force one.

**Risk: temporary `HomeView` demo controls duplicate the final header auth controls and confuse ownership.**
Mitigation: demote page-level auth/navigation buttons and make the layout the canonical entry surface.

**Risk: logout is wired in both header and views, causing inconsistent behavior.**
Mitigation: centralize logout entry in the authenticated shell and remove duplicate page-specific sign-out affordances.

## Execution Order

1. `P6.0` - audit layout ownership and define the shared shell contract.
2. `P6.1` - build the shared header component and finalize variant API.
3. `P6.2` - build the shared footer component and finalize variant API.
4. `P6.3` - integrate the public shell into `PublicLayout.vue` without regressing auth-query behavior.
5. `P6.4` - integrate the authenticated shell into `AppLayout.vue` and wire logout.
6. `P6.5` - finalize active navigation state and account-menu behavior.
7. `P6.6` - align current views with the new shell and remove duplicate page-level chrome.
8. `P6.7` - finish responsive styling and container rules.
9. Run verification:
    - `bun run type-check`
    - `bun run el:check`
    - `bun run sl:check`
    - `bun run build`

## Open Questions

1. Should the authenticated header include an explicit `Chat` nav item when the user is inside `/chat/:sessionId`, or
   should chat stay reachable only through in-flow navigation from cases/resume actions? Current recommendation: no
   permanent `Chat` nav item in MVP. Ответ: нет, кнопки Chat быть не должно, чат открывается только по клику на
   конкретный кейс
2. Should `NotFoundView.vue` be moved under `PublicLayout` styling in `P6`, or left as a standalone route and visually
   aligned later in `P7`? Current recommendation: keep it standalone unless layout reuse is trivial. Ответ: сделай
   отдельный лейаут для ошибок, немного другой стиль хидера для этого лейаута

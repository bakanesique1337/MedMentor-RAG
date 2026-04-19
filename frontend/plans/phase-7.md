# Phase 7 Plan: Page Implementation

## Scope

Implement the actual MVP pages on top of the completed foundation from `P1`-`P6`:

- landing page,
- final `404` page,
- cases list page,
- profile page,
- chat simulation page,
- session recovery flows tying cases and chat together.

`P7` is where the frontend stops being a shell and becomes the usable simulator product.
This phase owns page behavior, page-local state, and the end-to-end user flow from login
to case selection, simulation completion, and history review.

## Phase Goal

Ship all page-level MVP flows so an authenticated user can:

- discover the product on the landing page,
- sign in through the existing modal flow,
- browse and filter cases,
- resume an unfinished session,
- complete a full chat simulation with streaming replies and diagnosis,
- review profile/settings/history/stats,
- recover gracefully from refreshes, conflicts, and partial backend state.

## Current State

- Layout shell from `P6` exists:
  - `src/components/layout/PublicLayout.vue`
  - `src/components/layout/AppLayout.vue`
  - shared header/footer components already mounted there.
- Auth flow from `P5` exists and is wired through `authGate`.
- REST and streaming composables from `P4` already exist:
  - `src/composables/useCasesApi.ts`
  - `src/composables/useProfileApi.ts`
  - `src/composables/useSimulationApi.ts`
  - `src/composables/useSimulationSocket.ts`
- Main route views are still placeholders:
  - `src/views/HomeView.vue`
  - `src/views/CasesView.vue`
  - `src/views/ProfileView.vue`
  - `src/views/ChatView.vue`
- `src/views/NotFoundView.vue` exists, but is still minimal and does not yet implement
  the final auth-aware recovery actions required by `PLAN.md`.
- Type contracts for sessions, history, stats, settings, stream chunks, opening status,
  and simulation state already exist in `src/types/index.ts`.

## Inputs

- Master roadmap: `frontend/PLAN.md` (`P7`, `7.1`, `7.1.1`, `7.2`, `7.3`, `7.4`, `7.5`).
- Previous detailed phases:
  - `plans/phase-4.md`
  - `plans/phase-5.md`
  - `plans/phase-6.md`
- Existing layouts and auth/session infrastructure:
  - `src/components/layout/PublicLayout.vue`
  - `src/components/layout/AppLayout.vue`
  - `src/components/common/AuthModal.vue`
  - `src/stores/authGate.ts`
- Existing composables:
  - `src/composables/useCasesApi.ts`
  - `src/composables/useProfileApi.ts`
  - `src/composables/useSimulationApi.ts`
  - `src/composables/useSimulationSocket.ts`
- Existing route/view files:
  - `src/views/HomeView.vue`
  - `src/views/CasesView.vue`
  - `src/views/ProfileView.vue`
  - `src/views/ChatView.vue`
  - `src/views/NotFoundView.vue`
- Existing UI kit from `P3`.

## Locked Decisions For P7

### Page Ownership Boundary

- `P7` implements page content and page-local interaction logic.
- `P7` does not redesign the app shell, auth architecture, or transport layer.
- Views may introduce focused page subcomponents under feature folders when templates become
  too large, but shared UI primitives remain in `components/ui`.

### Recommended Feature Folders

If a view becomes hard to scan, split page-specific parts into feature folders:

- `src/components/home/`
- `src/components/cases/`
- `src/components/profile/`
- `src/components/chat/`

Create these only for real complexity. Do not scatter one-file fragments prematurely.

### Cases Data Strategy

- Fetch `/api/cases` once on page mount.
- Apply all category/difficulty filtering client-side through computed state.
- Do not add backend-driven pagination or search in MVP.

### Active Session Strategy

- `/cases` owns the active-session discovery entry point through `GET /api/simulations/active`.
- There is no auto-redirect from `/cases` to `/chat/:sessionId`.
- The user must explicitly choose to resume.

### Chat Source Of Truth

- Route param `sessionId` remains the only chat session identifier.
- REST remains the canonical source of truth for session snapshots.
- WebSocket streaming augments the active timeline but does not replace REST revalidation.
- On refresh, recovery starts with `GET /api/simulations/{sessionId}` before any stream UI is rebuilt.

### Conflict Handling Strategy

- `409` responses are expected business-state responses in this phase.
- They must render inline, contextual UI on the affected page:
  - cases start conflict -> resume-focused action,
  - chat send/diagnose conflict -> stateful explanation and refresh/retry guidance.
- Do not reduce these to generic global alerts or console-only errors.

### Profile Scope

- MVP profile includes:
  - identity summary,
  - editable display name,
  - safe pass-through settings editing,
  - stats overview,
  - history list with access to detail.
- `P7` does not invent new backend settings fields. Unknown keys must survive save.

## Tasks

### P7.0 Page Audit And File Ownership

Before implementation, lock where each concern lives.

- Keep route views as orchestration points for page state, loading/error branching, and layout composition.
- Move bulky repeated UI blocks into page-specific components only when they improve readability.
- Keep API calls inside existing composables; do not reintroduce `fetch()` inside views.
- Keep route parsing, query sync, and session recovery in the relevant view/composable pair.
- Add small page-specific utilities/constants where useful:
  - `src/constants/simulationQuickPrompts.ts`
  - format helpers under `src/utils/`

Goal: each page has one obvious entry file and clear supporting boundaries.

---

### P7.1 Landing Page (`HomeView.vue`)

Replace the temporary UI-kit showcase with the real public landing page.

#### Required Content

- hero section with clear simulator value proposition,
- explanation of how a training session works,
- explanation of the fact-grounded / RAG-backed learning approach,
- benefits section aimed at students and CME-style training,
- primary CTA that opens auth modal for unauthenticated users,
- authenticated CTA that routes directly to `ROUTES.CASES`.

#### UX Rules

- Keep the page consistent with the light medical/high-trust visual direction from `P2`.
- Use real page sections and hierarchy, not a component gallery.
- Preserve good scanability on mobile and desktop.
- Reuse the public header/footer from `P6`; do not duplicate auth entry controls inside content
  unless they reinforce the main CTA.

#### Implementation Notes

- Remove the temporary demo-only imports from `HomeView.vue`.
- Keep CTA behavior wired through `authGate.openAuthModal()` and route names/constants.
- If section links are added in the public header, they must target real landing sections.

Goal: public visitors understand the product and have one clear path into the app.

---

### P7.1.1 Final `404` Page (`NotFoundView.vue`)

Upgrade the existing minimal `404` page to the final MVP recovery page.

#### Required Behavior

- show a clear not-found message,
- always provide a "Go to landing" action,
- provide a "Go to cases" action when the user is authenticated,
- keep styling aligned with the design system and current error layout.

#### UX Rules

- Do not show dead-end copy with only one escape hatch.
- Keep the page compatible with both unauthenticated and authenticated contexts.
- Reuse current router-based navigation and auth state instead of hardcoding paths.

Goal: unknown routes recover users back into the correct part of the app quickly.

---

### P7.2 Cases List Page (`CasesView.vue`)

Implement the main case discovery and session-entry surface.

#### Required Data

- `GET /api/cases` on mount,
- `GET /api/simulations/active` on mount,
- local refs/computed values for:
  - full case list,
  - selected category filter,
  - selected difficulty filter,
  - active session metadata,
  - pending state for initial load,
  - pending state for start action per case or globally,
  - contextual page-level error and conflict state.

#### Required UI

- page heading and supporting description,
- category filter control,
- difficulty filter control,
- result count or empty-state feedback,
- responsive case card grid/list,
- case cards showing:
  - title,
  - category,
  - difficulty,
  - tags,
  - patient preview,
- "Start case" CTA,
- "Resume session" CTA on the active case card when applicable.

#### Start Flow

- clicking start calls `useSimulationApi().start(caseId)`,
- on success navigate to `ROUTES.CHAT` with returned `sessionId`,
- while pending:
  - disable repeated start actions,
  - preserve clear feedback on the initiating card.

#### Conflict Handling

- if start returns `409`, do not show generic failure copy,
- refresh or reconcile active-session state,
- surface a resume-focused explanation,
- provide a direct resume action when the active session is known.

#### Filtering Rules

- filters are computed locally from the fetched case array,
- filter options may be derived from available case data,
- empty filtered results must render a purposeful empty state with reset action.

#### Suggested Supporting Components

- `CaseCard.vue`
- `CasesFilters.vue`
- `ActiveSessionBanner.vue` or equivalent

Only extract them if `CasesView.vue` becomes difficult to scan.

Goal: users can browse cases, understand case metadata, and enter or resume a simulation cleanly.

---

### P7.3 Profile Page (`ProfileView.vue`)

Implement the full MVP profile/settings/analytics/history page.

#### Required Data Loads

- `GET /api/settings`
- `GET /api/stats/overview`
- `GET /api/history`

Prefer parallel loading where the UX benefits and failure handling remains understandable.

#### Required Sections

- identity summary:
  - display name,
  - username (read-only),
- editable settings form:
  - editable `displayName`,
  - safe preservation of unknown `settings` keys on save,
- learning analytics:
  - completed sessions,
  - average score metrics from overview,
- session history list:
  - compact summary per item,
  - access to detail or deep-link behavior for follow-up inspection.

#### Save Flow

- submitting changes calls `useProfileApi().updateSettings(...)`,
- disable submit while pending,
- show success and error feedback inline,
- keep the canonical auth/session display name synchronized if profile changes affect it.

#### History Rules

- empty history renders a meaningful empty state, not a blank panel,
- history entries should expose enough metadata to decide whether to inspect them,
- if history detail is shown in-page, keep it secondary to the main profile form and stats;
  if it routes elsewhere, the route target must already exist.

#### Suggested View Composition

- top summary card,
- settings form card,
- stats card/grid,
- history card/list.

Goal: authenticated users can edit profile basics and review training progress from one stable page.

---

### P7.4 Chat Simulation Page (`ChatView.vue`)

Implement the full simulation workspace for all supported backend session states.

#### Required Route Contract

- read `sessionId` only from the route param,
- validate/coerce through existing simulation API methods,
- treat invalid/missing route params as blocking page errors with an escape route back to cases.

#### Required Initial Load

- call `getSession(sessionId)` on mount,
- branch rendering by session lifecycle state,
- connect streaming transport only after the initial session snapshot is known.

#### Required Layout

- left sidebar with case/session metadata,
- main chat timeline,
- bottom message input bar,
- quick-action buttons above the input,
- diagnosis entry surface based on backend `diagnosisOptions`,
- completion/review section when the session is done.

#### Timeline Behavior

- render existing `messages` in order,
- preserve role distinction between doctor and patient messages,
- support one active streaming bubble at a time,
- show loading/streaming placeholders when opening or patient reply is still in progress,
- keep scroll behavior usable during long conversations.

#### Opening Lifecycle

- if `openingStatus` is `OPENING_PENDING` or `OPENING_STREAMING`:
  - show non-interactive waiting UI,
  - connect to stream,
  - progressively append opening chunks,
  - keep message input disabled.
- if `openingStatus` is `OPENING_FAILED`:
  - show actionable retry UI,
  - call `getSession(sessionId, { retryOpening: true })` on retry,
  - reset local transient stream state before listening again.
- enable freeform messaging only when:
  - `openingStatus === 'OPENING_READY'`
  - and session `state === 'IN_PROGRESS'`
  - and no patient response is currently in flight.

#### Message Lifecycle

- send doctor message with `sendMessage(sessionId, content)`,
- append/reflect the doctor message in the timeline according to returned and refreshed session state,
- start patient-response streaming UI immediately after accepted send,
- disable repeated sends while the backend is generating a reply,
- on stream completion:
  - finalize the active patient bubble,
  - refresh canonical session state when needed to reconcile ordering/state.

#### Quick Actions

Implement three fixed quick prompts above the input:

- physical examination,
- laboratory diagnostics,
- instrumental diagnostics.

Rules:

- store prompt definitions in `src/constants/simulationQuickPrompts.ts`,
- render buttons from a typed config array,
- send them through the same `sendMessage()` path as normal doctor messages,
- disable them under the same conditions as the regular input.

#### Diagnosis Flow

- render diagnosis action only when session state allows it,
- use backend-provided `diagnosisOptions` as the sole diagnosis source,
- do not allow arbitrary free-text diagnosis input unless the backend contract explicitly supports it,
- submit through `diagnose(sessionId, diagnosis)`,
- after success render scoring/completion state from returned or refreshed session data.

#### Completion View

- display score metrics,
- display `result.summary`,
- provide a clear return path to cases,
- keep the completed conversation readable for review.

#### Conflict And Error Handling

- map `409` responses to clear state-specific messages:
  - opening still running,
  - reply already in flight,
  - diagnosis not currently allowed,
  - message limit reached,
- map transport/socket failures to actionable recovery:
  - reconnect stream when reasonable,
  - allow explicit session refresh,
  - keep REST refresh as fallback.

#### Suggested Supporting Components

- `ChatSidebar.vue`
- `ChatTimeline.vue`
- `ChatMessageBubble.vue`
- `ChatInputBar.vue`
- `DiagnosisModal.vue`
- `SessionScoreCard.vue`

Extract only where it improves readability and testability.

Goal: the simulation page handles opening, active chat, diagnosis, scoring, and completion without route hacks.

---

### P7.5 Session State Recovery

Implement recovery across both entry points defined in `PLAN.md`.

#### Cases Resume Flow

- on `/cases` mount, load active session once,
- if present, surface resume affordance without auto-navigation,
- make the relationship between active session and matching case visually obvious.

#### Chat Refresh Recovery

- on `/chat/:sessionId` mount, rebuild page state from `getSession(sessionId)`,
- if `streamingStatus.inFlight === true`, restore the transient streaming UI:
  - `type === 'opening'` -> restore opening target/loading state,
  - `type === 'message'` -> restore pending patient-reply state,
- reconnect the socket for the same session when recovery requires live chunks,
- reconcile local transient content with fresh REST state after stream completion or reconnect.

#### Recovery Rules

- never rely on stale in-memory state alone after refresh,
- transient local streaming state must be disposable and rebuildable,
- if recovery becomes inconsistent, prefer a fresh REST session snapshot over preserving local draft UI.

Goal: refreshes and unfinished sessions feel stateful and recoverable instead of broken.

---

### P7.6 Cross-Page Empty, Loading, And Error States

Normalize page-level non-happy-path behavior across all `P7` views.

#### Required Coverage

- landing: no blocking dependencies, but CTA/auth state must degrade gracefully,
- cases: initial loading, fetch failure, empty result, filtered empty result, start conflict,
- profile: loading, partial section failure, save failure, empty history,
- chat: invalid session id, missing session, opening failure, stream failure, business conflicts,
- `404`: authenticated vs unauthenticated action branching.

#### UX Rule

- prefer inline `VAlert`, `VEmptyState`, `VSkeleton`, and disabled states over global opaque failures,
- keep every blocking error paired with at least one recovery or escape action.

Goal: the MVP feels deliberate under real backend behavior, not only on happy paths.

## Definition Of Done (DoD)

- [ ] `HomeView.vue` is a real landing page, not a UI-kit demo.
- [ ] `NotFoundView.vue` includes landing action and auth-aware cases action.
- [ ] `CasesView.vue` loads cases and active session, supports local filtering, and starts/resumes sessions.
- [ ] `ProfileView.vue` loads settings, stats, and history, and supports safe settings update.
- [ ] `ChatView.vue` supports opening, in-progress, diagnosis, scoring, and completed states.
- [ ] Quick-action prompts are stored in `src/constants/simulationQuickPrompts.ts`.
- [ ] Chat input and quick actions obey backend opening/in-flight restrictions.
- [ ] `409` business-state responses are rendered contextually in cases/chat flows.
- [ ] Session refresh recovery works from `GET /api/simulations/{sessionId}` plus streaming restoration.
- [ ] All page-level loading, empty, and error states have explicit UI treatment.
- [ ] `bun run type-check` passes.
- [ ] `bun run el:check` passes.
- [ ] `bun run sl:check` passes.
- [ ] `bun run build` passes.

## Risks And Mitigations

**Risk: chat page complexity grows into an unreadable single file.**
Mitigation: keep `ChatView.vue` as the orchestration layer and split timeline/sidebar/input/diagnosis
into focused feature components once the template stops being easy to scan.

**Risk: stream UI drifts away from canonical REST session state.**
Mitigation: treat REST as the source of truth, use stream chunks only for progressive rendering,
and revalidate session state after major stream transitions when needed.

**Risk: backend conflict states are handled inconsistently.**
Mitigation: centralize page-level conflict mapping logic per feature and write down the expected
UI response for each known `409` scenario before implementing handlers.

**Risk: profile settings update drops unknown backend fields.**
Mitigation: keep all updates routed through `useProfileApi().updateSettings()` and its `mergeSettings`
path; do not construct settings payloads ad hoc inside the view.

**Risk: cases page overcomplicates filtering beyond MVP.**
Mitigation: lock filters to category and difficulty only, computed from one fetched dataset.

**Risk: refresh recovery depends too heavily on transient local refs.**
Mitigation: start every recovery from `getSession(sessionId)` and rebuild temporary stream UI from
`streamingStatus`, not from stale component state.

## Suggested Execution Order

1. `P7.0` page audit and file targets.
2. `P7.1` landing page replacement, so the public surface is no longer temporary.
3. `P7.1.1` final `404` page, since it is small and clarifies public/auth recovery behavior.
4. `P7.2` cases page, because it is the entry point into the simulator flow.
5. `P7.3` profile page, because it is independent of chat complexity and uses existing APIs.
6. `P7.4` chat page implementation.
7. `P7.5` session recovery refinement across cases/chat.
8. `P7.6` cross-page loading/error/empty-state pass.
9. Final verification:
   - `bun run type-check`
   - `bun run el:check`
   - `bun run sl:check`
   - `bun run build`

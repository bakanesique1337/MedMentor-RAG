# Frontend Plan (MedMentor-RAG)

## Goal

Build an MVP frontend for the medical training simulator with:

- stable design system on Tailwind utility classes,
- reusable UI kit,
- typed API layer via composables and `useFetch` from VueUse (`createFetch` wrapper
  with base URL, `credentials: "include"`, and shared error hooks),
- authentication flow aligned with backend auth,
- core pages: landing, cases list, login, chat simulation.

## Constraints And Standards

- Stack: Vue 3 + Composition API + TypeScript + Tailwind 4 + Vite + Bun.
- No `any`, no `==`/`!=`, no `px` for sizes except `1px` borders.
- ASCII-only source text.
- Prefer composables for logic, UI components for presentation.
- Keep spacing scale based on `0.8rem` step and values divisible by 2 in design token scale.

## Architectural Decisions (Locked)

These decisions are final for MVP scope.
Changing any of them requires updating all dependent phases (P1, P4, P6, P7).

### Layout Strategy: Nested Routes

App shell uses two layout routes via Vue Router v4 nested routes.
`App.vue` renders only `<RouterView />` with no conditional layout logic.

```
PublicLayout  (no auth required)
  /           landing
  /login      login page

AppLayout     (auth required, guarded)
  /cases      cases list
  /profile    profile and settings
  /chat/:sessionId  simulation chat
```

Layout components: `components/layout/PublicLayout.vue`, `components/layout/AppLayout.vue`.
Route guard is attached to AppLayout route, not to individual child routes.

### API Layer: createFetch

Feature composables use a shared `useFetch` instance created via `createFetch` from VueUse:

- base URL from `import.meta.env.VITE_API_BASE_URL`,
- `credentials: "include"` for session cookie auth,
- shared error normalization in `afterFetch` and `onFetchError` hooks,
- typed response wrappers via generic helpers.

Each feature composable (`useAuthApi`, `useCasesApi`, `useSimulationApi`, `useProfileApi`)
wraps calls from this shared instance. The shared instance is defined once in `composables/useApi.ts`.

### Backend Contract Alignment

Frontend MVP must follow the current backend contract exactly.
Do not design against earlier REST assumptions.

Authenticated REST endpoints used by MVP:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/cases`
- `GET /api/simulations/active`
- `POST /api/simulations/start`
- `GET /api/simulations/{sessionId}`
- `POST /api/simulations/{sessionId}/message`
- `POST /api/simulations/{sessionId}/diagnose`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/history`
- `GET /api/history/{sessionId}`
- `GET /api/stats/overview`

Backend endpoints under `/api/rag/*` are debug/testing endpoints only.
They are not part of MVP frontend scope.

### Simulation Lifecycle Contract

The simulation flow is stateful and not a single synchronous request/response loop.
Frontend must model backend lifecycle explicitly.

Session state values:

- `CASE_STARTED`
- `IN_PROGRESS`
- `DIAGNOSIS_SELECT`
- `SCORING`
- `COMPLETED`

Opening status values:

- `OPENING_PENDING`
- `OPENING_STREAMING`
- `OPENING_READY`
- `OPENING_FAILED`

Important behavior:

- starting a session returns `OPENING_STARTED`, not a ready-to-chat session,
- opening patient message is generated asynchronously,
- chat input must stay disabled until `openingStatus === "OPENING_READY"` and session state allows messaging,
- if opening generation fails, chat page must offer retry by reloading the session with `retryOpening=true`,
- backend allows only one unfinished session per user; starting another returns conflict.

### Streaming Strategy: VueUse `useWebSocket`

Chat streaming uses backend WebSocket/STOMP infrastructure.
Frontend implementation should use VueUse `useWebSocket` as the transport primitive.

MVP scope for chat UX:

- use REST for authenticated state-changing commands:
  `POST /api/simulations/start`,
  `POST /api/simulations/{sessionId}/message`,
  `POST /api/simulations/{sessionId}/diagnose`,
  `GET /api/simulations/{sessionId}`,
- use WebSocket connection for receiving streamed AI chunks for simulation opening and patient replies,
- keep REST session model and route model unchanged.

Implementation note:

- backend exposes STOMP/SockJS endpoint at `/ws` and publishes simulation chunks to `/topic/simulations/{sessionId}`,
- frontend should encapsulate socket connection details in a dedicated composable,
- if direct STOMP integration becomes necessary, keep it behind that composable so page components still consume a simple streaming API.

### Chat URL And Session Start Flow

```
User selects a case on /cases
  -> POST /api/simulations/start (start with caseId)
  -> on success: router.push({ name: ROUTES.CHAT, params: { sessionId } })
  -> /chat/:sessionId loads session via id and waits for opening stream / opening completion

User returns to /cases with an active session
  -> cases page calls GET /api/simulations/active on mount
  -> if active session exists: show "Resume" CTA linking to /chat/:sessionId
  -> no automatic redirect (user intent must be explicit)

User refreshes /chat/:sessionId
  -> chat page loads session via GET /api/simulations/:sessionId
  -> if opening failed: user can trigger GET /api/simulations/:sessionId?retryOpening=true
```

No `/chat/active` route. Session ID is always explicit in the URL.
`/api/simulations/active` is an API call, not a frontend route.

## Planning Format For Future Agents

- Use a hybrid planning format for large scopes:
- keep this `PLAN.md` as the master roadmap (phases, dependencies, global status),
- store deep implementation details per phase in separate files (example: `plans/phase-1.md`, `plans/phase-2.md`).
- When a phase grows, move details out of `PLAN.md` instead of expanding one long file.
- Current detailed phase file: `plans/phase-1.md`.

## Phase 1. Foundation And Architecture

1. Define target frontend structure (folders for `composables`, `services`, `components/ui`,
   `components/layout`, `views`, `types`, `utils`, `constants`, `stores`).
2. Configure base app shell and router map using nested layout routes (see Architectural Decisions).
3. Add shared constants for API base URL and route names.
4. Define strict TypeScript domain models for auth, case cards, simulation session, messages,
   stats, websocket chunks, and API errors. Remove all `any` from existing type files.

Deliverables:

- predictable file structure with Vue starter artifacts removed,
- typed entities and route contracts,
- nested layout routes skeleton ready for feature work.

## Phase 2. Design System (Tailwind-Based)

1. Introduce design tokens in CSS variables and map them to Tailwind classes:

- `base` palette,
- `primary`,
- `secondary`,
- `tertiary`,
- `success`,
- `info`,
- `warning`,
- `error`.

2. Establish neutral and light visual direction with green accent family for medical/high-tech learning mood.
3. Define semantic tokens:

- surfaces/backgrounds,
- text hierarchy,
- borders/dividers,
- interactive states (`default`, `hover`, `active`, `disabled`, `focus`).

4. Build spacing/radius/shadow/type scales:

- spacing base unit `0.8rem`,
- scale values strictly aligned with even step system,
- rem-only dimensions (except `1px` border).

5. Add accessibility baseline: color contrast, focus-visible styles, keyboard states.

Deliverables:

- tokenized theme foundation,
- consistent utility-first conventions,
- reusable visual primitives for all pages.

## Phase 3. UI Kit (MVP Scope)

Create reusable components in `components/ui`:

1. `VButton` (variants, sizes, loading, icon slots).
2. `VInput`, `VTextarea`, `VSelect`, `VCheckbox`, `VField` wrapper (label, hint, error).
3. `VCard`, `VBadge`, `VTag`, `VAvatar`.
4. `VModal`, `VDrawer`, `VDropdown`, `VTooltip` (minimum needed for chat and diagnosis flow).
5. `VTabs`, `VPagination` (if case list volume requires paging).
6. Utility components: `VSpinner`, `VSkeleton`, `VEmptyState`, `VAlert`.

Deliverables:

- documented prop API per component,
- consistent states and validation visuals,
- enough coverage to build all required screens without custom one-off controls.

## Phase 4. Data Layer With Composables (`useFetch`)

1. Create shared API instance via `createFetch` from VueUse in `composables/useApi.ts`:

- base URL from `import.meta.env.VITE_API_BASE_URL`,
- `credentials: "include"` for cookie auth,
- error normalization in `afterFetch` / `onFetchError` hooks,
- typed response wrappers via `ApiResponse<T>`.

2. Create feature composables using the shared instance:

- `useAuthApi` (`login`, `logout`, `me`),
- `useCasesApi` (`getCases`),
- `useSimulationApi` (`start`, `active`, `getSession`, `sendMessage`, `diagnose`),
- `useProfileApi` (`settings`, `updateSettings`, `history`, `stats`).

3. Create streaming composables around VueUse `useWebSocket`:

- `useSimulationSocket` for connection lifecycle and chunk subscription by `sessionId`,
- typed chunk parsing for `chunk`, `done`, `error`,
- reconnect / stale-session handling appropriate for chat page recovery.

4. Add request state patterns:

- `isLoading`,
- `error`,
- optimistic/disabled states where needed.

5. Add route guard strategy:

- guard attached to AppLayout parent route,
- calls `useAuthApi.me()` on bootstrap,
- redirects unauthenticated users to `/login` with `redirect` query param.

Deliverables:

- typed and reusable API contracts,
- deterministic loading/error behavior,
- auth-aware navigation.

## Phase 5. Authentication Flow

1. Build login page and form validation.
2. Implement auth store/composable for session lifecycle:

- bootstrap on app start (`/api/auth/me`),
- login/logout methods,
- user identity exposure to layout/profile.

3. Protect routes: AppLayout route guard blocks unauthenticated access.
4. Handle 401/403 globally and trigger sign-out/re-auth behavior.

Important note:

- MVP uses current backend auth as-is: server-side HTTP session cookie (`JSESSIONID`).
- All protected requests must use `credentials: "include"`.

Deliverables:

- complete MVP login/logout flow,
- persistent session across page refresh,
- protected content access control.

## Phase 6. Layout: Header And Footer

1. Implement `PublicLayout`, `AppLayout`, `TheHeader`, and `TheFooter`
   as nested route components (see Architectural Decisions).
2. Header variants:

- public (landing/login),
- authenticated (cases/profile/chat access, user menu, logout).

3. Footer variants:

- compact for app pages,
- full informational block for landing.

Deliverables:

- unified navigation framework for main and profile pages,
- clear user status and navigation pathways.

## Phase 7. Page Implementation

### 7.1 Landing Page

1. Hero with value proposition of simulator.
2. Sections: training mechanics, RAG fact-grounded approach, benefits for students/CME.
3. CTA to login and start first case.

### 7.1.1 Error Page (404)

1. Create dedicated `404` page for unknown routes.
2. Show clear error message and actions:

- go to landing,
- go to cases (if authenticated).

3. Keep visual style aligned with design system.

### 7.2 Cases List Page

1. Load cards from `/api/cases`.
2. Strict client-side filtering (single fetch, local computed filters):

- by medical category,
- by difficulty.

3. Card UI includes title, category, difficulty, tags, patient preview.
4. On mount: call `GET /api/simulations/active`. If active session exists, show
   "Resume session" CTA on the active case card.
5. If backend returns conflict on start because an unfinished session already exists,
   surface a clear resume-focused action instead of generic error text.
6. Start action: `POST /api/simulations/start` with `caseId`, then
   `router.push({ name: ROUTES.CHAT, params: { sessionId } })`.

### 7.3 Login Page

1. Username/password form only (no registration for MVP).
2. Validation + backend error mapping.
3. Redirect after successful auth to cases list page.

### 7.4 Chat Simulation Page

1. Receives `sessionId` via route param. No internal session resolution required.
2. Main layout:

- left sidebar with case/session metadata,
- central chat timeline,
- bottom input bar.

3. Quick action buttons above input:

- request physical examination data,
- request lab/instrumental diagnostics.

4. Diagnosis modal:

- input selected diagnosis from backend-provided `diagnosisOptions`,
- submit to `/api/simulations/{id}/diagnose`.

5. Session completion view:

- score metrics,
- AI summary/feedback (`result.summary`),
- option to return to cases.

6. Opening lifecycle handling:

- initial page load always fetches `GET /api/simulations/{sessionId}`,
- if `openingStatus` is pending/streaming, show non-interactive loading state in timeline,
- consume streamed opening chunks over WebSocket and append them progressively,
- if `openingStatus === OPENING_FAILED`, show retry CTA and call
  `GET /api/simulations/{sessionId}?retryOpening=true`,
- enable chat input only after `openingStatus === OPENING_READY` and `state === IN_PROGRESS`.

7. Message lifecycle handling:

- sending a doctor message remains REST-based via `POST /api/simulations/{id}/message`,
- patient reply is streamed over WebSocket into the active timeline item,
- use `streamingStatus.inFlight` and `streamingStatus.type` from session payload
  to restore in-progress UI after refresh,
- disable input while a message response is in flight.

8. Backend rule handling:

- max 10 doctor messages per session,
- backend may reject sends/diagnosis while AI response is already in flight,
- backend may reject sends before opening is ready,
- frontend must map `409` conflict responses to clear stateful UI messages, not generic toast-only failures.

### 7.5 Session State Recovery

Two scenarios, both handled without a dedicated route:

1. **Resume from cases page**: `GET /api/simulations/active` on mount of `/cases`.
   If active: show "Resume" CTA. User explicitly navigates to `/chat/:sessionId`.
2. **Refresh recovery**: On mount of `/chat/:sessionId`, load full session state
   via `GET /api/simulations/:sessionId`. Chat page must handle both
   opening, in-progress, scoring, and completed session states from this single endpoint.

Recovery details:

- if `streamingStatus.inFlight === true`, rebuild the transient streaming UI after refresh,
- if `streamingStatus.type === "opening"`, restore opening loader / chunk target,
- if `streamingStatus.type === "message"`, restore pending patient reply state,
- after reconnect or stream completion, refresh canonical session state from REST when needed.

Deliverables:

- full end-to-end simulator flow from case selection to final review.

## Phase 8. Quality And Delivery

1. Add basic unit tests for composables and critical UI states.
2. Add integration checks for auth guards and primary API flows.
3. Run checks:

- `bun run type-check`,
- `bun run el:check`,
- `bun run sl:check`,
- `bun run build`.

4. Final UX pass: loading, empty, error, and edge states for all pages.

Deliverables:

- stable MVP frontend ready for backend integration and demo.

## Feature Spec: Chat Quick Prompts

For 3 quick-action buttons above message input, use fixed templates and send them as regular user messages to
`/api/simulations/{id}/message`.

Recommended prompt templates:

1. Physical exam:
   `Please provide objective physical examination findings for this patient at the current stage. Include general appearance, vital signs, and key system-specific findings relevant to this case. Respond only with findings that are available in the case data.`
2. Laboratory diagnostics:
   `Please provide available laboratory test results for this patient at the current stage. Include test name, value, units, and reference interpretation if present in case data. Respond only with available data and do not invent missing results.`
3. Instrumental diagnostics:
   `Please provide available instrumental and imaging study results for this patient at the current stage. Include modality, key findings, and formal impression if present in case data. Respond only with available data and do not add assumptions.`

Placement decision:

- Store prompt templates in frontend constants to keep UI components dumb and make prompts testable/versioned.
- Suggested file: `src/constants/simulationQuickPrompts.ts`.
- Export typed keys and labels to render quick-action buttons from one source of truth.

## Feature Spec: Profile Page With Settings

MVP profile includes both overview and editing via `/api/settings`.

Profile sections:

1. User identity:

- `displayName`,
- `username` (read-only).

2. Editable settings form:

- editable `displayName`,
- `settings` payload from backend is `Map<String, Object>`, so MVP form should support:
- known typed fields (when introduced),
- safe pass-through for unknown keys to avoid data loss on update.

3. Learning analytics:

- `/api/stats/overview` metrics.

4. Session history:

- `/api/history` list with access to details.

Required frontend changes:

1. Add `useProfileApi` methods for `GET /api/settings` and `PUT /api/settings`.
2. Add typed `UserSettingsDto` with `Record<string, unknown>` for the settings map
   and a safe merge strategy: spread known typed fields, preserve unknown keys on save.
3. Add save UX states (disable submit while pending, show success/error message).
4. Ensure profile route is auth-protected (covered by AppLayout guard).

## Feature Spec: Simulation Streaming

Simulation chat is not fully REST-only.
MVP frontend should support server-pushed streaming for opening and patient reply rendering.

Required behavior:

1. Establish a WebSocket connection through VueUse `useWebSocket`.
2. Subscribe / listen for simulation chunks associated with the current `sessionId`.
3. Handle chunk types:

- `chunk`: append content to the active streaming bubble,
- `done`: finalize the active streaming bubble and clear pending state,
- `error`: stop pending state, surface actionable error, allow session refresh.

4. Keep transport concerns outside page components in a dedicated composable.
5. Maintain REST as the source of truth for initial session fetch, mutation commands,
   and recovery after reconnect or stream errors.

## Cross-Cutting Notes

- Backend responses are strongly typed in Java DTOs; frontend must mirror exact field names.
- `/api/cases` currently supports optional server filter by `category`, but requested MVP
  includes client-side filtering.
- For auth requests and all protected API calls, `credentials: "include"` is mandatory.
- Backend maps validation errors to `400`, domain/state conflicts to `409`, unauthenticated
  access to `401`, and forbidden access to `403`; frontend error normalization should preserve
  that distinction for UX decisions.
- `SimulationSessionDto` is the canonical session payload and includes `openingStatus`,
  `diagnosisOptions`, `selectedDiagnosis`, `messages`, `streamingStatus`, `score`, `result`,
  `createdAt`, and `updatedAt`.
- Layout and URL scheme are locked in Architectural Decisions above. Do not introduce
  `/chat/active` as a route or any implicit session resolution inside the chat page.

## Open Questions

No blocking questions for MVP planning at this stage.

## Claude Progress Checklist

- [ ] `P1` Foundation and architecture.
  Goal: establish target folder structure, router map, shared constants, and strict domain types.

- [ ] `P1.1` Define/align project structure in `src`.
  Goal: clear separation for `components`, `views`, `composables`, `services`, `types`, `utils`,
  `stores`, `constants`. Remove Vue starter artifacts.

- [ ] `P1.2` Configure app shell and routes.
  Goal: nested layout routes skeleton (PublicLayout / AppLayout) for all MVP pages.
  Includes dedicated `404` route and error page.

- [ ] `P1.3` Add global constants.
  Goal: single source for API base URL and route names. Done before routes are wired.

- [ ] `P1.4` Add TypeScript domain contracts.
  Goal: typed DTO mirrors for auth, cases, simulation, stats, settings, errors.
  Remove `any` from existing `src/types/index.ts`.

- [ ] `P2` Tailwind-based design system.
  Goal: tokenized, consistent, light neutral + green visual language.

- [ ] `P2.1` Create color tokens (`base`, `primary`, `secondary`, `tertiary`, `success`, `info`, `warning`, `error`).
  Goal: semantic palette mapped to Tailwind utilities.

- [ ] `P2.2` Define semantic surface/text/border/interactive tokens.
  Goal: consistent UI states across all components.

- [ ] `P2.3` Define spacing/typography/radius/shadow scales.
  Goal: rem-only sizing with `0.8rem` base step and even-scale rhythm.

- [ ] `P2.4` Add accessibility baseline.
  Goal: focus-visible, keyboard states, and sufficient contrast.

- [ ] `P3` UI kit implementation.
  Goal: reusable component set covering MVP needs without one-off UI.

- [ ] `P3.1` Implement form controls (`VInput`, `VTextarea`, `VSelect`, `VCheckbox`, `VField`).
  Goal: unified form API with validation and error rendering.

- [ ] `P3.2` Implement actions/surfaces (`VButton`, `VCard`, `VBadge`, `VTag`, `VAvatar`).
  Goal: consistent visual and interactive behavior.

- [ ] `P3.3` Implement overlays (`VModal`, `VDrawer`, `VDropdown`, `VTooltip`).
  Goal: support chat actions and diagnosis flow.

- [ ] `P3.4` Implement utility states (`VSpinner`, `VSkeleton`, `VEmptyState`, `VAlert`).
  Goal: complete loading/empty/error UX.

- [ ] `P4` Data layer via composables and `useFetch`.
  Goal: typed, centralized API access with shared error/loading handling.

- [ ] `P4.1` Build shared API instance via `createFetch` in `composables/useApi.ts`.
  Goal: `credentials: "include"`, base URL from env, normalized errors via hooks, typed wrappers.

- [ ] `P4.2` Build feature composables (`useAuthApi`, `useCasesApi`, `useSimulationApi`, `useProfileApi`).
  Goal: one composable per domain with clear method contracts.

- [ ] `P4.3` Add request-state conventions.
  Goal: predictable `isLoading/error/success` behavior across pages.

- [ ] `P4.4` Implement route guard on AppLayout parent route.
  Goal: protect cases/profile/chat for authorized users only via single guard.

- [ ] `P5` Authentication flow (session cookie).
  Goal: complete login/logout lifecycle with persistent authenticated state.

- [ ] `P5.1` Build login page and validation.
  Goal: stable auth form with backend error mapping.

- [ ] `P5.2` Implement auth state bootstrap.
  Goal: recover session on app reload via `/api/auth/me`.

- [ ] `P5.3` Enforce protected routes and redirects.
  Goal: post-login default route is cases list; unauthorized access blocked via AppLayout guard.

- [ ] `P5.4` Handle global 401/403.
  Goal: deterministic re-auth/sign-out behavior.

- [ ] `P6` Header and footer.
  Goal: consistent navigation shell for public and authenticated sections.

- [ ] `P6.1` Implement PublicLayout and AppLayout components.
  Goal: nested layout wrappers for public and authenticated route groups.

- [ ] `P6.2` Implement header variants.
  Goal: public mode for landing/login, private mode for cases/profile/chat.

- [ ] `P6.3` Implement footer variants.
  Goal: full landing footer and compact app footer.

- [ ] `P7` Page implementation bundle.
  Goal: deliver all MVP pages and end-to-end user flow.

- [ ] `P7.1` Landing page.
  Goal: product positioning, RAG explanation, CTA to login/start.

- [ ] `P7.1.1` Error page (404).
  Goal: clear fallback UX for unknown routes with role-aware navigation actions.

- [ ] `P7.2` Cases list page.
  Goal: render case cards with strict front-side filtering; active session check on mount;
  start action triggers POST and redirects to `/chat/:sessionId`.

- [ ] `P7.3` Login page.
  Goal: authorize and redirect to cases list.

- [ ] `P7.4` Chat simulation page.
  Goal: sidebar + timeline + input + diagnosis modal + completion stats/feedback.
  Receives `sessionId` via route param only.

- [ ] `P7.5` Session state recovery.
  Goal: resume from cases page via active session CTA; refresh recovery via GET by session id.

- [ ] `F1` Quick prompts for chat buttons.
  Goal: implement 3 fixed prompts and send them as regular message requests.

- [ ] `F1.1` Add prompt constants in `src/constants/simulationQuickPrompts.ts`.
  Goal: single source of truth for keys, labels, and prompt text.

- [ ] `F1.2` Render buttons from typed config.
  Goal: dumb UI component without hardcoded prompt strings.

- [ ] `F1.3` Wire button click to message send.
  Goal: quick actions work identically to manual user message.

- [ ] `F2` Profile with settings editing.
  Goal: provide user overview + editable settings + stats + history.

- [ ] `F2.1` Implement profile data fetch.
  Goal: load `/api/settings`, `/api/stats/overview`, `/api/history`.

- [ ] `F2.2` Implement settings update flow.
  Goal: edit `displayName` and safely preserve unknown `settings` keys on save
  via `Record<string, unknown>` spread strategy.

- [ ] `F2.3` Add save UX and validation states.
  Goal: disabled submit during request and clear success/error feedback.

- [ ] `F3` WebSocket chat streaming (deferred, post-MVP).
  Goal: replace REST polling with streaming for progressive AI token output.

- [ ] `F3.1` Implement WS connection in `useSimulationApi`.
  Goal: connect to `/topic/ai/{conversationId}` and stream tokens to chat timeline.

- [ ] `F3.2` Update chat page to render streaming state.
  Goal: show partial AI message while streaming, finalize on completion event.

- [ ] `Q1` Quality and release checks.
  Goal: ensure MVP stability and readiness for demo/integration.

- [ ] `Q1.2` Run required checks (`type-check`, `el:check`, `sl:check`, `build`).
  Goal: clean CI-equivalent local validation.

- [ ] `Q1.3` Final UX pass.
  Goal: no missing loading/empty/error edge states on key pages.

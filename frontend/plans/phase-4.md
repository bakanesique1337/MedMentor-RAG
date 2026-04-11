# Phase 4 Plan: Data Layer With Composables (`useFetch`)

## Scope

Build the frontend data layer for authenticated REST access, request/error normalization,
and simulation streaming integration so later phases can implement pages without embedding
transport logic into views.

## Phase Goal

Introduce a single typed API foundation in `src/composables/`, then layer feature-specific
composables, auth-aware route bootstrap, and a dedicated simulation streaming adapter on top.

## Current State

- `P1` established route constants, domain types, and `mergeSettings`.
- `P2` established the tokenized styling baseline.
- `P3` established the reusable UI kit.
- `src/router/guards/auth.ts` is still a placeholder returning `true`.
- `src/composables/` is empty, so no canonical request or streaming abstraction exists yet.

## Inputs

- Master roadmap: `PLAN.md` (`P4`, `P4.1`, `P4.2`, `P4.3`, `P4.4`, `P4.5`).
- Locked architecture in `PLAN.md` sections:
  `Architectural Decisions (Locked)`,
  `API Layer: createFetch`,
  `Simulation Lifecycle Contract`,
  `Streaming Strategy: VueUse useWebSocket`,
  `Chat URL And Session Start Flow`.
- Existing frontend baseline from `P1`-`P3`.
- Current placeholder auth guard in `src/router/guards/auth.ts`.
- Shared constants and types in:
  `src/constants/api.ts`,
  `src/constants/routes.ts`,
  `src/types/index.ts`,
  `src/utils/mergeSettings.ts`.
- Backend REST and socket contracts in:
  `../backend/src/main/java/ru/medmentor/controller/AuthController.java`,
  `../backend/src/main/java/ru/medmentor/controller/SimulationController.java`,
  `../backend/src/main/java/ru/medmentor/controller/SupportingController.java`,
  `../backend/src/main/java/ru/medmentor/controller/ApiExceptionHandler.java`,
  `../backend/src/main/java/ru/medmentor/config/WebSocketConfig.java`,
  `../backend/src/main/java/ru/medmentor/dto/*.java`.

## Backend Contract Snapshot

### Auth

- `POST /api/auth/login` -> `AuthUserDto`, `401` on bad credentials.
- `POST /api/auth/logout` -> `{ success: true }`.
- `GET /api/auth/me` -> `AuthUserDto`.
- Session auth is cookie-based (`JSESSIONID`), so all protected requests require
  `credentials: "include"`.

### Cases / Simulations / Profile

- `GET /api/cases` -> `CaseCardDto[]`.
- `GET /api/simulations/active` -> `Optional<ActiveSimulationDto>`.
- `POST /api/simulations/start` -> `SimulationCommandResponseDto`.
- `GET /api/simulations/{sessionId}` -> `SimulationSessionDto`.
- `POST /api/simulations/{sessionId}/message` -> `SimulationCommandResponseDto`.
- `POST /api/simulations/{sessionId}/diagnose` -> `SimulationSessionDto`.
- `GET /api/settings` -> `UserSettingsDto`.
- `PUT /api/settings` -> `UserSettingsDto`.
- `GET /api/history` -> `HistorySessionDto[]`.
- `GET /api/history/{sessionId}` -> `SimulationSessionDto`.
- `GET /api/stats/overview` -> `SimulationStatsOverviewDto`.

### Error Envelope

`ApiExceptionHandler` returns:

- `400` with `{ error, status, fieldErrors? }` for validation and bad input.
- `409` with `{ error, status }` for domain state conflicts.
- `500` with `{ error, status }` for unexpected failures.

This shape should become the single normalized frontend error contract.

### Streaming Contract

- WebSocket broker endpoint: `/ws`.
- Backend registers SockJS + STOMP broker topics.
- Simulation chunks are published to `/topic/simulations/{sessionId}`.
- Payload shape matches `StreamChunkDto`:
  `{ conversationId, content?, type: "chunk" | "done" | "error", error?, timestamp }`.

## Technical Decisions For P4

### REST Layer

- All REST access is centralized in `src/composables/useApi.ts`.
- Feature composables call that shared client and do not instantiate raw `fetch`.
- Views consume feature composables, not URLs.

### Error Handling

- Normalize all failures to `ApiError`.
- Preserve HTTP status and `fieldErrors` when backend provides them.
- Treat unauthenticated state (`401`) as first-class, not as a generic error string.

### Auth Bootstrap Ownership

- Route guard remains attached to the AppLayout parent route only.
- Guard must depend on a shared auth session source, not on ad hoc repeated `/me` calls from pages.
- `P4` owns the data-layer side of auth bootstrap; full login/logout UX stays in `P5`.
- Unauthenticated users are returned to the public landing surface, where `P5` opens the auth modal
  and preserves the intended protected destination.

### Streaming Abstraction Boundary

- Page code must not know about topic names, SockJS, or STOMP frame handling.
- `useSimulationSocket` exposes a small session-oriented API:
  connect, subscribe by `sessionId`, receive parsed chunks, expose connection status, cleanup.
- If raw `useWebSocket` cannot cleanly consume the SockJS/STOMP backend protocol, keep the protocol-specific
  adapter entirely hidden behind `useSimulationSocket`.

## Tasks

### P4.0 Baseline Audit And Response Strategy

Before writing composables, lock the response conventions and file ownership.

- Create or confirm the following file targets:
  - `src/composables/useApi.ts`
  - `src/composables/useAuthApi.ts`
  - `src/composables/useCasesApi.ts`
  - `src/composables/useSimulationApi.ts`
  - `src/composables/useProfileApi.ts`
  - `src/composables/useSimulationSocket.ts`
- Decide whether to keep tiny reusable helpers inside `useApi.ts` or split them into:
  - `src/composables/api/types.ts`
  - `src/composables/api/utils.ts`
  Only split if `useApi.ts` becomes hard to scan.
- Confirm how `GET /api/simulations/active` should be represented on the frontend:
  `ActiveSimulation | null` is preferred over leaking `Optional` semantics into page code.
- Confirm date fields remain plain ISO strings in the frontend type layer.

Goal: one obvious home for each concern before implementation starts.

---

### P4.1 Shared API Client (`useApi.ts`)

Implement the canonical `createFetch` wrapper.

#### Responsibilities

- Read base URL from `API_BASE_URL`.
- Apply `credentials: "include"` to every request.
- Apply shared timeout using `REQUEST_TIMEOUT_MS`.
- Normalize success and error payloads in one place.
- Expose typed helpers so feature composables stay thin.

#### Required API Surface

- `apiGet<T>()`
- `apiPost<TResponse, TBody>()`
- `apiPut<TResponse, TBody>()`
- Optional `apiDelete<T>()` only if a real endpoint needs it later. Do not add preemptively.

#### Normalization Rules

- Success path returns typed `data` only, not raw `Response`, unless metadata is required.
- Failed responses should throw or return a single `ApiError` shape consistently.
- Network failures and parse failures must also become `ApiError`, with a defensible fallback:
  - `status: 0` for transport failures,
  - meaningful `error` text,
  - no fabricated `fieldErrors`.
- `401` should remain distinguishable so auth bootstrap and guards can react deterministically.
- Empty successful bodies must be handled safely for endpoints that do not return entity payloads.

#### Suggested Supporting Types

- `ApiResponse<T>` for typed `createFetch` parsing.
- `RequestState<T>` if repeated loading/error state structure appears across composables.
- `ApiRequestOptions` for query params, abort signal, and custom overrides.

Goal: all REST communication uses one typed, predictable pathway.

---

### P4.2 Feature REST Composables

Build thin domain composables on top of `useApi.ts`.

#### `useAuthApi`

Methods:

- `login(payload: AuthLoginRequest): Promise<AuthUser>`
- `logout(): Promise<void>`
- `me(): Promise<AuthUser>`

Rules:

- Do not mix login form state into this composable.
- `logout()` should tolerate already-expired server sessions without crashing the caller.

#### `useCasesApi`

Methods:

- `getCases(): Promise<CaseCard[]>`

Rules:

- Keep filtering client-side in later phases; do not add frontend query params now unless backend usage exists.

#### `useSimulationApi`

Methods:

- `start(caseId: string): Promise<SimulationCommandResponse>`
- `active(): Promise<ActiveSimulation | null>`
- `getSession(sessionId: number | string, options?: { retryOpening?: boolean }): Promise<SimulationSession>`
- `sendMessage(sessionId: number | string, content: string): Promise<SimulationCommandResponse>`
- `diagnose(sessionId: number | string, diagnosis: string): Promise<SimulationSession>`

Rules:

- Coerce route-param input safely but do not let invalid `sessionId` silently pass through.
- Keep retry-opening behavior explicit via method options, not a separate endpoint-specific composable.
- Conflict responses (`409`) must be preserved for chat/cases UX in later phases.

#### `useProfileApi`

Methods:

- `settings(): Promise<UserSettings>`
- `updateSettings(payload: UpdateUserSettingsRequest): Promise<UserSettings>`
- `history(): Promise<HistorySession[]>`
- `historyDetail(sessionId: number | string): Promise<SimulationSession>`
- `stats(): Promise<SimulationStatsOverview>`

Rules:

- `updateSettings()` must preserve unknown settings keys by using the `mergeSettings` pattern from `P1`.
- Do not couple profile composable to form-specific validation messages.

Goal: page implementations in `P5`-`P7` can import focused domain APIs instead of assembling requests manually.

---

### P4.3 Shared Request State Patterns

Define how composables expose pending and failure state.

#### Minimum Required Shape

Each feature composable should support a consistent pattern for:

- `isLoading` or method-specific pending refs,
- `error`,
- reset/clear behavior when appropriate.

#### Recommended Approach

- Keep entity-returning methods promise-based for straightforward use in guards and actions.
- Add optional local refs for long-lived composables used directly by pages.
- Avoid a heavy generic resource abstraction unless duplication becomes real.

#### State Rules

- Guard/bootstrap flows need deterministic pending completion even on failure.
- Repeated calls must not leave stale error text hanging by default.
- Parallel requests should not overwrite each other's state accidentally.
- Streaming state is separate from REST request state and belongs in `useSimulationSocket`.

Goal: stable UX hooks for loaders, disabled buttons, and inline API errors without overengineering.

---

### P4.4 Simulation Streaming Composable

Implement `useSimulationSocket` as the only streaming entry point for the chat feature.

#### Required Responsibilities

- Open the socket transport for the current user session.
- Subscribe to `/topic/simulations/{sessionId}`.
- Parse and validate incoming `StreamChunk` payloads.
- Expose connection lifecycle state.
- Expose cleanup on route leave / session change.

#### Public API Shape

Recommended return contract:

- `status`: `'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error'`
- `lastChunk`: `Ref<StreamChunk | null>`
- `error`: `Ref<ApiError | null>`
- `connect(sessionId)`
- `disconnect()`
- `reconnect()`
- `onChunk(handler)` or an equivalent callback registration pattern

#### Protocol Handling

- First implementation step: verify whether VueUse `useWebSocket` can reliably support the required backend protocol.
- Because backend endpoint registration uses SockJS and topic subscription via STOMP, a thin protocol adapter may be required.
- If STOMP/SockJS support is necessary, keep the dependency entirely private to `useSimulationSocket` and preserve the same page-facing API.
- Do not leak topic strings or subscribe/unsubscribe frame logic into `ChatView.vue`.

#### Recovery Rules

- Socket reconnect must not duplicate chunk handling after re-subscription.
- `done` chunk finalizes the active stream and clears in-flight transport state.
- `error` chunk maps to actionable UI state and should prompt REST re-fetch or manual retry.
- After reconnect, page logic should be able to re-sync canonical session data via `getSession()`.

#### Validation Rules

- Ignore malformed messages safely.
- Validate `conversationId`, `type`, and `timestamp` before surfacing payloads.
- Log or surface protocol mismatches in a debuggable way during development.

Goal: chat streaming becomes a contained infrastructure concern rather than a page-level protocol implementation.

---

### P4.5 Auth Session Bootstrap And Route Guard

Replace the placeholder guard with an auth-aware bootstrap flow.

#### Required Behavior

- Guard stays on AppLayout parent route only.
- On protected navigation, bootstrap current session via `useAuthApi.me()`.
- If authenticated, allow navigation.
- If unauthenticated, redirect to `ROUTES.HOME` and preserve the intended target in a `redirect` query param
  plus a modal-opening intent flag.

#### Recommended Structure

- Add a small shared auth-session source in `src/stores/` or a dedicated composable only if needed for memoized bootstrap state.
- Cache successful `/me` result for the current app lifetime to avoid redundant guard fetches.
- Prevent duplicate concurrent `/me` requests during fast route transitions.
- Keep the redirect payload simple enough for `P5` to open the auth modal from the landing page
  without coupling the guard to modal internals.

#### Guard Edge Cases

- If the user opens `/chat/:sessionId` directly without a valid session, guard should redirect before page mount.
- If `/me` returns `401`, clear any cached auth state and redirect to landing with auth-modal intent.
- If `/me` fails with transport error (`status: 0`) or `500`, prefer a controlled failure path over silently treating the user as logged out.
  The guard may route to landing with an explanatory state later, but the error distinction must remain available.

Goal: protected navigation becomes deterministic before `P5` implements the full auth UX.

## Definition Of Done (DoD)

- [ ] `src/composables/useApi.ts` exists and is the sole shared REST entry point.
- [ ] Feature composables exist for auth, cases, simulations, and profile.
- [ ] All protected REST requests include `credentials: "include"`.
- [ ] Shared error normalization preserves `status` and optional `fieldErrors`.
- [ ] `GET /api/simulations/active` resolves to `ActiveSimulation | null` in frontend code.
- [ ] `useSimulationSocket` hides topic/protocol details from views.
- [ ] Route guard no longer returns unconditional `true`.
- [ ] AppLayout guard redirects unauthenticated users to landing with auth-modal redirect intent.
- [ ] No page component needs to hardcode API URLs.
- [ ] No `any`, no forbidden equality operators, no hardcoded backend base URL.
- [ ] `bun run type-check` passes.
- [ ] `bun run el:check` passes.
- [ ] `bun run build` passes.

## Risks And Mitigations

**Risk: VueUse `useWebSocket` alone is not sufficient for SockJS/STOMP broker interaction.**
Mitigation: keep a protocol adapter boundary inside `useSimulationSocket` and validate the backend handshake early in P4 before `P7` depends on it.

**Risk: auth guard triggers repeated `/me` calls on every route change.**
Mitigation: add in-flight request deduplication and app-lifetime session caching with explicit invalidation on logout/401.

**Risk: inconsistent error handling across composables.**
Mitigation: centralize normalization in `useApi.ts`; feature composables must not assemble their own arbitrary error objects.

**Risk: route-param session IDs remain loosely typed and produce late runtime failures.**
Mitigation: normalize and validate `sessionId` at API boundary entry, not deep in page logic.

**Risk: streaming reconnect duplicates partial content or orphan subscriptions.**
Mitigation: subscription ownership stays inside `useSimulationSocket`, with explicit connect/disconnect lifecycle and duplicate-listener prevention.

**Risk: profile settings updates accidentally drop unknown keys from the backend `settings` map.**
Mitigation: require `mergeSettings` usage in `useProfileApi.updateSettings()` and keep the API method contract explicit.

## Execution Order

1. P4.0 - lock file ownership and response conventions.
2. P4.1 - implement `useApi.ts` and shared error normalization.
3. P4.2 - implement REST feature composables on top of the shared client.
4. P4.3 - standardize request state exposure where duplication is real.
5. P4.4 - implement and validate `useSimulationSocket`.
6. P4.5 - replace placeholder auth guard with real bootstrap logic.
7. Run verification: `bun run type-check`, `bun run el:check`, `bun run build`.

## Open Questions

1. If direct `useWebSocket` integration proves insufficient for the backend SockJS/STOMP endpoint, is adding a thin private dependency pair such as `@stomp/stompjs` + `sockjs-client` acceptable inside `useSimulationSocket`?
2. For protected-route bootstrap failures caused by network issues (`status: 0`), should the app prefer redirect-to-landing-with-modal-intent or a dedicated transient error state in `P5`?

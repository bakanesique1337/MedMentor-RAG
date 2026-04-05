# Phase 1 Plan: Foundation And Architecture

## Scope

Create a stable frontend foundation before visual and feature-heavy work starts.

## Phase Goal

Set project structure, routing skeleton, shared constants, and strict domain typing so all
next phases can build on predictable contracts.

## Inputs

- Master roadmap: `PLAN.md` (`P1`, `P1.1`, `P1.2`, `P1.3`, `P1.4`).
- Architectural decisions: `PLAN.md` section "Architectural Decisions (Locked)".
- Backend contract notes in `PLAN.md` sections:
  "Backend Contract Alignment",
  "Simulation Lifecycle Contract",
  "Streaming Strategy: VueUse `useWebSocket`".
- Project standards: `CLAUDE.md` and `.claude/rules/*`.
- Backend API DTO/contracts in `../backend/src/main/java/ru/medmentor/dto`.
- Backend enums relevant for frontend state handling in `../backend/src/main/java/ru/medmentor/model`.

## Tasks

### P1.1 Structure Alignment

**Folders to create/keep in `src/`:**

- `constants/`
- `composables/`
- `services/`
- `components/ui/`
- `components/common/`
- `components/layout/`
- `views/`
- `types/`
- `utils/`
- `stores/` (only for truly global state)

**Vue starter artifacts to delete:**

- `src/components/HelloWorld.vue`
- `src/components/TheWelcome.vue`
- `src/components/WelcomeItem.vue`
- `src/components/icons/` (entire folder)
- `src/views/AboutView.vue`
- `src/stores/counter.ts`

**Component boundary note:**

- `components/common/` is for components used on 2+ pages.
- Page-specific components use a page prefix (e.g., `CaseCard`, `ChatMessageBubble`).
- Chat-specific components (`ChatMessageBubble`, `ChatInputBar`) live in `components/common/`
  only if reused elsewhere, otherwise in a `components/chat/` subfolder.
  Decide at P7.4 implementation time based on actual reuse.

Goal: clean structure with clear responsibility boundaries and no dead starter code.

---

### P1.2 App Shell And Route Map

**Layout strategy:** nested routes (see PLAN.md "Architectural Decisions").
`App.vue` renders only `<RouterView />`. No conditional layout logic in `App.vue`.

**Route structure to implement:**

```
/ (PublicLayout)
  path: '/'        name: ROUTES.HOME      -> views/HomeView.vue
  path: '/login'   name: ROUTES.LOGIN     -> views/LoginView.vue

/ (AppLayout, auth guard attached here)
  path: '/cases'              name: ROUTES.CASES    -> views/CasesView.vue
  path: '/profile'            name: ROUTES.PROFILE  -> views/ProfileView.vue
  path: '/chat/:sessionId'    name: ROUTES.CHAT     -> views/ChatView.vue

path: '/:pathMatch(.*)*'  name: ROUTES.NOT_FOUND -> views/NotFoundView.vue
```

**Auth guard location:** on the AppLayout parent route via `beforeEnter`.
Individual child routes (`/cases`, `/profile`, `/chat`) do NOT each define their own guard.

**Chat URL contract:**

- `sessionId` is always a route param — never resolved internally by the chat page.
- `/api/simulations/active` is called from the cases page only, not from the chat page.
- On chat page mount: load session state via `GET /api/simulations/:sessionId`.

**Backend route contract to preserve in frontend constants/types:**

- session start is `POST /api/simulations/start`, not `POST /api/simulations`,
- profile endpoints are `GET/PUT /api/settings`, `GET /api/history`,
  `GET /api/history/{sessionId}`, `GET /api/stats/overview`,
- `/api/rag/*` endpoints are debug/testing only and excluded from MVP route/composable scope.

**Placeholder views:** all views can be empty `<template><div /></template>` stubs at this stage.
The goal is a navigable skeleton, not implemented pages.

Goal: deterministic navigation skeleton for all required pages.

---

### P1.3 Shared Constants

Do this step before wiring routes in P1.2 to avoid hardcoded strings in the router.

- [ ] `src/constants/routes.ts` — route name constants:
  ```ts
  export const ROUTES = {
    HOME: 'home',
    LOGIN: 'login',
    CASES: 'cases',
    PROFILE: 'profile',
    CHAT: 'chat',
    NOT_FOUND: 'not-found',
  } as const
  ```
- [ ] `src/constants/api.ts` — API base URL:
  ```ts
  export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
  ```
- [ ] Add `VITE_API_BASE_URL` to `.env.example` (or `.env.local` if not tracked).
- [ ] Add reusable app constants (request timeout, pagination defaults if needed).

Goal: eliminate magic strings from routing and API bootstrap.

---

### P1.4 Domain Types

**First: clean up existing violations in `src/types/index.ts`:**

- Remove `DynamicObject` interface — it uses `any` and is forbidden by rules.
- Remove or isolate legacy `AIRequest` / `AIResponse` types if they target old non-MVP AI endpoints.
  Do not let legacy chat types define MVP simulation contracts.

**Add strict TypeScript models:**

Auth:

- `AuthLoginRequest` — `{ username: string; password: string }`
- `AuthUser` — mirrors backend `AuthUserDto` exactly

Case card:

- `CaseCard` — mirrors backend `CaseCardDto` exactly (id, title, category, difficulty, tags, patient preview)

Simulation entities:

- `SimulationSession` — full session model
- `SimulationCommandResponse` — response to start/message/diagnose commands
- `ConversationMessage` — single message with role, content, timestamp
- `SimulationState` — mirror backend enum
- `OpeningStatus` — mirror backend enum
- `StreamingStatus` — `{ inFlight: boolean; type: "opening" | "message" | "idle" }`
- `Score` — scoring breakdown
- `Result` — completion result with summary
- `ActiveSimulation` — response from `GET /api/simulations/active` (may be null/empty)
- `StreamChunk` — websocket chunk payload for simulation streaming
- `StreamChunkType` — union for `chunk | done | error`

Simulation contract notes:

- `SimulationSession` must include `openingStatus`, `diagnosisOptions`, `selectedDiagnosis`,
  `messages`, `streamingStatus`, `score`, `result`, `createdAt`, and `updatedAt`.
- `diagnosisOptions` comes from backend session payload and is the only valid source
  for diagnosis selection UI.
- `streamingStatus` is needed in P7 recovery flows and must be typed in P1, even if
  socket behavior is implemented later in P4/P7.

Profile and settings:

- `UserSettings` — `{ displayName: string; username: string; settings: Record<string, unknown> }`
- `UpdateUserSettingsRequest` — same shape; see safe pass-through note below
- `SimulationStatsOverview` — metrics from `/api/stats/overview`
- `HistorySession` — single entry from `/api/history`

Safe pass-through for `UserSettings.settings`:

- Backend sends `Map<String, Object>` (Java).
- Frontend type: `Record<string, unknown>`.
- On update: spread the full `settings` object, override only known keys.
  Do NOT reconstruct the object from known fields only — unknown keys must be preserved.
- Add a `mergeSettings` utility in `utils/` to enforce this pattern.

Shared:

- `ApiError` — normalized error shape used across all `onFetchError` hooks

Add type guards where response shape may vary:

- `isApiError(value: unknown): value is ApiError`
- `isActiveSimulation(value: unknown): value is ActiveSimulation`
- `isStreamChunk(value: unknown): value is StreamChunk`

Error normalization notes:

- frontend should preserve backend distinction between `400` validation errors,
  `409` domain/state conflicts, `401` unauthenticated, and `403` forbidden,
- include support for optional `fieldErrors` on validation responses.

Goal: compile-time safe contracts for all upcoming API/composable work.

---

## Definition Of Done (DoD)

- [ ] Source tree follows agreed architecture with starter artifacts removed.
- [ ] Router uses nested layout routes matching the locked scheme in PLAN.md.
- [ ] Router fallback renders dedicated `404` page.
- [ ] All route names reference `ROUTES` constants — no hardcoded strings.
- [ ] `API_BASE_URL` comes from env, not hardcoded.
- [ ] Type layer covers all required backend contracts for MVP.
- [ ] Type layer covers simulation lifecycle and streaming payloads required by MVP.
- [ ] `src/types/index.ts` contains no `any`.
- [ ] `mergeSettings` utility exists for safe settings pass-through.
- [ ] No `any`, no forbidden patterns from repo rules.
- [ ] `bun run type-check` passes.
- [ ] `bun run el:check` passes.
- [ ] `bun run sl:check` — N/A at this phase (no component styles yet); verify in P2.

---

## Risks And Mitigations

**Risk: backend DTO changes during implementation.**
Mitigation: keep mapping layer thin and centralized in `types/` and adapter utils.
All DTO field names must exactly mirror Java class field names — no aliasing in types.

**Risk: frontend types cover only REST happy-path and miss streaming/state payloads.**
Mitigation: treat backend enums and websocket chunk contracts as part of P1 typing scope,
not as optional follow-up typing.

**Risk: accidental store overuse.**
Mitigation: keep local state in views/composables; use Pinia only for global auth/session.
Auth user state is the only confirmed Pinia candidate at this phase.

**Risk: route structure churn.**
Mitigation: URL scheme is locked in PLAN.md "Architectural Decisions". If the URL scheme
must change, update PLAN.md first and note the impact on P4 (route guard), P7.2 (session start),
and P7.5 (recovery). Do not change URLs without updating those dependent sections.
All route navigation uses `ROUTES` constants, so URL changes are single-file edits.

**Risk: layout switching strategy inconsistency.**
Mitigation: strategy is locked (nested routes). `App.vue` must not contain any
`v-if="isAuthenticated"` or `<component :is="layout">` patterns.

---

## Execution Order

1. P1.1 — structure alignment and starter cleanup.
2. P1.3 — constants (before routes, to avoid hardcoded strings in router).
3. P1.2 — routes and app shell (uses constants defined in step 2).
4. P1.4 — domain types.
5. DoD verification (`type-check`, `el:check`).

---

## Progress Checklist

- [ ] `P1.1` structure alignment and starter artifact cleanup completed.
- [ ] `P1.3` shared constants completed.
- [ ] `P1.2` app shell and nested route map completed.
- [ ] `P1.4` domain typing completed (including `any` removal).
- [ ] Streaming-related types and lifecycle enums completed.
- [ ] `P1` DoD verification completed.

# Phase 5 Plan: Authentication Flow

## Scope

Complete the MVP authentication flow on top of the P4 data layer so protected
navigation, login/logout actions, session persistence, and re-auth behavior work
end-to-end with the backend's cookie-based server session.

## Phase Goal

Turn the current auth scaffolding into a production-shaped MVP flow:

- unauthenticated users can open a login modal from the landing page or from protected-route interception,
- successful login restores intended navigation,
- authenticated state is available to layouts and profile,
- logout fully clears local auth state,
- `401` and `403` responses lead to deterministic session invalidation and re-auth UX.

## Current State

- `P4` already introduced:
    - `src/composables/useApi.ts`
    - `src/composables/useAuthApi.ts`
    - `src/router/guards/auth.ts`
    - `src/stores/authGate.ts`
- App routing already uses the locked nested layout structure:
    - `PublicLayout.vue`
    - `AppLayout.vue`
- `PublicLayout.vue` already mounts `AuthModal.vue`.
- `AuthModal.vue` already supports:
    - username/password submission,
    - local empty-field validation,
    - redirect-after-login handling through `authGate.redirectTarget`.
- `authGate.ts` already supports:
    - bootstrap via `GET /api/auth/me`,
    - cached authenticated state for the current app lifetime,
    - modal open/close state,
    - redirect target storage,
    - sign-in/sign-out mutations.

What is still missing for MVP completeness:

- auth state is still "gate-oriented" and not yet a full app-facing auth session source,
- login validation/error mapping is minimal,
- auth error handling is not yet global,
- AppLayout/header-facing user identity is not yet formalized,
- logout UX is not yet wired into final navigation surfaces,
- landing-page auth opening from query/error state is still coupled to provisional behavior,
- there is no locked strategy yet for `403`, expired sessions during active usage, or post-login bootstrap consistency.

## Inputs

- Master roadmap: `PLAN.md` (`P5`, `P5.1`, `P5.2`, `P5.3`, `P5.4`).
- Locked architecture in `PLAN.md` sections:
    - `Architectural Decisions (Locked)`
    - `API Layer: createFetch`
    - `Backend Contract Alignment`
    - `Chat URL And Session Start Flow`
- Detailed data-layer plan in `plans/phase-4.md`.
- Existing auth-related files:
    - `src/composables/useApi.ts`
    - `src/composables/useAuthApi.ts`
    - `src/router/guards/auth.ts`
    - `src/stores/authGate.ts`
    - `src/components/common/AuthModal.vue`
    - `src/components/layout/PublicLayout.vue`
    - `src/components/layout/AppLayout.vue`
    - `src/views/HomeView.vue`
- Backend auth contract:
    - `POST /api/auth/login`
    - `POST /api/auth/logout`
    - `GET /api/auth/me`
- Backend auth mode: server-side HTTP session cookie (`JSESSIONID`) with `credentials: "include"`.

## Locked Decisions For P5

### Auth Entry Surface

- MVP keeps auth inside a modal.
- No dedicated `/login` route is introduced in `P5`.
- `PublicLayout.vue` remains the only place that mounts the shared auth modal.

### Session Source Of Truth

- The frontend uses one shared auth session source for:
    - `isAuthenticated`
    - current user identity
    - bootstrap status
    - login/logout actions
    - modal state
    - pending redirect target
- `authGuard` and UI surfaces must read from the same source. No parallel auth caches.

### Redirect Contract

- Protected-route interception redirects to `ROUTES.HOME`.
- The intended destination is preserved in a `redirect` query param.
- Auth modal opening intent continues to use a query flag (`auth=login`) so refreshes and deep links stay deterministic.
- After successful login:
    - go to preserved redirect target if present,
    - otherwise go to `ROUTES.CASES`.

### Global Unauthorized Handling

- `401` means the local frontend session must be considered invalid until revalidated.
- `403` means the user is authenticated but the action is forbidden; it must not silently sign the user out.
- `401` handling should be centralized and consistent across pages and composables.

### Session Persistence Boundary

- Backend session persistence is server-owned via cookie.
- Frontend persistence is only for UX continuity within the browser session:
    - auth gate/session cache,
    - redirect target,
    - modal intent if needed.
- Frontend must not invent token storage, refresh tokens, or local auth secrets.

## Tasks

### P5.0 Auth Audit And File Ownership

Before changing behavior, lock the ownership boundaries for auth concerns.

- Confirm whether `src/stores/authGate.ts` remains the canonical auth store or should be renamed
  to a broader auth-session store.
- Keep the auth modal presentational-plus-flow-oriented:
    - form state,
    - validation,
    - submit lifecycle,
    - close/redirect behavior.
- Keep transport calls inside `useAuthApi`.
- Keep protected-navigation bootstrap in the route guard/store path, not inside page views.
- Keep global unauthorized response handling in one shared layer:
    - either `useApi.ts`,
    - or a dedicated auth-session helper consumed by composables/router.
      Do not scatter `if (status === 401)` logic across page components.

Goal: one obvious owner for login, logout, bootstrap, and unauthorized handling.

---

### P5.1 Shared Auth Session Store/Composable

Evolve the current gate-oriented store into a full auth session source used by layouts and pages.

#### Required State

- `isAuthenticated`
- `isBootstrapped`
- `user: AuthUser | null`
- `isAuthModalOpen`
- `redirectTarget: string | null`
- `bootstrapStatus: 'idle' | 'pending' | 'ready' | 'error'`
- `bootstrapError: ApiError | null`
- pending flags for:
    - bootstrap,
    - login,
    - logout

#### Required Actions

- `bootstrap()`
- `login(credentials)`
- `logout()`
- `openAuthModal(redirect?)`
- `closeAuthModal()`
- `setRedirectTarget(path | null)`
- `consumeRedirectTarget()`
- `invalidateSession()`

#### Behavior Rules

- Successful bootstrap stores the full `AuthUser`, not only `username`.
- Concurrent bootstrap attempts share one in-flight promise.
- `login()` should:
    - call `useAuthApi.login()`,
    - store returned user,
    - mark bootstrap as satisfied,
    - close the modal on success.
- `logout()` should:
    - call backend logout,
    - tolerate expired backend session,
    - clear local auth state even if server session is already gone.
- `invalidateSession()` should clear local auth state without forcing UI crashes and should be reusable by global `401`
  handling.
- Keep `displayName` derived from canonical user data, not from ad hoc duplicated refs.

Goal: all auth-aware UI and router logic can depend on one stable auth session contract.

---

### P5.2 Login Modal And Validation

Upgrade `src/components/common/AuthModal.vue` from a working prototype into the finalized MVP entry flow.

#### Form Fields

- username
- password

No registration, forgot-password flow, or MFA in MVP scope.

#### Validation Rules

- trim surrounding whitespace for validation and submission intent,
- require both fields,
- show inline field-level error states where appropriate,
- keep form-level error for backend auth failures or unexpected server issues.

#### Error Mapping Rules

- `401`: show a clear credential failure message, not a generic transport/server message.
- `400` with validation payload: map field errors if backend provides them.
- `0`: show network-specific guidance.
- `5xx`: show retry-oriented server error copy.

#### UX Rules

- submit on Enter from either field,
- disable repeated submission while pending,
- focus the first field on open when practical,
- clear stale form errors when the user edits input or reopens the modal,
- show protected-destination context when the modal was opened from route interception,
- keep close behavior deterministic:
    - explicit close closes modal,
    - successful login closes modal,
    - close must also clean query-based auth intent when the modal was route-triggered.

#### Accessibility Rules

- preserve label/input associations through existing UI-kit contracts,
- ensure error text is surfaced through `aria-describedby`,
- modal title and description must explain why sign-in is required.

Goal: login becomes stable, understandable, and resistant to stale or misleading error states.

---

### P5.3 Route Guard And Redirect Finalization

Finalize the protected-route flow introduced in `P4`.

#### Required Behavior

- `authGuard` remains attached only to the AppLayout parent route.
- Guard checks shared auth session bootstrap before protected navigation.
- If authenticated: proceed.
- If unauthenticated:
    - redirect to `ROUTES.HOME`,
    - pass `auth=login`,
    - preserve `redirect=<original fullPath>`.
- If bootstrap fails due to network/server error:
    - redirect to `ROUTES.HOME`,
    - preserve intended destination,
    - expose an explicit auth/bootstrap error state for landing-page messaging.

#### Landing/PublicLayout Integration

- `PublicLayout.vue` should continue to react to `auth=login`.
- Query parsing and modal opening should be stable on:
    - direct protected deep-link,
    - browser refresh,
    - back/forward navigation.
- Once the auth-intent query is consumed or the modal is closed, URL cleanup must be deterministic.

#### Redirect Safety Rules

- Only allow internal app redirects.
- Do not allow external URLs or malformed redirects to be pushed after login.
- Preserve route params and query when the redirect target is a valid internal path.

Goal: protected access flow works the same whether navigation started from a button, direct URL, or refresh.

---

### P5.4 Global `401` / `403` Handling

Add a shared strategy for auth-related API failures after the user is already inside the app.

#### `401` Rules

- Treat as expired or invalid session.
- Clear local auth session through the shared auth store/composable.
- Redirect the user to `ROUTES.HOME`.
- Open auth modal with preserved destination when recovery makes sense.
- Avoid infinite redirect loops for repeated `401` on bootstrap/login/logout endpoints.

Recommended recovery examples:

- `/cases` fetch gets `401` -> invalidate session -> redirect to landing -> open auth modal -> preserve `/cases`.
- `/chat/:sessionId` action gets `401` -> invalidate session -> preserve the full chat URL for re-entry after login.

#### `403` Rules

- Do not sign the user out.
- Surface a user-visible forbidden/error state local to the action or page.
- Preserve route and current session state.

#### Implementation Boundary

- Centralize this logic as much as possible.
- If `useApi.ts` cannot safely redirect by itself, emit a normalized auth failure signal that the shared auth session
  layer can consume.
- Page components may customize the visible message, but they should not each reimplement session invalidation rules.

Goal: expired sessions recover predictably without every view inventing its own auth-failure behavior.

---

### P5.5 Logout Flow And Layout Integration

Prepare auth state for layout/header usage even if the full header lands in `P6`.

#### Required Logout Behavior

- logout action is accessible from authenticated surfaces,
- clicking logout:
    - disables repeated activation while pending,
    - calls backend logout,
    - clears local auth session,
    - redirects to landing,
    - closes menus/modals related to account actions.

#### Identity Exposure

- Shared auth state must expose enough user info for:
    - future header/user menu in `P6`,
    - profile page identity in `P7`,
    - current landing CTA behavior.
- Prefer exposing `user` and a small computed display helper instead of separate duplicated refs.

#### Transitional Requirement For Current Screens

- Replace temporary sign-in/sign-out demo wiring in `HomeView.vue` with the canonical auth flow interface.
- Keep the home page capable of:
    - opening the auth modal,
    - routing authenticated users to cases,
    - reflecting current auth state without bespoke auth logic.

Goal: auth flow is ready to plug into final layouts without another round of auth-state redesign.

---

### P5.6 Session Persistence And App-Start Consistency

Lock how auth behaves across refreshes and first load.

#### Required Behavior

- On first protected navigation, bootstrap from backend session via `GET /api/auth/me`.
- On app refresh while the server session is still valid:
    - protected routes should remain accessible after bootstrap,
    - user identity should be restored.
- On app refresh after the server session expired:
    - cached frontend auth state must not incorrectly keep the user "logged in",
    - bootstrap must correct the state and redirect as needed.

#### Storage Rules

- Any persisted client-side auth hint must be treated as provisional only.
- Server bootstrap result always wins over sessionStorage/local refs.
- Do not persist sensitive credentials.

#### UX Rules

- Avoid flashing protected content before bootstrap resolves.
- Avoid showing the login modal unnecessarily when the user still has a valid server session.

Goal: refresh behavior matches the real backend session instead of stale frontend assumptions.

## Definition Of Done (DoD)

- [ ] One shared auth session source exists and is used by guard, modal, and auth-aware UI.
- [ ] The auth session source stores full `AuthUser`, not only a username string.
- [ ] Login modal supports field validation, pending state, and backend error mapping.
- [ ] Successful login redirects to intended protected route or `/cases` by default.
- [ ] Logout clears local auth state and returns the user to landing.
- [ ] Protected-route interception consistently opens login through landing/public layout flow.
- [ ] Global `401` handling invalidates session and triggers re-auth flow consistently.
- [ ] `403` handling does not sign the user out.
- [ ] Refresh on a valid backend session restores auth correctly.
- [ ] Refresh on an expired backend session does not leave stale authenticated UI.
- [ ] Home/public auth CTA uses canonical auth session actions instead of temporary demo-only state.
- [ ] No page component hardcodes auth endpoint URLs.
- [ ] No token/localStorage auth scheme is introduced.
- [ ] No `any`, no forbidden equality operators, no hardcoded redirects to external URLs.
- [ ] `bun run type-check` passes.
- [ ] `bun run el:check` passes.
- [ ] `bun run build` passes.

## Risks And Mitigations

**Risk: duplicated auth state between route guard, modal, and future header.**
Mitigation: keep one shared auth session source with canonical `user`, pending flags, and invalidation logic.

**Risk: stale sessionStorage/auth hints claim the user is authenticated after the backend session expired.**
Mitigation: treat persisted client hints as provisional only; protected access still requires successful `/api/auth/me`
bootstrap.

**Risk: global `401` handling causes redirect loops or signs the user out during login/bootstrap itself.**
Mitigation: explicitly exclude auth bootstrap/login/logout request contexts from naive global invalidation behavior.

**Risk: `403` is incorrectly treated as `401`, causing unnecessary logout.**
Mitigation: keep unauthorized vs forbidden semantics explicit in the shared error handling rules.

**Risk: redirect targets become an open-redirect bug or navigate to malformed paths.**
Mitigation: accept only validated internal app paths before post-login navigation.

**Risk: modal/query cleanup becomes inconsistent between manual close, browser back, and successful login.**
Mitigation: keep query intent handling in `PublicLayout.vue` deterministic and test direct-link, refresh, and close
scenarios.

**Risk: auth state shape is designed around the temporary landing page and must be redone in P6/P7.**
Mitigation: expose full `user` and generic auth actions now so later layout/page work only consumes existing state.

## Execution Order

1. P5.0 - confirm auth ownership boundaries and whether `authGate` should be broadened or renamed.
2. P5.1 - implement the canonical shared auth session store/composable.
3. P5.2 - finalize `AuthModal.vue` validation, pending state, and error mapping.
4. P5.3 - finalize route-guard redirect and public-layout query handling.
5. P5.4 - add centralized `401` / `403` handling.
6. P5.5 - implement canonical logout flow and align current home/auth CTA wiring.
7. P5.6 - verify refresh/session-persistence behavior against real bootstrap rules.
8. Run verification: `bun run type-check`, `bun run el:check`, `bun run build`.

## Open Questions

1. Should the existing `authGate` store keep its name for continuity, or should it be renamed in `P5` to reflect broader
   auth-session ownership? Ответ: `authGate`
2. Should bootstrap/network/server auth failures on protected navigation open the auth modal immediately, or should
   landing first show an inline `authError` message and require explicit retry? Ответ: лендинг должен быть доступен
   незалогиненному пользователю, но если тот захочет открыть кейс и начать общаться с нейросетью, то должна вызываться
   модалка аутентификации. Сама модалка должна быть fullscreen!
3. Is there any backend endpoint in current MVP scope that can legitimately return `403`, or should `P5` implement the
   distinction now and validate the exact UX once such a response is observed? Ответ: сделай, как сейчас на бэке

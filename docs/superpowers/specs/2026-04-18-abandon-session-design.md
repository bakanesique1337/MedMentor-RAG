# Abandon Session Design

Date: 2026-04-18
Scope: Backend + Frontend
Status: Draft for implementation

## Problem

A user who starts a simulation case currently has no way to end it except by going
through the diagnosis flow. The backend state `DIAGNOSIS_SELECT` is never set, so
the `DiagnosisPanel` is never shown during `IN_PROGRESS`, and the session remains
open forever. Side effects:

- A single stuck session blocks the user from starting a new case
  (`GET /api/simulations/active` keeps returning it).
- If the opening fails or hangs, the only escape is "Back to cases", which leaves
  the session dangling.
- The user has no way to bail out of a case they no longer want to complete.

## Goals

- Provide a user-visible "Abandon session" action that terminates any non-scoring
  session without producing a score.
- Free the user to start a new case immediately after abandoning.
- Keep abandoned sessions visible in history, clearly marked as such.

## Non-goals

- Cancelling in-flight AI streams at the transport level. The background generation
  task is allowed to complete and persist its output onto the abandoned session;
  that output will not be rendered anywhere user-facing.
- Undo. Abandon is final.
- Mobile parity. The sidebar (which hosts the button) is `hidden lg:flex` today.
  Mobile users will gain the action when the sidebar itself is surfaced on small
  screens (separate work).
- Automated tests. Explicitly out of scope for this iteration.

## Allowed states for abandon

Abandon is permitted from any state **except** `SCORING`, `COMPLETED`, `ABANDONED`.
In practice this covers every case where the user is stuck:

- `CASE_BROWSE`, `CASE_SELECTED`, `CASE_STARTED` (transient creation states)
- `IN_PROGRESS` (idle or with an in-flight patient reply)
- `DIAGNOSIS_SELECT` (currently unreachable, but allowed for forward compatibility)
- any `openingStatus`, including `OPENING_PENDING`, `OPENING_STREAMING`,
  `OPENING_FAILED`, `OPENING_READY`

`SCORING` is excluded because it is transient (seconds) and already terminates in
`COMPLETED`; waiting is strictly better than abandoning.

## Backend design

### Enum

Add `ABANDONED` to `ru.medmentor.model.SimulationState`:

```java
public enum SimulationState {
    CASE_BROWSE,
    CASE_SELECTED,
    CASE_STARTED,
    IN_PROGRESS,
    DIAGNOSIS_SELECT,
    SCORING,
    COMPLETED,
    ABANDONED,
}
```

### Service

New method on `SimulationService`:

```java
SimulationCommandResponseDto abandonSession(String username, Long sessionId);
```

Implementation in `SimulationServiceImpl`:

1. Resolve `userAccount` via `userAccountService.getByUsername(username)`.
2. `session = getOwnedSession(userAccount, sessionId)`.
3. `ensureState(session, EnumSet.complementOf(EnumSet.of(SCORING, COMPLETED, ABANDONED)))`.
4. `session.setState(ABANDONED)`.
5. `simulationSessionRepository.save(session)`.
6. Return `new SimulationCommandResponseDto(sessionId, "ABANDONED")`.

No interaction with `simulationInFlightRegistry`, no stream cancellation. Any
running generation task will persist its output onto the now-ABANDONED session;
the frontend navigates away and ignores it.

### Controller

New endpoint in `SimulationController`:

```java
@PostMapping("/{sessionId}/abandon")
public SimulationCommandResponseDto abandon(
        @PathVariable Long sessionId,
        Authentication authentication) {
    return simulationService.abandonSession(authentication.getName(), sessionId);
}
```

Error mapping (existing global handler):

- `IllegalStateException` (disallowed state) -> 409
- `IllegalArgumentException` (unknown session, not owner) -> 400

### Active-session query

Update `findActiveSessionEntity` in `SimulationServiceImpl`:

```java
private Optional<SimulationSession> findActiveSessionEntity(Long userId) {
    return simulationSessionRepository.findFirstByUserIdAndStateNotInOrderByCreatedAtDesc(
            userId,
            List.of(SimulationState.COMPLETED, SimulationState.ABANDONED)
    );
}
```

This ensures `GET /api/simulations/active` returns null (or the next most recent
non-terminal session) after the current one is abandoned, unblocking a new case.

### History

`HistorySessionDto` already tolerates null `score` and `result` via `Optional`. No
schema change. ABANDONED sessions will be returned with `score = null`,
`result = null`.

## Frontend design

### Types

`frontend/src/types/index.ts` — extend the `SimulationState` union with
`'ABANDONED'`. Any type guards or exhaustive maps that reference the union must be
updated.

### API composable

`frontend/src/composables/useSimulationApi.ts`:

```ts
async function abandon(sessionId: number | string): Promise<SimulationCommandResponse> {
    const id = toSessionId(sessionId)
    return apiPost<SimulationCommandResponse, Record<string, never>>(
        `/api/simulations/${id}/abandon`,
        {},
    )
}
```

Export from the composable's return object.

### ChatSidebar

`frontend/src/components/chat/ChatSidebar.vue`:

- Extend `STATE_LABEL` with `ABANDONED: 'Abandoned'`.
- Extend `STATE_BADGE_VARIANT` with `ABANDONED: 'neutral'`.
- Add a bottom section pushed down with `mt-auto`:

  ```vue
  <div class="mt-auto pt-4">
      <VButton
          v-if="canAbandon"
          variant="danger"
          class="w-full"
          @click="isConfirmOpen = true"
      >
          Abandon session
      </VButton>
  </div>
  ```

  `canAbandon` is a `computed` returning `true` when
  `session.state` is not in `{ 'SCORING', 'COMPLETED', 'ABANDONED' }`.

  All UI copy MUST be ASCII per the project rule in `frontend/CLAUDE.md`.

- Embed a `VModal` with `v-model="isConfirmOpen"`, `title="Abandon session?"`,
  `description="Your progress will not be saved and no score will be awarded."`.
  Footer slot contains:

  - `VButton variant="ghost"` labelled `Cancel` -> closes the modal.
  - `VButton variant="danger"` labelled `Abandon`,
    `:loading="isAbandonPending"` -> runs the abandon action.

- Local refs: `isConfirmOpen = ref(false)`, `isAbandonPending = ref(false)`,
  `abandonError = ref<string | null>(null)`.

- Emits: `(event: 'abandoned'): void`.

- Handler:

  ```ts
  async function handleConfirmAbandon(): Promise<void> {
      if (isAbandonPending.value) return
      isAbandonPending.value = true
      abandonError.value = null
      try {
          await simulationApi.abandon(props.sessionId)
          isConfirmOpen.value = false
          emit('abandoned')
      } catch {
          abandonError.value = 'Failed to abandon session. Please try again.'
      } finally {
          isAbandonPending.value = false
      }
  }
  ```

  Inside the modal, if `abandonError` is set, render a `VAlert status="error"`
  above the footer.

- `ChatSidebar` directly calls `useSimulationApi()` because this action is
  self-contained UX (button + modal + API). The parent only needs the success
  signal.

### ChatView

`frontend/src/views/ChatView.vue`:

- Pass through the emit:

  ```vue
  <ChatSidebar
      :session="session"
      :session-id="sessionId"
      class="hidden lg:flex"
      @abandoned="handleAbandoned"
  />
  ```

- `handleAbandoned`:

  ```ts
  function handleAbandoned(): void {
      socket.disconnect()
      router.push({ name: ROUTES.CASES })
  }
  ```

- Add an `isAbandoned` computed mirroring `isCompleted`:

  ```ts
  const isAbandoned = computed(() => session.value?.state === 'ABANDONED')
  ```

- Add a branch in the template between the `isCompleted` and the default
  "active" template for users who reach the URL of an already-abandoned session:

  ```vue
  <div v-else-if="isAbandoned" class="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8">
      <VAlert
          status="warning"
          title="Session abandoned"
          description="This session was abandoned. No score was awarded."
      />
      <VButton variant="secondary" @click="router.push({ name: ROUTES.CASES })">
          Back to cases
      </VButton>
  </div>
  ```

- Guard the `connect(sessionId)` call in `fetchSession` so it skips ABANDONED too:

  ```ts
  if (data.state !== 'COMPLETED' && data.state !== 'ABANDONED') {
      socket.connect(sessionId.value)
  }
  ```

### HistoryItem

`frontend/src/components/profile/HistoryItem.vue`:

- Extend its local state label/variant maps with `ABANDONED: 'Abandoned'` /
  `'neutral'`.
- Ensure the score/result render path handles `null` gracefully (should already,
  because `HistorySessionDto` always had them nullable — just verify during
  implementation).

## Data flow

```
User: click "Abandon session" in ChatSidebar
  ChatSidebar: isConfirmOpen = true
User: click "Abandon" in VModal
  ChatSidebar: isAbandonPending = true
  ChatSidebar: POST /api/simulations/{id}/abandon
    on success:
      ChatSidebar: isConfirmOpen = false, emit('abandoned')
      ChatView: socket.disconnect(); router.push(CASES)
    on error:
      ChatSidebar: abandonError set, isAbandonPending = false
                  (modal stays open, user can retry or cancel)
```

## Edge cases

- **Abandon while opening is streaming.** Backend sets state = ABANDONED. The
  streaming task may keep publishing chunks to STOMP; the client has already
  disconnected. When the task finishes, it will attempt to update the session
  (e.g., set `openingStatus = OPENING_READY`). Since nothing else depends on the
  session after abandon, this is a benign no-op write. If it becomes a problem
  (log noise, DB contention), add a `session.state == ABANDONED` short-circuit
  in the streaming completion callback — out of scope for v1.
- **Abandon while a patient reply is streaming.** Same as above. The generated
  `ConversationMessage` may land in the DB attached to the abandoned session.
  Acceptable — history does not render the conversation.
- **Direct navigation to `/session/:id` where state is already ABANDONED.** The
  new `isAbandoned` template branch handles this.
- **409 on abandon (state transitioned to SCORING between user intent and click).**
  Rare but possible. Surface the error in the modal; the user clicks cancel and
  the normal SCORING/COMPLETED flow takes over via polling/reload.
- **Network failure.** `abandonError` is shown in the modal; retry available.

## Files touched

Backend:

- `backend/src/main/java/ru/medmentor/model/SimulationState.java`
- `backend/src/main/java/ru/medmentor/service/SimulationService.java`
- `backend/src/main/java/ru/medmentor/service/SimulationServiceImpl.java`
- `backend/src/main/java/ru/medmentor/controller/SimulationController.java`

Frontend:

- `frontend/src/types/index.ts`
- `frontend/src/composables/useSimulationApi.ts`
- `frontend/src/components/chat/ChatSidebar.vue`
- `frontend/src/views/ChatView.vue`
- `frontend/src/components/profile/HistoryItem.vue`

## Out of scope (future iterations)

- True stream cancellation (check `simulationInFlightRegistry` inside the
  generation loop and short-circuit).
- Mobile entry point for the abandon action (depends on general mobile sidebar
  surfacing).
- Automated tests for the new service method and endpoint.
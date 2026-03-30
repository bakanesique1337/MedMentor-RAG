# Code Style Rules / Best Practices rules

### Separation of responsibilities

- ✅ **An SFC must not exceed 300–500 lines**: split it into smaller components
- ✅ **Controller components**: handle data, prop drilling, and catch emits from child components
- ✅ **Presentation components (Vue)**: UI only, minimal logic
- ✅ **Use composables for complex logic**: move business logic into `composables/`
- ✅ **Prop drilling > Pinia**: if prop drilling is enough, do NOT create a Pinia store
- ✅ **Comments**: JSDoc comments are required for all functions/methods.
- ❌ **Do NOT multiply stores**: use Pinia only for global state needed across different parts of the app

### Interaction pattern

**Page → Controller → Child components:**

1. **Page**: contains `fetch*` methods for working with the backend
2. **Controller component** (e.g., `FlatList`): handles data, prop drilling, and emits
3. **Child components**: UI only, emit events upward

## Method Naming

- `handle*` — data mutations: `handleToggle`, `handleUpdate`
- `on*` — event handlers: `onClick`, `onChange`
- `fetch*` — API calls: `fetchUser`, `fetchData`

### Comparisons

- ✅ **ALWAYS** use strict comparison `===` and `!==` (NOT `==` or `!=`)
- ✅ **REQUIRED** typing for: function arguments, return values, props, and store state

### Code structure

- ✅ Move "magic" numbers/strings into constants: `const ADULT_AGE = 18`
- ✅ Use mapping objects instead of `switch-case`: `Record<TStatus, string>`
- ✅ Use `enum` for lists of constants
- ✅ Keep shared types in the `types/` folder

### Best Practices

- ✅ Use **early returns** to improve readability (avoid deep nesting)
- ✅ Prefer **async/await** over `.then()` and always use `try/catch`
- ✅ Use **utility types**: `Omit<>`, `Pick<>`, `Partial<>`, `extends` for working with types
- ✅ **Single-responsibility functions**: each function does one thing
- ✅ Use **type guards** for type checks: `function isUser(item): item is User`
- ✅ Use **generics** for reusable logic: `ApiResponse<T>`
- ✅ Use **as const** for constant objects (narrow types instead of wide ones)
- ✅ Use **Promise.all** for parallel requests (NOT sequentially)
- ✅ Prefer **declarative array methods**: `.filter()`, `.map()`, `.reduce()` instead of loops
- ❌ **Do NOT mutate data** directly: use the spread operator `[...array]`, `{...object}`
- ✅ **Clean up resources** in `onUnmounted()`: timers (`clearInterval`), event listeners (`removeEventListener`)
- ✅ Use **IntersectionObserver** for lazy loading/infinite scroll
- ✅ Use **debounce/throttle** for frequent events (search, scroll, resize)


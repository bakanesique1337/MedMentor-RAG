## Performance Guidelines

1. Vue 3 Reactivity Optimizations

### Avoid Unnecessary Reactivity

* Use `ref()` for primitives
* Use `reactive()` only for truly shared state objects
* Prefer `shallowRef()` / `shallowReactive()` for large objects (e.g. API responses, chart configs)
* Use `markRaw()` for third-party instances (maps, charts, editors)

```typescript
const chart = shallowRef<Chart | null>(null)
```

Use markRaw() for libraries like Chart.js:

```typescript
const editor = markRaw(createEditor());
```

### Use `computed` instead of watchers

Prefer `computed()` for derived state.
Avoid `watch()` when a pure derivation is sufficient.

❌ Avoid:

```typescript
watch(items, () => {
    filtered.value = expensiveFilter(items.value)
});
```

✅ Prefer:

```typescript
const filtered = computed(() => expensiveFilter(items.value))
```

Why:

* `computed` caches automatically
* `watch` re-runs side effects and is harder to reason about

### Avoid Deep Watchers

Deep watchers `({ deep: true })` are expensive.
If you need to react to nested changes:

* restructure state
* watch specific refs
* split large objects

2. Component Render Optimization

### Use `v-once` for Static Content

For static banners, headers, logos:

```vue

<div v-once>
    ...
</div>
```

### Proper key Usage in v-for

Always use stable keys:

```vue

<li v-for="item in items" :key="item.id">
```

Never use index as key unless the list is static.

### Avoid Large Reactive Props

If passing large objects to many children:

* Pass only needed fields
* Or use `provide/inject`
* Or lift state higher

3. Large Lists & Rendering Strategy

### Virtualize Large Lists

For lists > 200 items, use virtualization libraries such as VueUse Virtual List
Avoid rendering full 1000+ item DOM trees.

### Paginate or Lazy Load

Prefer:

* Infinite scroll
* Server pagination
* IntersectionObserver loading

4. Async & Code Splitting (Vite)

### Use Dynamic Imports

Lazy-load heavy components:

```typescript
const AdminPanel = defineAsyncComponent(() =>
    import('@/features/admin/AdminPanel.vue')
)
```

Use for:

* Routes
* Modals
* Rarely used features

### Route-Level Code Splitting

With Vue Router:

```
{
    path: '/admin',
    component: () => import('@/pages/AdminPage.vue')
}
```

Analyze Bundle Size

Use:

```bash
vite build --mode analyze
```

Look for:

* Large UI libraries
* Unused icons

5. Event & Input Optimization

### Debounce / Throttle Expensive Handlers

Use debounce for:

* Search inputs
* Resize listeners
* Scroll handlers

Example (VueUse):

```vue
const debouncedSearch = useDebounceFn(search, 300);
```

### Avoid Watching Entire Forms

Instead of:

```
watch(form, ...)
```

Watch specific fields.

6. Tailwind Performance Considerations

### Avoid Runtime Class Computation in Large Lists

Instead of:

```vue
:class="['p-2', isActive ? 'bg-blue-500' : 'bg-gray-500']"
```

Prefer precomputed class maps:

```vue
const statusClasses = {
active: 'bg-blue-500',
inactive: 'bg-gray-500'
}
```

Use JIT Properly

Ensure:

* `content` paths in tailwind.config.js are correct
* No dynamic class strings that break purging

Avoid:

```vue
:class="`bg-${color}-500`"
```

7. Avoid Common Vue Performance Mistakes

* Don’t destructure reactive objects without `toRefs()`
* Don’t create watchers inside loops
* Don’t use nextTick as a default fix
* Don’t store large mutable objects in global reactive stores unnecessarily
* Don’t mutate props directly

### When to Optimize Manually

Manual optimization is needed when:

* Rendering 500+ items
* Expensive computed transformations (sorting/filtering large arrays)
* Complex dashboards
* Real-time updates (WebSocket data)
* Heavy canvas / chart integrations

### Summary Philosophy

Vue 3 is already optimized.

Focus on:

* Reducing reactive scope
* Minimizing deep tracking
* Splitting bundles
* Virtualizing large DOM
* Avoiding unnecessary watchers
* Avoid premature micro-optimizations.

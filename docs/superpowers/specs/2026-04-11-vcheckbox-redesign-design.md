# VCheckbox Redesign

**Date:** 2026-04-11
**Status:** Approved

## Goal

Refactor `VCheckbox.vue` to match the visual and motion language of `VButton` and `VInput`:
squircle shape, micro-scale interactions, animated SVG checkmark drawn via stroke-dasharray.
No indeterminate state. No new props.

## Box — shape and resting states

- Size: `2rem x 2rem` (unchanged)
- Shape: `squircle squircle-sm` (`--squircle-radius: 1.2rem`)
- **Unchecked**: `border: 1px solid --color-border-default`, `background: --color-surface-elevated`
- **Checked**: border + background become `--color-interactive-primary-default`
- **Invalid (unchecked)**: border becomes `--color-error-border`, focus ring uses error tint
- **Disabled**: `opacity-50`, `pointer-events-none`, no hover or scale

## Micro-animations on the box (from VButton)

- **hover**: box scales to `scale(1.08)`, border transitions to `--color-border-strong`
- **active/press**: box scales to `scale(0.92)`
- **focus-visible** (on the hidden `<input>`): box gets box-shadow ring
  `0 0 0 3px color-mix(in srgb, var(--color-interactive-primary-default) 15%, transparent)`
- Transitions:
  - `transform`: `--duration-fast` / `--ease-spring`
  - `border-color`, `background-color`: `--duration-input` / `--ease-input`
  - `box-shadow`: `--duration-input` / `--ease-input`
- hover and scale are disabled when `disabled` or `readonly`

## SVG checkmark (stroke-dasharray draw animation)

- Inline SVG inside the component (no separate icon file)
- `stroke-linecap: round`, `stroke-linejoin: round`
- Color: `currentColor` (inherits `text-text-inverse` = white from the box)
- Draw animation on check:
  - `stroke-dashoffset: <full-length> -> 0`, duration ~200ms, `ease-default`
  - `opacity: 0 -> 1`, synced with draw start to avoid start-of-path artifact
- Erase animation on uncheck:
  - `stroke-dashoffset: 0 -> <full-length>`, duration ~150ms, `ease-exit`
  - `opacity: 1 -> 0`

## Component structure

```
<label>
  <span>                          <!-- relative wrapper for the box -->
    <input type="checkbox" />     <!-- sr-only, drives :checked state -->
    <span class="checkbox-box">   <!-- squircle box with transitions -->
      <svg>                       <!-- inline checkmark -->
        <path />
      </svg>
    </span>
  </span>
  <span>                          <!-- label + description text -->
    <span>{{ label }}</span>
    <span>{{ description }}</span>
  </span>
</label>
```

## Props (unchanged)

| Prop | Type | Default |
|------|------|---------|
| `modelValue` | `boolean` | `false` |
| `id` | `string` | `''` |
| `label` | `string` | `''` |
| `description` | `string` | `''` |
| `disabled` | `boolean` | `false` |
| `readonly` | `boolean` | `false` |
| `required` | `boolean` | `false` |
| `invalid` | `boolean` | `false` |
| `rootClass` | `string` | `''` |

Emits: `update:modelValue` (unchanged).

## Implementation notes

- Animations defined in `<style scoped>` using CSS custom properties and `transition`
- Use `peer` Tailwind pattern: hidden `<input class="peer sr-only">`, box reacts via
  `peer-focus-visible:` and `peer-checked:` — or drive via `:class` binding if more readable
- No external icon component
- Follows project rules: no `px` units (except border `1px`), strict types, ASCII only
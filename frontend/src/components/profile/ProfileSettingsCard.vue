<script setup lang="ts">
import { computed } from 'vue'

import ProfileAvatar from '@/components/profile/ProfileAvatar.vue'
import type { AvatarVariant } from '@/types'

const COPY = {
    editingMode: 'Режим редактирования',
    avatarTitle: 'Аватар-монограмма',
    avatarHint: 'Выберите цвет или загрузите фотографию',
    colorPrefix: 'Цвет:',
    emptyValue: '—',
} as const

interface ProfileFormState {
    firstName: string
    lastName: string
    email: string
    role: string
    course: string
    faculty: string
    university: string
    avatarVariant: AvatarVariant
}

interface Props {
    form: ProfileFormState
    editing: boolean
    fullName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
    'update:form': [next: ProfileFormState]
}>()

const ROLE_OPTIONS = ['Студент', 'Ординатор', 'Врач', 'Преподаватель'] as const
const COURSE_OPTIONS = [
    '1 курс',
    '2 курс',
    '3 курс',
    '4 курс',
    '5 курс',
    '6 курс',
    'Ординатура',
    'Врач',
] as const
const FACULTY_OPTIONS = [
    'Лечебный факультет',
    'Педиатрический факультет',
    'Стоматологический факультет',
    'Медико-биологический факультет',
] as const

const AVATAR_OPTIONS: ReadonlyArray<{ key: AvatarVariant; label: string }> = [
    { key: 'teal', label: 'Бирюзовый' },
    { key: 'sand', label: 'Песочный' },
    { key: 'rose', label: 'Коралл' },
    { key: 'violet', label: 'Сирень' },
    { key: 'mint', label: 'Мята' },
    { key: 'sky', label: 'Небо' },
]

interface FieldConfig {
    key: keyof ProfileFormState
    label: string
    type?: 'text' | 'email'
    mono?: boolean
    options?: readonly string[]
}

const FIELDS: ReadonlyArray<FieldConfig> = [
    { key: 'firstName', label: 'Имя' },
    { key: 'lastName', label: 'Фамилия' },
    { key: 'email', label: 'Email', type: 'email', mono: true },
    { key: 'role', label: 'Роль', options: ROLE_OPTIONS },
    { key: 'course', label: 'Курс / стаж', options: COURSE_OPTIONS },
    { key: 'faculty', label: 'Факультет', options: FACULTY_OPTIONS },
    { key: 'university', label: 'Учебное заведение' },
]

const activeAvatarLabel = computed<string>(
    () => AVATAR_OPTIONS.find((v) => v.key === props.form.avatarVariant)?.label ?? COPY.emptyValue,
)

function update<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]): void {
    emit('update:form', { ...props.form, [key]: value })
}

function handleVariant(variant: AvatarVariant): void {
    update('avatarVariant', variant)
}

function fieldValue(key: keyof ProfileFormState): string {
    return String(props.form[key] ?? '')
}
</script>

<template>
    <div class="rounded-[1.4rem] border border-[color:var(--color-line)] bg-white px-[2.2rem] pb-[2.2rem] pt-[2rem]">
        <div
            v-if="editing"
            class="mb-[1.4rem] flex items-center justify-end gap-[0.6rem] text-eyebrow-sm text-brand"
        >
            <span class="h-[0.6rem] w-[0.6rem] rounded-full bg-brand anim-pulse" />
            {{ COPY.editingMode }}
        </div>

        <!-- Avatar row -->
        <div class="mb-[2rem] flex items-center gap-[2.2rem] border-b border-[color:var(--color-line)] pb-[2rem]">
            <ProfileAvatar
                :name="fullName"
                :size="72"
                :variant="form.avatarVariant"
            />
            <div class="min-w-0 flex-1">
                <p class="mb-[0.3rem] text-[1.3rem] font-medium text-text-primary">
                    {{ COPY.avatarTitle }}
                </p>
                <p class="mb-[1rem] text-[1.2rem] text-text-tertiary">
                    {{ COPY.avatarHint }}
                </p>

                <div
                    v-if="editing"
                    class="flex flex-wrap gap-[0.6rem]"
                >
                    <button
                        v-for="variant in AVATAR_OPTIONS"
                        :key="variant.key"
                        type="button"
                        class="inline-flex items-center gap-[0.6rem] rounded-[0.8rem] border bg-transparent py-[0.3rem] pl-[0.3rem] pr-[1rem] transition"
                        :class="variant.key === form.avatarVariant
                            ? 'border-brand outline outline-[0.2rem] outline-brand-ghost'
                            : 'border-[color:var(--color-line)] hover:border-[color:var(--color-line-2)]'"
                        :title="variant.label"
                        @click="handleVariant(variant.key)"
                    >
                        <ProfileAvatar
                            :name="fullName"
                            :size="28"
                            :variant="variant.key"
                        />
                        <span class="text-[1.1rem] text-text-secondary">
                            {{ variant.label }}
                        </span>
                    </button>
                </div>
                <p
                    v-else
                    class="text-[1.2rem] text-text-tertiary"
                >
                    {{ COPY.colorPrefix }} {{ activeAvatarLabel }}
                </p>
            </div>
        </div>

        <!-- Fields grid -->
        <div class="grid grid-cols-1 gap-[1.8rem] sm:grid-cols-2">
            <div
                v-for="field in FIELDS"
                :key="field.key"
                class="flex flex-col gap-[0.6rem]"
            >
                <label class="text-eyebrow-sm text-text-tertiary">
                    {{ field.label }}
                </label>

                <template v-if="editing">
                    <select
                        v-if="field.options"
                        class="profile-select h-[3.8rem] rounded-[0.7rem] border border-[color:var(--color-line-2)] bg-white px-[1rem] text-[1.35rem] text-text-primary outline-none focus:border-brand"
                        :value="fieldValue(field.key)"
                        @change="(event) => update(field.key, (event.target as HTMLSelectElement).value as ProfileFormState[typeof field.key])"
                    >
                        <option
                            v-if="!fieldValue(field.key)"
                            value=""
                            disabled
                        >
                            {{ COPY.emptyValue }}
                        </option>
                        <option
                            v-for="option in field.options"
                            :key="option"
                            :value="option"
                        >
                            {{ option }}
                        </option>
                    </select>
                    <input
                        v-else
                        :type="field.type ?? 'text'"
                        :value="fieldValue(field.key)"
                        class="h-[3.8rem] rounded-[0.7rem] border border-[color:var(--color-line-2)] bg-white px-[1.2rem] text-[1.35rem] text-text-primary outline-none focus:border-brand"
                        :class="field.mono ? 'font-mono' : ''"
                        @input="(event) => update(field.key, (event.target as HTMLInputElement).value as ProfileFormState[typeof field.key])"
                    >
                </template>

                <p
                    v-else
                    class="border-b border-[color:var(--color-line)] py-[0.8rem] text-[1.4rem] text-text-primary"
                    :class="field.mono ? 'font-mono' : ''"
                >
                    <template v-if="fieldValue(field.key)">
                        {{ fieldValue(field.key) }}
                    </template>
                    <span
                        v-else
                        class="text-text-tertiary"
                    >{{ COPY.emptyValue }}</span>
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.profile-select {
    appearance: none;
    padding-right: 2.8rem;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 4l3 3 3-3' stroke='%237a8f8f' stroke-width='1.3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>");
    background-position: right 1rem center;
    background-repeat: no-repeat;
}
</style>

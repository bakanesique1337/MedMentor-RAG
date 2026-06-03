<script setup lang="ts">
import ProfileAvatar from '@/components/profile/ProfileAvatar.vue'
import type { AvatarVariant } from '@/types'

const COPY = {
    eyebrow: 'Профиль',
    editButton: 'Редактировать профиль',
} as const

interface Props {
    name: string
    role: string
    facultyLine: string
    university: string
    avatarVariant: AvatarVariant
}

defineProps<Props>()

const emit = defineEmits<{
    edit: []
}>()

function onEdit(): void {
    emit('edit')
}
</script>

<template>
    <section
        class="border-b border-[color:var(--color-line)] px-[2.4rem] py-[3.6rem]"
        style="background: linear-gradient(180deg, #e8f2f1 0%, #f4f7f7 100%);"
    >
        <div class="mx-auto w-full max-w-[120rem]">
            <p class="mb-[1.4rem] text-eyebrow text-brand">{{ COPY.eyebrow }}</p>

            <div class="flex flex-wrap items-center gap-[2.8rem]">
                <ProfileAvatar
                    :name="name"
                    :size="120"
                    :variant="avatarVariant"
                />

                <div class="min-w-0 flex-1 basis-[32rem]">
                    <h1 class="mb-[1rem] font-serif text-[4.2rem] font-medium leading-[1.08] tracking-[-0.025em] text-text-primary">
                        {{ name }}
                    </h1>

                    <div class="flex flex-wrap items-center gap-[1rem] text-[1.35rem] text-text-secondary">
                        <span class="rounded-[0.4rem] border border-[color:var(--color-line-2)] bg-white px-[0.8rem] py-[0.3rem] font-mono text-[1.05rem] font-semibold uppercase tracking-[0.1em] text-brand">
                            {{ role }}
                        </span>
                        <span>{{ facultyLine }}</span>
                        <span class="text-[color:rgb(200_212_211)]">&middot;</span>
                        <span>{{ university }}</span>
                    </div>
                </div>

                <div class="flex shrink-0 gap-[1rem]">
                    <button
                        type="button"
                        class="inline-flex h-[3.8rem] items-center gap-[0.6rem] rounded-[0.8rem] bg-brand px-[1.6rem] text-[1.3rem] font-medium text-white shadow-primary transition hover:bg-brand-deep hover:-translate-y-[0.1rem]"
                        @click="onEdit"
                    >
                        {{ COPY.editButton }}
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>

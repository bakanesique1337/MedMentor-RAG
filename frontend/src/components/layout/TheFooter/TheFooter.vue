<script setup lang="ts">
import BrandLogo from '@/components/common/BrandLogo.vue'

const COPY = {
    tagline: 'Клинический тренажёр для будущих врачей. Разработан при участии кафедр РНИМУ им. Н.И. Пирогова.',
    copyright: '© 2026 MedMentor RAG · Все права защищены',
    termsLink: 'Условия использования',
    privacyLink: 'Конфиденциальность',
} as const

export type FooterVariant = 'public' | 'app' | 'error'

interface Props {
    variant: FooterVariant
}

defineProps<Props>()
</script>

<template>
    <footer
        v-if="variant === 'public' || variant === 'error'"
        class="bg-[color:var(--color-ink)] text-[color:rgb(234_244_243_/_0.72)]"
    >
        <div class="mx-auto w-full max-w-[124rem] px-[3.2rem] pb-[3.2rem] pt-[6.4rem]">
            <div class="mb-[4.8rem] flex flex-wrap items-start gap-[4.8rem]">
                <div class="max-w-[36rem]">
                    <BrandLogo
                        variant="dark"
                        :size="28"
                    />
                    <p class="mt-[1.6rem] text-[1.35rem] leading-[1.6]">
                        {{ COPY.tagline }}
                    </p>
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-[1.6rem] border-t border-[color:rgb(159_198_194_/_0.2)] pt-[2.8rem] font-mono text-[1.2rem] tracking-[0.04em] text-[color:rgb(234_244_243_/_0.5)]">
                <div>{{ COPY.copyright }}</div>
                <div class="flex gap-[2rem]">
                    <a
                        href="#"
                        class="transition-colors hover:text-[color:var(--color-mint)]"
                    >{{ COPY.termsLink }}</a>
                    <a
                        href="#"
                        class="transition-colors hover:text-[color:var(--color-mint)]"
                    >{{ COPY.privacyLink }}</a>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import WarningModal from '@/components/common/WarningModal.vue'
import { categoryDisplayLabel } from '@/constants/caseCategories'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'
import type { SimulationSession } from '@/types'

const COPY = {
    brandLogoLetter: 'M',
    brandWordmark: 'MedMentor',
    brandSubtitle: 'RAG · Clinical Sim',
    casesNav: 'Кейсы',
    currentCaseEyebrow: 'Текущий кейс',
    yearsSuffix: 'г.',
    patientLine: 'пациент в симуляции',
    difficultyLabel: 'Сложность',
    difficultyOf: '/3',
    questionsLabel: 'Вопросы',
    passportEyebrow: 'Паспорт пациента',
    cmUnit: 'см',
    kgUnit: 'кг',
    bmiLabel: 'ИМТ',
    allergiesLabel: 'Аллергии',
    chronicLabel: 'Хрон. забол.',
    smokingLabel: 'Курение',
    passportEmpty: 'Запросите осмотр, чтобы увидеть антропометрию и анамнез.',
    vitalsEyebrow: 'Витальные показатели',
    liveTag: 'Live',
    vitalHrLabel: 'ЧСС',
    vitalHrUnit: 'уд/мин',
    vitalBpLabel: 'АД',
    vitalBpUnit: 'mmHg',
    vitalSpo2Label: 'SpO₂',
    vitalSpo2Unit: '%',
    vitalTempLabel: 'Темп.',
    vitalTempUnit: '°C',
    vitalRrLabel: 'ЧДД',
    vitalRrUnit: '/мин',
    vitalsEmpty: 'До запроса физикального осмотра витальные показатели скрыты.',
    requestExamButton: 'Провести осмотр',
    profileAriaLabel: 'Открыть профиль',
    fallbackUserName: 'Студент',
    userSubtitle: 'Студент · 5 курс, леч. фак.',
    warningEyebrow: 'EXIT CASE',
    warningTitle: 'Завершить',
    warningTitleAccent: 'без диагноза?',
    warningDescription: 'Прогресс будет сохранён, но кейс будет отмечен как незавершённый.',
    warningCallout: 'Вы не получите баллов за диагностическую точность. К кейсу можно вернуться позже — разбор будет доступен в режиме только для чтения.',
    warningCancel: 'Продолжить кейс',
    warningConfirm: 'Завершить кейс',
} as const

const FALLBACK_PATIENT_INITIALS = 'ПС'
const FALLBACK_USER_INITIAL = 'У'
const SEX_FEMALE_VALUES = ['female', 'жен'] as const
const SEX_LABEL = { female: 'Ж', male: 'М' } as const
const NOT_FOUND_VALUE = 'не выявлено'
const NOT_SMOKING_VALUE = 'не курит'

const MAX_TURNS = 10

interface Props {
    session: SimulationSession
    sessionId: number
    casesCount: number | null
    isAbandonPending: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
    abandon: []
    'request-exam': []
}>()

const router = useRouter()
const authGate = useAuthGateStore()

const isWarningOpen = ref(false)

/**
 * Total number of doctor turns used in the conversation so far.
 */
const doctorTurns = computed(() =>
    props.session.messages.filter((m) => m.role === 'DOCTOR').length,
)

const categoryLabel = computed(() => categoryDisplayLabel(props.session.caseCategory).toUpperCase())

/**
 * Maps case difficulty string to a 1-3 dot count.
 */
const difficultyLevel = computed(() => {
    const level = props.session.caseDifficulty?.toLowerCase() ?? ''
    if (level === 'easy') return 1
    if (level === 'hard' || level === 'expert') return 3
    return 2
})

const difficultyDots = computed(() => {
    const filled = difficultyLevel.value
    return [0, 1, 2].map((i) => i < filled)
})

const patientInitials = computed(() => {
    const name = props.session.patientName
    return name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase() || FALLBACK_PATIENT_INITIALS
})

const userInitials = computed(() => {
    const name = authGate.displayName || authGate.username || FALLBACK_USER_INITIAL
    return name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0] ?? '')
        .join('')
        .toUpperCase() || FALLBACK_USER_INITIAL
})

const sexLabel = computed(() => {
    const sex = props.session.patientSex?.toLowerCase() ?? ''
    return SEX_FEMALE_VALUES.includes(sex as typeof SEX_FEMALE_VALUES[number]) ? SEX_LABEL.female : SEX_LABEL.male
})

const passport = computed(() => props.session.passport)
const vitals = computed(() => props.session.vitals)
const examRevealed = computed(() => props.session.examRevealed)

/**
 * BMI computed from height (cm) and weight (kg). Returns the formatted value
 * along with a clinical interpretation tag suitable for the sidebar passport row.
 */
const bmi = computed(() => {
    const p = passport.value
    if (!p) return null
    const heightM = p.heightCm / 100
    if (heightM <= 0) return null
    const value = p.weightKg / (heightM * heightM)
    let label = 'норма'
    let alert = false
    if (value < 18.5) {
        label = 'дефицит массы'
        alert = true
    } else if (value < 25) {
        label = 'норма'
    } else if (value < 30) {
        label = 'избыток'
        alert = true
    } else if (value < 35) {
        label = 'ожирение I'
        alert = true
    } else if (value < 40) {
        label = 'ожирение II'
        alert = true
    } else {
        label = 'ожирение III'
        alert = true
    }
    return { value: value.toFixed(1), label, alert }
})

const isCanAbandon = computed(() => {
    const state = props.session.state
    return state !== 'SCORING' && state !== 'COMPLETED' && state !== 'ABANDONED'
})

function handleNavigateCases(): void {
    if (!isCanAbandon.value) {
        emit('abandon')
        return
    }
    isWarningOpen.value = true
}

function handleConfirmAbandon(): void {
    emit('abandon')
}

function handleCancelAbandon(): void {
    isWarningOpen.value = false
}

function handleRequestExam(): void {
    emit('request-exam')
}
</script>

<template>
    <aside
        class="flex w-[32rem] shrink-0 flex-col overflow-hidden border-r border-[color:var(--color-dark-line-strong)] bg-[color:var(--color-dark-bg)] text-[color:var(--color-dark-ink)]"
    >
        <div
            class="flex items-center gap-[1rem] border-b border-[color:var(--color-dark-line)] px-[1.6rem] py-[1.4rem]"
        >
            <div
                class="flex size-[3rem] shrink-0 items-center justify-center rounded-[0.7rem] font-serif text-[1.7rem] font-semibold italic text-[color:var(--color-ink)]"
                style="background: linear-gradient(135deg, var(--color-dark-teal), var(--color-teal-deep)); box-shadow: 0 0 0 1px rgb(63 185 179 / 35%), 0 4px 12px rgb(63 185 179 / 20%);"
            >
                {{ COPY.brandLogoLetter }}
            </div>
            <div class="min-w-0 flex-1">
                <div class="text-[1.3rem] font-semibold leading-tight tracking-[-0.01em] text-[color:var(--color-dark-ink)]">
                    {{ COPY.brandWordmark }}
                </div>
                <div class="text-eyebrow-sm text-[color:var(--color-dark-teal)]">
                    {{ COPY.brandSubtitle }}
                </div>
            </div>
        </div>

        <div class="px-[1rem] py-[1.2rem]">
            <button
                type="button"
                class="flex w-full items-center gap-[1rem] rounded-[0.6rem] border-l-[0.2rem] border-transparent px-[1rem] py-[0.8rem] text-left text-[1.3rem] text-[color:var(--color-dark-ink-2)] transition hover:bg-[color:rgb(63_185_179_/_0.06)] hover:text-[color:var(--color-dark-ink)]"
                @click="handleNavigateCases"
            >
                <span class="flex w-[1.6rem] items-center justify-center">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                    >
                        <rect
                            x="2"
                            y="3"
                            width="10"
                            height="9"
                            rx="1"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.2"
                        />
                        <path
                            d="M5 3V2a1 1 0 011-1h2a1 1 0 011 1v1"
                            stroke="currentColor"
                            stroke-width="1.2"
                            fill="none"
                        />
                    </svg>
                </span>
                <span class="flex-1">{{ COPY.casesNav }}</span>
                <span
                    v-if="props.casesCount !== null"
                    class="font-mono text-[1.05rem] tabular text-[color:var(--color-dark-ink-3)]"
                >
                    {{ props.casesCount }}
                </span>
            </button>
        </div>

        <div class="mx-[1.6rem] h-px bg-[color:var(--color-dark-line)]" />

        <div class="flex-1 overflow-y-auto px-[1.6rem] py-[1.6rem]">
            <p class="mb-[0.6rem] text-eyebrow-sm text-[color:var(--color-dark-ink-3)]">{{ COPY.currentCaseEyebrow }}</p>
            <p class="mb-[0.6rem] text-[1.05rem] font-mono font-semibold tracking-[0.1em] text-[color:var(--color-dark-teal)]">
                {{ categoryLabel }}
            </p>
            <h2 class="mb-[0.8rem] font-serif text-[2.2rem] font-medium leading-[1.15] tracking-[-0.01em] text-[color:var(--color-dark-ink)]">
                {{ session.caseTitle }}
            </h2>
            <p class="mb-[1.4rem] text-[1.2rem] leading-[1.5] text-[color:var(--color-dark-ink-2)]">
                {{ session.patientName }}, {{ session.patientAge }}&nbsp;{{ COPY.yearsSuffix }} &middot; {{ COPY.patientLine }}
            </p>

            <div class="mb-[1.8rem] flex gap-[0.8rem]">
                <div class="flex-1 rounded-[0.8rem] border border-[color:var(--color-dark-line)] bg-[color:var(--color-dark-raised)] px-[1rem] py-[0.8rem]">
                    <p class="mb-[0.4rem] text-eyebrow-sm font-mono uppercase text-[color:var(--color-dark-ink-2)]">
                        {{ COPY.difficultyLabel }}
                    </p>
                    <div class="flex items-center gap-[0.4rem]">
                        <span
                            v-for="(active, idx) in difficultyDots"
                            :key="idx"
                            class="size-[0.8rem] rounded-full"
                            :class="active ? 'bg-[color:var(--color-dark-teal)]' : 'bg-[color:var(--color-dark-line-strong)]'"
                        />
                        <span class="ml-[0.4rem] text-[1.1rem] font-medium text-[color:var(--color-dark-ink)]">
                            {{ difficultyLevel }}{{ COPY.difficultyOf }}
                        </span>
                    </div>
                </div>
                <div class="flex-1 rounded-[0.8rem] border border-[color:var(--color-dark-line)] bg-[color:var(--color-dark-raised)] px-[1rem] py-[0.8rem]">
                    <p class="mb-[0.4rem] text-eyebrow-sm font-mono uppercase text-[color:var(--color-dark-ink-2)]">
                        {{ COPY.questionsLabel }}
                    </p>
                    <p class="font-mono text-[1.4rem] font-medium tabular">
                        <span class="text-[color:var(--color-dark-teal)]">{{ doctorTurns }}</span>
                        <span class="text-[1.1rem] text-[color:var(--color-dark-ink-3)]">&nbsp;/ {{ MAX_TURNS }}</span>
                    </p>
                </div>
            </div>

            <p class="mb-[0.6rem] text-eyebrow-sm font-mono uppercase text-[color:var(--color-dark-ink-3)]">
                {{ COPY.passportEyebrow }}
            </p>
            <div class="mb-[1.8rem] rounded-[0.8rem] border border-[color:var(--color-dark-line)] bg-[color:var(--color-dark-raised)] px-[1.2rem] py-[1rem]">
                <div class="flex items-center gap-[1rem] border-b border-[color:var(--color-dark-line)] pb-[0.8rem]">
                    <div
                        class="flex size-[3.6rem] shrink-0 items-center justify-center rounded-full font-serif text-[1.3rem] font-semibold text-[color:var(--color-ink)]"
                        style="background: linear-gradient(135deg, var(--color-dark-teal), var(--color-teal-deep));"
                    >
                        {{ patientInitials }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-[1.3rem] font-medium text-[color:var(--color-dark-ink)]">
                            {{ session.patientName }}
                        </p>
                        <p class="text-[1.1rem] text-[color:var(--color-dark-ink-2)]">
                            {{ session.patientAge }}&nbsp;{{ COPY.yearsSuffix }} &middot; {{ sexLabel }}<template v-if="examRevealed && passport">
                                &middot; {{ passport.heightCm }}&nbsp;{{ COPY.cmUnit }} &middot; {{ passport.weightKg }}&nbsp;{{ COPY.kgUnit }}
                            </template>
                        </p>
                    </div>
                </div>

                <template v-if="examRevealed && passport">
                    <div
                        v-if="bmi"
                        class="flex items-baseline justify-between border-b border-[color:var(--color-dark-line)] py-[0.4rem] text-[1.15rem]"
                    >
                        <span class="text-[color:var(--color-dark-ink-2)]">{{ COPY.bmiLabel }}</span>
                        <span
                            class="font-medium"
                            :class="bmi.alert ? 'text-[color:var(--color-amber)]' : 'text-[color:var(--color-dark-ink)]'"
                        >
                            {{ bmi.value }} ({{ bmi.label }})
                        </span>
                    </div>
                    <div class="flex items-baseline justify-between border-b border-[color:var(--color-dark-line)] py-[0.4rem] text-[1.15rem]">
                        <span class="text-[color:var(--color-dark-ink-2)]">{{ COPY.allergiesLabel }}</span>
                        <span class="font-medium text-[color:var(--color-dark-ink)]">{{ passport.allergies }}</span>
                    </div>
                    <div class="flex items-baseline justify-between border-b border-[color:var(--color-dark-line)] py-[0.4rem] text-[1.15rem]">
                        <span class="text-[color:var(--color-dark-ink-2)]">{{ COPY.chronicLabel }}</span>
                        <span
                            class="text-right font-medium"
                            :class="passport.chronicConditions === NOT_FOUND_VALUE ? 'text-[color:var(--color-dark-ink)]' : 'text-[color:var(--color-amber)]'"
                        >
                            {{ passport.chronicConditions }}
                        </span>
                    </div>
                    <div class="flex items-baseline justify-between py-[0.4rem] text-[1.15rem]">
                        <span class="text-[color:var(--color-dark-ink-2)]">{{ COPY.smokingLabel }}</span>
                        <span
                            class="text-right font-medium"
                            :class="passport.smoking === NOT_SMOKING_VALUE ? 'text-[color:var(--color-dark-ink)]' : 'text-[color:var(--color-amber)]'"
                        >
                            {{ passport.smoking }}
                        </span>
                    </div>
                </template>

                <div
                    v-else
                    class="pt-[0.8rem]"
                >
                    <p class="text-[1.15rem] leading-[1.5] text-[color:var(--color-dark-ink-3)]">
                        {{ COPY.passportEmpty }}
                    </p>
                </div>
            </div>

            <div class="mb-[0.6rem] flex items-baseline justify-between">
                <p class="text-eyebrow-sm font-mono uppercase text-[color:var(--color-dark-ink-3)]">
                    {{ COPY.vitalsEyebrow }}
                </p>
                <span
                    v-if="examRevealed && vitals"
                    class="flex items-center gap-[0.4rem] text-[0.95rem] font-mono uppercase tracking-[0.06em] text-[color:var(--color-dark-teal)]"
                >
                    <span class="size-[0.5rem] rounded-full bg-[color:var(--color-dark-teal)] anim-pulse" />
                    {{ COPY.liveTag }}
                </span>
            </div>
            <div class="mb-[1.8rem] rounded-[0.8rem] border border-[color:var(--color-dark-line)] bg-[color:var(--color-dark-raised)] px-[1.2rem] py-[1rem]">
                <template v-if="examRevealed && vitals">
                    <div class="flex items-baseline justify-between border-b border-[color:var(--color-dark-line)] py-[0.4rem] text-[1.15rem]">
                        <span class="text-[color:var(--color-dark-ink-2)]">{{ COPY.vitalHrLabel }}</span>
                        <span class="font-mono font-medium text-[color:var(--color-dark-ink)]">
                            {{ vitals.heartRate }} {{ COPY.vitalHrUnit }}
                        </span>
                    </div>
                    <div class="flex items-baseline justify-between border-b border-[color:var(--color-dark-line)] py-[0.4rem] text-[1.15rem]">
                        <span class="text-[color:var(--color-dark-ink-2)]">{{ COPY.vitalBpLabel }}</span>
                        <span class="font-mono font-medium text-[color:var(--color-dark-ink)]">
                            {{ vitals.bloodPressure }} {{ COPY.vitalBpUnit }}
                        </span>
                    </div>
                    <div class="flex items-baseline justify-between border-b border-[color:var(--color-dark-line)] py-[0.4rem] text-[1.15rem]">
                        <span class="text-[color:var(--color-dark-ink-2)]">{{ COPY.vitalSpo2Label }}</span>
                        <span class="font-mono font-medium text-[color:var(--color-dark-ink)]">
                            {{ vitals.spo2 }}&nbsp;{{ COPY.vitalSpo2Unit }}
                        </span>
                    </div>
                    <div class="flex items-baseline justify-between border-b border-[color:var(--color-dark-line)] py-[0.4rem] text-[1.15rem]">
                        <span class="text-[color:var(--color-dark-ink-2)]">{{ COPY.vitalTempLabel }}</span>
                        <span class="font-mono font-medium text-[color:var(--color-dark-ink)]">
                            {{ vitals.temperatureC.toFixed(1) }} {{ COPY.vitalTempUnit }}
                        </span>
                    </div>
                    <div class="flex items-baseline justify-between py-[0.4rem] text-[1.15rem]">
                        <span class="text-[color:var(--color-dark-ink-2)]">{{ COPY.vitalRrLabel }}</span>
                        <span class="font-mono font-medium text-[color:var(--color-dark-ink)]">
                            {{ vitals.respiratoryRate }} {{ COPY.vitalRrUnit }}
                        </span>
                    </div>
                </template>

                <div
                    v-else
                    class="flex flex-col items-start gap-[0.8rem]"
                >
                    <p class="text-[1.15rem] leading-[1.5] text-[color:var(--color-dark-ink-3)]">
                        {{ COPY.vitalsEmpty }}
                    </p>
                    <button
                        type="button"
                        class="rounded-[0.6rem] border border-[color:var(--color-dark-line-strong)] bg-transparent px-[1rem] py-[0.5rem] text-[1.1rem] text-[color:var(--color-dark-teal)] transition hover:bg-[color:rgb(63_185_179_/_0.08)]"
                        @click="handleRequestExam"
                    >
                        {{ COPY.requestExamButton }}
                    </button>
                </div>
            </div>
        </div>

        <button
            type="button"
            class="flex items-center gap-[1rem] border-t border-[color:var(--color-dark-line)] px-[1.6rem] py-[1.2rem] text-left transition hover:bg-[color:rgb(234_244_243_/_0.04)]"
            :aria-label="COPY.profileAriaLabel"
            @click="router.push({ name: ROUTES.PROFILE })"
        >
            <div
                class="flex size-[2.8rem] shrink-0 items-center justify-center rounded-full bg-[color:var(--color-dark-teal)] text-[1.1rem] font-bold text-[color:var(--color-ink)]"
            >
                {{ userInitials }}
            </div>
            <div class="min-w-0 flex-1">
                <div class="truncate text-[1.2rem] font-medium text-[color:var(--color-dark-ink)]">
                    {{ authGate.displayName || authGate.username || COPY.fallbackUserName }}
                </div>
                <div class="truncate text-[1.05rem] text-[color:var(--color-dark-ink-2)]">
                    {{ COPY.userSubtitle }}
                </div>
            </div>
        </button>

        <WarningModal
            v-model="isWarningOpen"
            :eyebrow="COPY.warningEyebrow"
            :title="COPY.warningTitle"
            :title-accent="COPY.warningTitleAccent"
            :description="COPY.warningDescription"
            :callout="COPY.warningCallout"
            :cancel-label="COPY.warningCancel"
            :confirm-label="COPY.warningConfirm"
            :is-pending="props.isAbandonPending"
            @confirm="handleConfirmAbandon"
            @cancel="handleCancelAbandon"
        />
    </aside>
</template>

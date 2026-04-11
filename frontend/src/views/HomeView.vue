<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
    VAlert,
    VAvatar,
    VBadge,
    VButton,
    VCard,
    VCheckbox,
    VDropdown,
    VEmptyState,
    VInput,
    VModal,
    VSelect,
    VSkeleton,
    VSpinner,
    VTag,
    VTextarea,
    VTooltip,
} from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'
import type { SelectOption } from '@/components/ui'

const router = useRouter()
const authGate = useAuthGateStore()

const textValue = ref('Dr. House')
const emailValue = ref('resident@example.com')
const searchValue = ref('dyspnea')
const textareaValue = ref('Progressive shortness of breath for three days, worse on exertion.')
const selectValue = ref('cardiology')
const checkboxValue = ref(true)
const dropdownOpen = ref(false)
const tooltipOpen = ref(false)
const modalOpen = ref(false)

const options: SelectOption[] = [
    {
        label: 'Cardiology',
        value: 'cardiology',
    },
    {
        label: 'Pulmonology',
        value: 'pulmonology',
    },
    {
        label: 'Neurology (disabled)',
        value: 'neurology',
        disabled: true,
    },
]

const authCtaLabel = computed(() => (
    authGate.isAuthenticated ? 'Continue to cases' : 'Open auth modal'
))

function handlePrimaryCta(): void {
    if (authGate.isAuthenticated) {
        router.push({
            name: ROUTES.CASES,
        })
        return
    }

    authGate.openAuthModal()
}

function handleSecondaryCta(): void {
    if (authGate.isAuthenticated) {
        authGate.signOut()
        return
    }

    router.push({
        name: ROUTES.CASES,
    })
}
</script>

<template>
    <main class="min-h-screen bg-surface-base px-2 py-4">
        <div class="mx-auto flex w-full max-w-384 flex-col gap-4">
            <section
                class="rounded-[2.4rem] border border-border-subtle bg-linear-to-br from-surface-elevated to-surface-sunken px-4 py-5 shadow-sm"
            >
                <div class="space-y-2">
                    <VBadge variant="primary">Temporary UI Kit Demo + Auth Entry</VBadge>
                    <h1 class="text-display font-semibold text-text-primary">
                        Home page is now a vertical preview of all current UI kit variants.
                    </h1>
                    <p class="max-w-prose text-body text-text-secondary">
                        This page is temporary and exists to inspect the current component surface
                        before feature pages start consuming the kit.
                    </p>

                    <VAlert
                        :status="authGate.isAuthenticated ? 'success' : 'info'"
                        :title="authGate.isAuthenticated ? `Signed in as ${authGate.displayName}` : 'Authentication now opens in a modal'"
                        :description="authGate.isAuthenticated
                            ? 'Protected routes are available in the current session.'
                            : 'Use the primary CTA or try opening a protected route to see the auth modal flow.'"
                    />

                    <div class="flex flex-wrap gap-2 pt-1">
                        <VButton @click="handlePrimaryCta">
                            {{ authCtaLabel }}
                        </VButton>
                        <VButton
                            variant="secondary"
                            @click="handleSecondaryCta"
                        >
                            {{ authGate.isAuthenticated ? 'Sign out' : 'Try protected route' }}
                        </VButton>
                    </div>
                </div>
            </section>

            <VCard variant="default">
                <template #header>
                    <h2 class="text-h2 font-semibold text-text-primary">Buttons and spinner</h2>
                </template>

                <div class="flex flex-col gap-3">
                    <div class="flex flex-wrap gap-2">
                        <VButton size="sm">Primary sm</VButton>
                        <VButton>Primary md</VButton>
                        <VButton size="lg">Primary lg</VButton>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <VButton variant="secondary">Secondary</VButton>
                        <VButton variant="ghost">Ghost</VButton>
                        <VButton variant="danger">Danger</VButton>
                        <VButton loading>Loading</VButton>
                        <VButton disabled>Disabled</VButton>
                    </div>

                    <div class="flex flex-wrap items-center gap-3">
                        <VSpinner size="sm"/>
                        <VSpinner size="md"/>
                        <VSpinner size="lg"/>
                        <div class="rounded-lg bg-slate-900 px-2 py-1">
                            <VSpinner variant="inverse"/>
                        </div>
                    </div>
                </div>
            </VCard>

            <VCard variant="default">
                <template #header>
                    <h2 class="text-h2 font-semibold text-text-primary">Alerts</h2>
                </template>

                <div class="flex flex-col gap-2">
                    <VAlert
                        status="info"
                        title="Info alert"
                        description="Used for neutral status messaging and guidance."
                    />
                    <VAlert
                        status="success"
                        title="Success alert"
                        description="Used for positive completion and save feedback."
                    />
                    <VAlert
                        status="warning"
                        title="Warning alert"
                        description="Used for conflict and incomplete state messaging."
                    />
                    <VAlert
                        status="error"
                        title="Error alert"
                        description="Used for auth errors and blocking failures."
                    />
                </div>
            </VCard>

            <VCard variant="default">
                <template #header>
                    <h2 class="text-h2 font-semibold text-text-primary">Fields and form controls</h2>
                </template>

                <div class="flex flex-col gap-3">
                    <VInput
                        v-model="textValue"
                        label="Text input"
                        hint="Default text field"
                        placeholder="Enter value"
                    />

                    <VInput
                        v-model="emailValue"
                        type="email"
                        label="Email input"
                        placeholder="resident@example.com"
                    />

                    <VInput
                        v-model="searchValue"
                        type="search"
                        label="Search input"
                        placeholder="Search symptoms"
                    >
                        <template #prefix>
                            <span>?</span>
                        </template>
                    </VInput>

                    <VInput
                        model-value="Conflict while opening session"
                        label="Invalid input"
                        error="An active unfinished session already exists."
                        invalid
                        readonly
                    />

                    <VInput
                        model-value="Read only"
                        label="Readonly input"
                        readonly
                    />

                    <VInput
                        model-value=""
                        label="Disabled input"
                        placeholder="Disabled state"
                        disabled
                    />

                    <VTextarea
                        v-model="textareaValue"
                        label="Textarea"
                        hint="Autosize enabled"
                        :min-rows="4"
                        autosize
                    />

                    <VTextarea
                        model-value="Readonly textarea"
                        label="Readonly textarea"
                        readonly
                    />

                    <VSelect
                        v-model="selectValue"
                        label="Select"
                        placeholder="Choose specialty"
                        :options="options"
                    />

                    <VSelect
                        model-value=""
                        label="Invalid select"
                        placeholder="Choose specialty"
                        :options="options"
                        error="Please choose a valid diagnosis category."
                        invalid
                    />

                    <VCheckbox
                        v-model="checkboxValue"
                        label="Checkbox"
                        description="Inline label and supporting text."
                    />

                    <VCheckbox
                        :model-value="false"
                        label="Disabled checkbox"
                        description="Non-interactive state."
                        disabled
                    />
                </div>
            </VCard>

            <VCard variant="default">
                <template #header>
                    <h2 class="text-h2 font-semibold text-text-primary">Cards, badges, tags, avatar</h2>
                </template>

                <div class="flex flex-col gap-3">
                    <div class="flex flex-wrap gap-2">
                        <VBadge variant="neutral">Neutral</VBadge>
                        <VBadge variant="primary">Primary</VBadge>
                        <VBadge variant="success">Success</VBadge>
                        <VBadge variant="warning">Warning</VBadge>
                        <VBadge variant="error">Error</VBadge>
                    </div>

                    <div class="flex flex-wrap gap-2">
                        <VTag variant="neutral">metadata</VTag>
                        <VTag variant="primary">cardiology</VTag>
                        <VTag variant="success">completed</VTag>
                        <VTag variant="warning">pending</VTag>
                        <VTag variant="error">blocked</VTag>
                    </div>

                    <div class="flex flex-wrap items-center gap-3">
                        <VAvatar
                            name="Gregory House"
                            size="sm"
                        />
                        <VAvatar
                            name="Lisa Cuddy"
                            size="md"
                        />
                        <VAvatar
                            name="James Wilson"
                            size="lg"
                        />
                    </div>

                    <div class="grid gap-3 lg:grid-cols-2">
                        <VCard variant="default">
                            Default card
                        </VCard>
                        <VCard variant="elevated">
                            Elevated card
                        </VCard>
                        <VCard variant="outlined">
                            Outlined card
                        </VCard>
                        <VCard variant="interactive">
                            Interactive card
                        </VCard>
                    </div>
                </div>
            </VCard>

            <VCard variant="default">
                <template #header>
                    <h2 class="text-h2 font-semibold text-text-primary">Dropdown, tooltip, modal</h2>
                </template>

                <div class="flex flex-wrap items-center gap-3">
                    <VDropdown v-model="dropdownOpen">
                        <template #trigger="{ open }">
                            <span
                                class="rounded-lg border border-border-default bg-surface-elevated px-2 py-1 text-body-sm text-text-primary"
                            >
                                {{ open ? 'Close dropdown' : 'Open dropdown' }}
                            </span>
                        </template>

                        <div class="flex flex-col gap-0.5 p-1">
                            <button
                                class="rounded-lg px-2 py-1 text-left text-body-sm text-text-primary hover:bg-interactive-ghost-hover"
                            >
                                Profile
                            </button>
                            <button
                                class="rounded-lg px-2 py-1 text-left text-body-sm text-text-primary hover:bg-interactive-ghost-hover"
                            >
                                Cases
                            </button>
                            <button
                                class="rounded-lg px-2 py-1 text-left text-body-sm text-error-text hover:bg-error-surface"
                            >
                                Logout
                            </button>
                        </div>
                    </VDropdown>

                    <VTooltip
                        v-model="tooltipOpen"
                        text="Tooltip content should remain supplementary and non-critical."
                    >
                        <span
                            class="rounded-lg border border-border-default bg-surface-elevated px-2 py-1 text-body-sm text-text-primary"
                        >
                            Toggle tooltip
                        </span>
                    </VTooltip>

                    <VButton
                        variant="secondary"
                        @click="modalOpen = true"
                    >
                        Open modal
                    </VButton>
                </div>
            </VCard>

            <VCard variant="default">
                <template #header>
                    <h2 class="text-h2 font-semibold text-text-primary">Skeleton and empty state</h2>
                </template>

                <div class="flex flex-col gap-4">
                    <div class="space-y-2">
                        <VSkeleton class="skeleton"/>
                        <VSkeleton
                            width="70%"
                            class="skeleton"
                        />
                        <VSkeleton
                            shape="rectangle"
                            height="10rem"
                            class="skeleton"
                        />
                        <VSkeleton
                            shape="circle"
                            width="4.8rem"
                            class="skeleton"
                        />
                    </div>

                    <VEmptyState
                        title="No active session"
                        description="Reusable empty state for cases, history, profile, and chat recovery flows."
                    >
                        <template #illustration>
                            <span class="text-h2">?</span>
                        </template>

                        <template #action>
                            <VButton>Browse cases</VButton>
                        </template>
                    </VEmptyState>
                </div>
            </VCard>
        </div>

        <VModal
            v-model="modalOpen"
            title="Modal preview"
            description="Temporary overlay demo for the UI kit page."
        >
            <div class="space-y-2">
                <p class="text-body text-text-secondary">
                    This modal demonstrates scroll lock, Escape close, outside click handling,
                    and deterministic focus handoff.
                </p>
                <div class="flex gap-2">
                    <VButton
                        variant="ghost"
                        @click="modalOpen = false"
                    >
                        Cancel
                    </VButton>
                    <VButton
                        @click="modalOpen = false"
                    >
                        Confirm
                    </VButton>
                </div>
            </div>
        </VModal>
    </main>
</template>

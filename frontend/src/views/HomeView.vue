<script setup lang="ts">
import { useRouter } from 'vue-router'

import { VBadge, VButton, VCard } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { useAuthGateStore } from '@/stores/authGate'

const router = useRouter()
const authGate = useAuthGateStore()

/**
 * Handles the primary CTA.
 * Authenticated users navigate to cases; guests open the auth modal.
 */
function handlePrimaryCta(): void {
    if (authGate.isAuthenticated) {
        void router.push({ name: ROUTES.CASES })
        return
    }
    authGate.openAuthModal()
}
</script>

<template>
    <div>
        <!-- Hero -->
        <section class="bg-surface-base px-4 py-20 text-center">
            <div class="mx-auto max-w-[76.8rem]">
                <VBadge variant="primary" class="mb-4">AI-Powered Medical Training</VBadge>
                <h1 class="mt-4 text-display font-semibold text-text-primary">
                    Train Clinical Reasoning<br />With Virtual Patient Simulations
                </h1>
                <p class="mx-auto mt-6 max-w-[56rem] text-body text-text-secondary">
                    Practice history-taking and diagnostic reasoning in realistic virtual patient
                    encounters. Every response is grounded in verified clinical knowledge.
                </p>
                <div class="mt-8">
                    <VButton
                        size="lg"
                        @click="handlePrimaryCta"
                    >
                        {{ authGate.isAuthenticated ? 'Browse Cases' : 'Get Started' }}
                    </VButton>
                </div>
            </div>
        </section>

        <!-- How it works -->
        <section class="bg-surface-sunken px-4 py-16">
            <div class="mx-auto max-w-384">
                <h2 class="text-center text-h1 font-semibold text-text-primary">How It Works</h2>
                <p class="mt-2 text-center text-body text-text-secondary">
                    Three steps from sign-in to clinical feedback.
                </p>
                <div class="mt-10 grid gap-6 md:grid-cols-3">
                    <VCard variant="default">
                        <div class="flex flex-col gap-3">
                            <span
                                class="inline-flex h-[4rem] w-[4rem] items-center justify-center rounded-full bg-interactive-primary-default text-body font-bold text-text-inverse"
                            >1</span>
                            <h3 class="text-h2 font-semibold text-text-primary">Choose a Case</h3>
                            <p class="text-body-sm text-text-secondary">
                                Browse a library of clinical cases across multiple specialties and
                                difficulty levels. Each case presents a unique patient scenario.
                            </p>
                        </div>
                    </VCard>
                    <VCard variant="default">
                        <div class="flex flex-col gap-3">
                            <span
                                class="inline-flex h-[4rem] w-[4rem] items-center justify-center rounded-full bg-interactive-primary-default text-body font-bold text-text-inverse"
                            >2</span>
                            <h3 class="text-h2 font-semibold text-text-primary">Interview the Patient</h3>
                            <p class="text-body-sm text-text-secondary">
                                Conduct a structured clinical conversation. Ask about symptoms,
                                history, and request examinations. The patient responds based on
                                verified clinical data only.
                            </p>
                        </div>
                    </VCard>
                    <VCard variant="default">
                        <div class="flex flex-col gap-3">
                            <span
                                class="inline-flex h-[4rem] w-[4rem] items-center justify-center rounded-full bg-interactive-primary-default text-body font-bold text-text-inverse"
                            >3</span>
                            <h3 class="text-h2 font-semibold text-text-primary">Submit Your Diagnosis</h3>
                            <p class="text-body-sm text-text-secondary">
                                Select your diagnosis when ready. Receive detailed scoring on
                                communication quality, thoroughness, empathy, and diagnostic
                                accuracy.
                            </p>
                        </div>
                    </VCard>
                </div>
            </div>
        </section>

        <!-- RAG approach -->
        <section class="bg-surface-base px-4 py-16">
            <div class="mx-auto grid max-w-384 gap-10 md:grid-cols-2 md:items-center">
                <div>
                    <VBadge variant="success">Fact-Grounded AI</VBadge>
                    <h2 class="mt-3 text-h1 font-semibold text-text-primary">
                        No Hallucinations. Only Verified Clinical Data.
                    </h2>
                    <p class="mt-4 text-body text-text-secondary">
                        MedMentor uses Retrieval-Augmented Generation. Before generating any
                        patient response, the system performs semantic search over a structured
                        clinical knowledge base. The AI verbalizes only what the retrieved
                        evidence supports.
                    </p>
                    <p class="mt-3 text-body text-text-secondary">
                        This makes the simulation reliable for medical education: what the
                        patient says is what the case data supports, every time.
                    </p>
                </div>
                <div class="flex flex-col gap-3">
                    <VCard variant="outlined">
                        <div class="flex flex-col gap-1">
                            <p class="text-body-sm font-semibold text-text-primary">Structured Knowledge Base</p>
                            <p class="text-body-sm text-text-secondary">
                                Clinical case data stored and indexed for semantic retrieval.
                            </p>
                        </div>
                    </VCard>
                    <VCard variant="outlined">
                        <div class="flex flex-col gap-1">
                            <p class="text-body-sm font-semibold text-text-primary">Retrieval Before Generation</p>
                            <p class="text-body-sm text-text-secondary">
                                Patient responses are generated only after relevant facts are retrieved.
                            </p>
                        </div>
                    </VCard>
                    <VCard variant="outlined">
                        <div class="flex flex-col gap-1">
                            <p class="text-body-sm font-semibold text-text-primary">Traceable Outputs</p>
                            <p class="text-body-sm text-text-secondary">
                                Every claim in the dialogue is backed by a verifiable clinical source.
                            </p>
                        </div>
                    </VCard>
                </div>
            </div>
        </section>

        <!-- Benefits -->
        <section class="bg-surface-sunken px-4 py-16">
            <div class="mx-auto max-w-384">
                <h2 class="text-center text-h1 font-semibold text-text-primary">
                    Built for Medical Education
                </h2>
                <div class="mt-10 grid gap-6 md:grid-cols-2">
                    <VCard variant="default">
                        <div class="flex flex-col gap-2">
                            <h3 class="text-h2 font-semibold text-text-primary">For Medical Students</h3>
                            <p class="text-body-sm text-text-secondary">
                                Build history-taking and reasoning skills before clinical rotations.
                                Practice with diverse cases across specialties at your own pace,
                                with immediate objective feedback on every session.
                            </p>
                        </div>
                    </VCard>
                    <VCard variant="default">
                        <div class="flex flex-col gap-2">
                            <h3 class="text-h2 font-semibold text-text-primary">For CME Programs</h3>
                            <p class="text-body-sm text-text-secondary">
                                Offer flexible, self-paced simulation exercises for continuing
                                medical education. Track performance metrics across sessions and
                                demonstrate competency through scored diagnostic outcomes.
                            </p>
                        </div>
                    </VCard>
                </div>
            </div>
        </section>

        <!-- Bottom CTA -->
        <section class="bg-surface-base px-4 py-20 text-center">
            <div class="mx-auto max-w-[56rem]">
                <h2 class="text-h1 font-semibold text-text-primary">Ready to Start Training?</h2>
                <p class="mt-3 text-body text-text-secondary">
                    Access the case library and begin your first simulation session in minutes.
                </p>
                <div class="mt-8">
                    <VButton
                        size="lg"
                        @click="handlePrimaryCta"
                    >
                        {{ authGate.isAuthenticated ? 'Browse Cases' : 'Sign In to Start' }}
                    </VButton>
                </div>
            </div>
        </section>
    </div>
</template>

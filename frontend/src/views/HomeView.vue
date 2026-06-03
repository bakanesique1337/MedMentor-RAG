<script setup lang="ts">
import {useRouter} from 'vue-router'

import LandingFaq from '@/components/landing/LandingFaq.vue'
import LandingFeatures from '@/components/landing/LandingFeatures.vue'
import LandingHero from '@/components/landing/LandingHero.vue'
import LandingHowItWorks from '@/components/landing/LandingHowItWorks.vue'
import LandingStats from '@/components/landing/LandingStats.vue'
import {ROUTES} from '@/constants/routes'
import {useAuthGateStore} from '@/stores/authGate'

const router = useRouter()
const authGate = useAuthGateStore()

/**
 * Primary CTA handler. Authenticated users go to cases; guests open the auth modal.
 */
function handleCta(): void {
    if (authGate.isAuthenticated) {
        router.push({name: ROUTES.CASES}).catch(() => undefined)
        return
    }
    authGate.openAuthModal()
}
</script>

<template>
    <div>
        <LandingHero
            :is-authenticated="authGate.isAuthenticated"
            @cta="handleCta"
        />

        <LandingStats/>

        <LandingFeatures/>

        <LandingHowItWorks/>

        <LandingFaq/>
    </div>
</template>

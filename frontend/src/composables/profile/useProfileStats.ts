import {computed, type Ref} from 'vue'

import type {CaseCard, HistorySession, SimulationStatsOverview} from '@/types'
import {
    compute30DayActivity,
    computeAccuracyBuckets,
    computePracticeMinutes,
    computeSpecialtyBreakdown,
    computeStreak,
    totalCasesCount,
} from '@/utils/profileAggregations'

const STREAK_GOAL = 14
const SPARKLINE_WINDOW = 14

interface Params {
    historyList: Ref<HistorySession[]>
    casesList: Ref<CaseCard[]>
    stats: Ref<SimulationStatsOverview | null>
}

/**
 * Computes profile dashboard aggregations from the raw history/cases/stats refs.
 */
export function useProfileStats({historyList, casesList, stats}: Params) {
    const categoryTotals = computed<Map<string, number>>(() => {
        const map = new Map<string, number>()
        casesList.value.forEach((c) => {
            map.set(c.category, (map.get(c.category) ?? 0) + 1)
        })
        return map
    })

    const totalCases = computed<number>(() => totalCasesCount(categoryTotals.value))

    const completedCount = computed<number>(() => stats.value?.completedSessions ?? 0)

    const completedChip = computed<string>(() => {
        if (totalCases.value === 0) return ''
        return `${Math.round((completedCount.value / totalCases.value) * 100)}%`
    })

    const averageScore = computed<number>(() => {
        const fromStats = stats.value?.averageTotalScore
        if (typeof fromStats === 'number') return Math.round(fromStats * 100)
        return 0
    })

    const streak = computed<number>(() => computeStreak(historyList.value))

    const streakChip = computed<string>(() => `${streak.value}/${STREAK_GOAL}`)

    const practiceMinutes = computed<number>(() => computePracticeMinutes(historyList.value))

    const practiceHours = computed<number>(() => Math.round(practiceMinutes.value / 60))

    const activity30d = computed(() => compute30DayActivity(historyList.value))

    const streakSparkline = computed<number[]>(() =>
        activity30d.value.slice(-SPARKLINE_WINDOW).map((day) => (day.minutes > 0 ? 1 : 0)),
    )

    const practiceSparkline = computed<number[]>(() =>
        activity30d.value.slice(-SPARKLINE_WINDOW).map((day) => day.minutes),
    )

    const accuracyBuckets = computed(() => computeAccuracyBuckets(historyList.value))

    const specialtyRows = computed(() => computeSpecialtyBreakdown(historyList.value, categoryTotals.value))

    return {
        totalCases,
        completedCount,
        completedChip,
        averageScore,
        streak,
        streakChip,
        practiceHours,
        activity30d,
        streakSparkline,
        practiceSparkline,
        accuracyBuckets,
        specialtyRows,
    }
}
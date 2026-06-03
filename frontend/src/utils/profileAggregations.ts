import { categoryDisplayLabel, categoryPalette } from '@/constants/caseCategories'
import type { HistorySession } from '@/types'

const ACTIVITY_DAYS = 30

const ACCURACY_CORRECT_THRESHOLD = 0.85
const ACCURACY_PARTIAL_THRESHOLD = 0.5

/**
 * Cap on minutes counted per session toward practice/activity totals.
 * Without per-message timestamps we cannot tell idle time apart from active
 * engagement, so a generous-but-finite cap prevents abandoned-but-not-yet-
 * marked-abandoned sessions from inflating totals.
 */
const SESSION_MINUTES_CAP = 60

export interface AccuracyBuckets {
    correct: number;
    partial: number;
    wrong: number;
    total: number;
}

export interface SpecialtyRow {
    key: string;
    label: string;
    done: number;
    total: number;
    score: number;
    paletteFrom: string;
    paletteTo: string;
}

export interface DayActivity {
    date: Date;
    minutes: number;
}

/**
 * Returns the start-of-day timestamp (local time) for the given date.
 */
function dayStart(date: Date): number {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
}

/**
 * Sessions that progressed all the way through diagnosis selection and
 * scoring. Anything else (browsing, abandoned, in-progress) is excluded
 * from progress, time, and streak metrics.
 */
function isCompleted(session: HistorySession): boolean {
    return session.state === 'COMPLETED'
}

/**
 * Returns minutes spent on a single completed session, capped to avoid
 * counting idle time from sessions that were left open between visits.
 */
function sessionMinutes(session: HistorySession): number {
    const start = new Date(session.createdAt).getTime()
    const end = new Date(session.updatedAt).getTime()
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0
    const raw = Math.round((end - start) / 60000)
    return Math.min(raw, SESSION_MINUTES_CAP)
}

/**
 * Counts consecutive days ending today (or yesterday) that contain at least
 * one completed session.
 */
export function computeStreak(history: HistorySession[]): number {
    const completed = history.filter(isCompleted)
    if (completed.length === 0) return 0

    const days = new Set<number>()
    completed.forEach((s) => {
        days.add(dayStart(new Date(s.createdAt)))
    })

    const oneDay = 86_400_000
    const today = dayStart(new Date())
    let cursor = today
    let streak = 0

    if (!days.has(today)) {
        cursor = today - oneDay
        if (!days.has(cursor)) return 0
    }

    while (days.has(cursor)) {
        streak += 1
        cursor -= oneDay
    }

    return streak
}

/**
 * Total practice minutes across all completed sessions.
 */
export function computePracticeMinutes(history: HistorySession[]): number {
    return history.filter(isCompleted).reduce((sum, s) => sum + sessionMinutes(s), 0)
}

/**
 * Builds a 30-day activity series ending today (local time).
 * Each bucket is total practice minutes for that day.
 */
export function compute30DayActivity(history: HistorySession[]): DayActivity[] {
    const buckets: DayActivity[] = []
    const today = dayStart(new Date())
    const oneDay = 86_400_000

    for (let i = ACTIVITY_DAYS - 1; i >= 0; i -= 1) {
        const ts = today - i * oneDay
        buckets.push({ date: new Date(ts), minutes: 0 })
    }

    history.filter(isCompleted).forEach((s) => {
        const sessionDay = dayStart(new Date(s.createdAt))
        const offsetDays = Math.round((today - sessionDay) / oneDay)
        if (offsetDays < 0 || offsetDays >= ACTIVITY_DAYS) return
        const idx = ACTIVITY_DAYS - 1 - offsetDays
        const bucket = buckets[idx]
        if (bucket) bucket.minutes += sessionMinutes(s)
    })

    return buckets
}

/**
 * Buckets completed sessions into correct / partial / wrong by score.diagnosisCorrect.
 */
export function computeAccuracyBuckets(history: HistorySession[]): AccuracyBuckets {
    let correct = 0
    let partial = 0
    let wrong = 0

    history.forEach((s) => {
        const value = s.score?.diagnosisCorrect
        if (value === null || value === undefined) return
        if (value >= ACCURACY_CORRECT_THRESHOLD) correct += 1
        else if (value >= ACCURACY_PARTIAL_THRESHOLD) partial += 1
        else wrong += 1
    })

    return { correct, partial, wrong, total: correct + partial + wrong }
}

/**
 * Aggregates per-specialty completion counts and average totalScore (0-100).
 * Counts only completed sessions; `categoryTotals` provides the denominator
 * for each category (typically the catalog count per specialty).
 */
export function computeSpecialtyBreakdown(
    history: HistorySession[],
    categoryTotals: Map<string, number>,
): SpecialtyRow[] {
    interface Bucket {
        done: number;
        scoreSum: number;
        scoreCount: number;
    }

    const buckets = new Map<string, Bucket>()

    history.filter(isCompleted).forEach((s) => {
        const key = s.caseCategory
        if (!key) return
        const existing = buckets.get(key) ?? { done: 0, scoreSum: 0, scoreCount: 0 }
        existing.done += 1
        if (s.score !== null && s.score.totalScore !== null) {
            existing.scoreSum += s.score.totalScore
            existing.scoreCount += 1
        }
        buckets.set(key, existing)
    })

    // Include every category with cases available, even if user has 0 done.
    categoryTotals.forEach((_total, key) => {
        if (!buckets.has(key)) buckets.set(key, { done: 0, scoreSum: 0, scoreCount: 0 })
    })

    const rows: SpecialtyRow[] = []
    buckets.forEach((bucket, key) => {
        const palette = categoryPalette(key)
        const score = bucket.scoreCount > 0
            ? Math.round((bucket.scoreSum / bucket.scoreCount) * 100)
            : 0
        rows.push({
            key,
            label: categoryDisplayLabel(key),
            done: bucket.done,
            total: categoryTotals.get(key) ?? Math.max(bucket.done, 1),
            score,
            paletteFrom: palette.from,
            paletteTo: palette.to,
        })
    })

    rows.sort((a, b) => b.done - a.done || a.label.localeCompare(b.label, 'ru'))
    return rows
}

/**
 * Total cases across all categories, used as the denominator for the
 * "completed" stat card.
 */
export function totalCasesCount(categoryTotals: Map<string, number>): number {
    let total = 0
    categoryTotals.forEach((value) => { total += value })
    return total
}

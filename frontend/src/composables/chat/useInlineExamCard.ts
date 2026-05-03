import type {SimulationSession} from '@/types'
import type {UseInlineExamCardReturn} from './types'
import {computed, ref, watch, type Ref} from 'vue'


/**
 * Управляет видимостью карточки осмотра в ленте чата.
 *
 * Правило: карточка показывается ровно на том ходу, на котором осмотр
 * был раскрыт впервые в текущем сеансе работы со страницей. Как только в ленту
 * приходит следующее сообщение, карточка прячется — данные осмотра продолжают
 * быть постоянно доступны в боковой панели.
 *
 * Реализация:
 *  - inlineExamRevealedAt запоминает messageOrder того хода, на котором examRevealed
 *    впервые перешёл false -> true (отслеживается watch'ем);
 *  - showInlineExamCard истинно, пока currentMaxMessageOrder === inlineExamRevealedAt.
 *
 * Различение "впервые в этом сеансе" и "уже было раскрыто до загрузки страницы"
 * важно: если examRevealed пришёл уже true с бэкенда, якорь не выставляется,
 * чтобы карточка не мигала поверх произвольного хода в середине диалога.
 */
export function useInlineExamCard(
    session: Ref<SimulationSession | null>,
): UseInlineExamCardReturn {
    const inlineExamRevealedAt = ref<number | null>(null)

    function currentMaxMessageOrder(): number {
        if (session.value === null) return 0
        return session.value.messages.reduce(
            (max, msg) => (msg.messageOrder > max ? msg.messageOrder : max),
            0,
        )
    }

    const showInlineExamCard = computed<boolean>(() => {
        if (session.value === null || !session.value.examRevealed) return false
        if (inlineExamRevealedAt.value === null) return false
        return currentMaxMessageOrder() === inlineExamRevealedAt.value
    })

    watch(
        () => session.value?.examRevealed ?? null,
        (newVal, oldVal) => {
            if (oldVal === false && newVal === true) {
                inlineExamRevealedAt.value = currentMaxMessageOrder()
            }
        },
    )

    return {showInlineExamCard}
}

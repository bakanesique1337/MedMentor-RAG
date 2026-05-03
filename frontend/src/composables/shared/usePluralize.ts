import {computed, toValue, type ComputedRef, type MaybeRefOrGetter} from 'vue'
import type {PluralForms} from './types'

/**
 * Возвращает корректную русскую форму множественного числа для заданного числа.
 *
 * Порядок форм: [для 1, для 2..4, для 0/5..20].
 * Пример: usePluralize(count, ['задача', 'задачи', 'задач']).
 *
 * @param count — число (ref, getter или примитив), для которого подбирается форма.
 * @param forms — кортеж из трёх форм слова в порядке [для 1, для 2..4, для 0/5..20].
 * @returns computed-реф со строкой выбранной формы, реактивно реагирующий
 *          на изменения count и forms.
 */
export function usePluralize(
    count: MaybeRefOrGetter<number>,
    forms: MaybeRefOrGetter<PluralForms>,
): ComputedRef<string> {
    return computed(() => {
        const n = Math.abs(Math.trunc(toValue(count)))
        const resolvedForms = toValue(forms)
        const mod10 = n % 10
        const mod100 = n % 100

        if (mod10 === 1 && mod100 !== 11) return resolvedForms[0]
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return resolvedForms[1]
        return resolvedForms[2]
    })
}

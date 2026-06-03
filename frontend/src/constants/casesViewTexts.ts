/**
 * @file Статические тексты для страницы каталога клинических задач.
 */

/**
 * Тексты hero-секции каталога.
 */
export const CASES_HERO_TEXTS = {
    catalogPrefix: 'Каталог',
    titleLead: 'Клинические',
    titleAccent: 'задачи',
    description: 'Симулируемые пациенты по ключевым специализациям. Выберите категорию и уровень сложности, чтобы потренировать сбор анамнеза, дифференциальную диагностику и коммуникацию.',
} as const

/**
 * Формы множественного числа для счётчиков (1, 2-4, 5+).
 */
export const CASES_HERO_PLURAL_FORMS = {
    cases: ['задача', 'задачи', 'задач'],
    specializations: ['специализация', 'специализации', 'специализаций'],
} as const

/**
 * Тексты блока фильтров.
 */
export const CASES_FILTERS_TEXTS = {
    allChip: 'Все',
    foundLabel: 'Найдено',
    foundOf: 'из',
    resetFiltersButton: 'Сбросить фильтры',
} as const

/**
 * Тексты ошибок на странице каталога
 */
export const CASES_ALERTS_TEXTS = {
    conflictTitle: 'Конфликт сессии',
    conflictMessage: 'У вас уже есть активная симуляция. Продолжите её из баннера выше.',
    loadErrorTitle: 'Ошибка загрузки',
    loadCasesError: 'Не удалось загрузить список задач. Попробуйте обновить страницу.',
    startCaseError: 'Не удалось начать задачу. Попробуйте снова.',
} as const

/**
 * Тексты пустых состояний.
 */
export const CASES_EMPTY_STATE_TEXTS = {
    filteredTitle: 'Ничего не нашлось',
    filteredDescription: 'Попробуйте сбросить фильтры или изменить запрос.',
    allTitle: 'Пока нет задач',
    allDescription: 'Загляните позже — библиотека постоянно пополняется.',
} as const

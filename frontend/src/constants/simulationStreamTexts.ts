/**
 * Тексты ошибок и предупреждений для composable useSimulationStream.
 */
export const SIMULATION_STREAM_MESSAGES = {
    openingStreamFailed: 'Открывающий стрим не удалось получить. Перезагружаем сессию…',
    findingStreamFailed: 'Результат осмотра не удалось получить. Перезагружаем…',
    messageStreamFailed: 'Ответ пациента не удалось получить. Перезагружаем…',
    systemStreamFailed: 'Данные исследований не удалось получить. Перезагружаем…',
    socketConnectionLost: 'Соединение потеряно. Попробуйте снова или перезагрузите страницу.',
} as const

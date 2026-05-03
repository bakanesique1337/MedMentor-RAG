/**
 * Тексты сообщений и ошибок для composable useChatActions.
 */
export const CHAT_ACTIONS_MESSAGES = {
    patientStillReplying: 'Пациент ещё отвечает. Подождите, пока ответ завершится.',
    sendMessageError: 'Не удалось отправить сообщение. Попробуйте снова.',
    diagnosisStageConflict: 'Диагноз нельзя отправить на этом этапе. Перезагружаем состояние…',
    diagnosisError: 'Не удалось отправить диагноз. Попробуйте снова.',
    abandonErrorPrefix: 'Не удалось завершить задачу',
    abandonNetworkError: 'Не удалось завершить задачу. Сервер недоступен.',
    examError: 'Не удалось получить данные осмотра. Попробуйте снова.',
} as const

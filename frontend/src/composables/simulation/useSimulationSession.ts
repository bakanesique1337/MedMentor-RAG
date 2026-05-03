import type {
    UseSimulationSessionParams,
    UseSimulationSessionReturn,
} from './types'

import {SIMULATION_STATE, type SimulationSession} from '@/types'
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {useSimulationApi} from '@/composables/api/useSimulationApi'
import {ROUTES} from '@/constants/routes'
import {SIMULATION_SESSION_MESSAGES} from '@/constants/simulationSessionTexts'


/**
 * Загрузка и кэширование состояния симуляционной сессии.
 *
 *  - fetchSession — "холодная" загрузка с показом спиннера, переходом на страницу
 *                     результата для терминальных состояний (COMPLETED/ABANDONED)
 *                     и подключением WebSocket-канала. Используется при первичном
 *                     заходе на страницу и при повторах вступительной реплики.
 *  - reloadSession — "тихий" GET без спиннера и редиректа: только обновляет session.
 *                     Применяется после завершения стрима, чтобы UI не ломался
 *                     из-за выставления isLoading=true.
 *
 * Намеренное совмещение трёх эффектов в fetchSession (загрузка + редирект + connect)
 * оправдано тем, что эти шаги всегда идут вместе: пользователь, открывающий /chat/:id,
 * либо хочет увидеть сессию (тогда нужен сокет), либо должен быть переадресован.
 *
 * Socket передаётся параметром, чтобы один и тот же
 * экземпляр использовался streaming composable и не возникало двух соединений.
 *
 * @param params — объект с реактивным sessionId и общим экземпляром SimulationSocket,
 *                 который переиспользуется streaming composable, чтобы не создавать
 *                 два WebSocket-соединения для одной страницы.
 * @returns объект UseSimulationSessionReturn с реактивным состоянием
 *          (session, isLoading, pageError) и двумя методами загрузки:
 *          fetchSession (холодная) и reloadSession (тихая).
 */
export function useSimulationSession(
    params: UseSimulationSessionParams,
): UseSimulationSessionReturn {
    const {sessionId, socket} = params
    const router = useRouter()
    const api = useSimulationApi()

    const session = ref<SimulationSession | null>(null)
    const isLoading = ref(true)
    const pageError = ref<string | null>(null)

    /**
     * Полная загрузка сессии: показывает спиннер, переадресует на /result
     * для терминальных состояний (COMPLETED/ABANDONED) и поднимает WebSocket.
     * При ошибке выставляет pageError и не бросает исключение наружу.
     *
     * @param options — необязательные опции запроса:
     *   - retryOpening: попросить сервер заново сгенерировать вступительную
     *     реплику (используется кнопкой "Повторить" при сорванном опенинге).
     * @returns промис, разрешающийся после загрузки сессии и (при необходимости)
     *          редиректа или подключения сокета.
     */
    async function fetchSession(
        options?: { retryOpening?: boolean },
    ): Promise<void> {
        isLoading.value = true
        pageError.value = null

        try {
            const data = await api.getSession(sessionId.value, options)
            session.value = data

            if (data.state === SIMULATION_STATE.COMPLETED || data.state === SIMULATION_STATE.ABANDONED) {
                await router.replace({
                    name: ROUTES.RESULT,
                    params: {sessionId: String(sessionId.value)},
                }).catch(() => undefined)
                return
            }

            socket.connect(sessionId.value)
        } catch {
            pageError.value = SIMULATION_SESSION_MESSAGES.sessionLoadFailed
        } finally {
            isLoading.value = false
        }
    }

    /**
     * "Тихий" GET сессии: только обновляет session без спиннера и редиректа.
     * Применяется после завершения стрима, чтобы переключение isLoading
     * не сбрасывало уже отрисованные сообщения.
     *
     * @returns промис, разрешающийся после обновления session или установки pageError
     *          при ошибке сети/сервера.
     */
    async function reloadSession(): Promise<void> {
        try {
            session.value = await api.getSession(sessionId.value)
        } catch {
            pageError.value = SIMULATION_SESSION_MESSAGES.sessionReloadFailed
        }
    }

    return {session, isLoading, pageError, fetchSession, reloadSession}
}

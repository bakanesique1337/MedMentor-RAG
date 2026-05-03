import type {UseChatModalsReturn} from './types'
import {ref} from 'vue'

/**
 * Хранит состояние двух модальных окон чата: подтверждение завершения задачи
 * и подтверждение диагноза. Вынесено в отдельный composable, чтобы:
 *  - не "размывать" контроллер страницы тривиальными boolean-флагами;
 *  - дать действиям из useChatActions возможность закрывать модальное окно
 *    через явные callback'и, не зная про их внутреннее состояние.
 */
export function useChatModals(): UseChatModalsReturn {
    const isFinishModalOpen = ref(false)
    const isDiagnosisModalOpen = ref(false)

    function openFinishModal(): void {
        isFinishModalOpen.value = true
    }

    function openDiagnosisModal(): void {
        isDiagnosisModalOpen.value = true
    }

    function closeFinishModal(): void {
        isFinishModalOpen.value = false
    }

    function closeDiagnosisModal(): void {
        isDiagnosisModalOpen.value = false
    }

    return {
        isFinishModalOpen,
        isDiagnosisModalOpen,
        openFinishModal,
        openDiagnosisModal,
        closeFinishModal,
        closeDiagnosisModal,
    }
}

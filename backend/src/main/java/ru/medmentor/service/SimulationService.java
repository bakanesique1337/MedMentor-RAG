package ru.medmentor.service;

import ru.medmentor.dto.ActiveSimulationDto;
import ru.medmentor.dto.CaseCardDto;
import ru.medmentor.dto.HistorySessionDto;
import ru.medmentor.dto.SimulationCommandResponseDto;
import ru.medmentor.dto.SimulationSessionDto;
import ru.medmentor.dto.SimulationStatsOverviewDto;

import java.util.List;
import java.util.Optional;

public interface SimulationService {

    List<CaseCardDto> getCaseCards(String category);

    SimulationCommandResponseDto startSession(String username, String caseId);

    SimulationSessionDto getSession(String username, Long sessionId, boolean retryOpening);

    Optional<ActiveSimulationDto> getActiveSession(String username);

    SimulationCommandResponseDto sendMessage(String username, Long sessionId, String content);

    SimulationCommandResponseDto abandonSession(String username, Long sessionId);

    /**
     * Раскрывает осмотр в сессии и идемпотентно вставляет SYSTEM-карточку
     * с витальными показателями и паспортом в ленту. Если передана непустая
     * {@code doctorMessage} — сначала персистится как DOCTOR-сообщение перед
     * карточкой; это нужно для quick-prompt из чата. Если {@code null} или
     * пустая — карточка вставляется без сопроводительной реплики (вариант для
     * боковой кнопки «Провести осмотр»). Никакого стрима ответа пациента
     * этот вызов не запускает.
     */
    SimulationSessionDto revealExam(String username, Long sessionId, String doctorMessage);

    SimulationSessionDto submitDiagnosis(
            String username,
            Long sessionId,
            String diagnosis,
            String rationale,
            Integer confidence
    );

    List<HistorySessionDto> getHistory(String username);

    SimulationStatsOverviewDto getStatsOverview(String username);
}

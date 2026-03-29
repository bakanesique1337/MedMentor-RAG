package ru.medmentor.service;

import ru.medmentor.dto.ActiveSimulationDto;
import ru.medmentor.dto.CaseCardDto;
import ru.medmentor.dto.HistorySessionDto;
import ru.medmentor.dto.ResultDto;
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

    SimulationSessionDto finishExamination(String username, Long sessionId);

    SimulationSessionDto submitDiagnosis(String username, Long sessionId, String diagnosis);

    ResultDto scoreSession(String username, Long sessionId);

    List<HistorySessionDto> getHistory(String username);

    SimulationStatsOverviewDto getStatsOverview(String username);
}

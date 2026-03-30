package ru.medmentor.dto;

import java.math.BigDecimal;

public record SimulationStatsOverviewDto(
        long completedSessions,
        BigDecimal averagePoliteness,
        BigDecimal averageQuestioningStructure,
        BigDecimal averageThoroughness,
        BigDecimal averageEmpathy,
        BigDecimal averageDiagnosisCorrect
) {
}

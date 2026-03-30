package ru.medmentor.dto;

public record SimulationStatsOverviewDto(
        long completedSessions,
        Double averagePoliteness,
        Double averageQuestioningStructure,
        Double averageThoroughness,
        Double averageEmpathy,
        Double averageDiagnosisCorrect
) {
}

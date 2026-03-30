package ru.medmentor.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ScoreDto(
        BigDecimal politeness,
        BigDecimal questioningStructure,
        BigDecimal thoroughness,
        BigDecimal empathy,
        BigDecimal diagnosisCorrect,
        LocalDateTime createdAt
) {
}

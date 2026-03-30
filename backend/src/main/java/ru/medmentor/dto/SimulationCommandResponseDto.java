package ru.medmentor.dto;

public record SimulationCommandResponseDto(
        Long sessionId,
        String status
) {
}

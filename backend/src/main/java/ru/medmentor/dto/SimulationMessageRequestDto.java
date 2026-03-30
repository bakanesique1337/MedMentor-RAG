package ru.medmentor.dto;

import jakarta.validation.constraints.NotBlank;

public record SimulationMessageRequestDto(
        @NotBlank(message = "Message content is required")
        String content
) {
}

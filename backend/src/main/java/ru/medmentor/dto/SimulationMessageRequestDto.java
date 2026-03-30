package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record SimulationMessageRequestDto(
        @Schema(example = "When did your symptoms start?")
        @NotBlank(message = "Message content is required")
        String content
) {
}

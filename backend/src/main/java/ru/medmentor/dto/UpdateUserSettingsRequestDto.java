package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public record UpdateUserSettingsRequestDto(
        @NotBlank(message = "Display name is required")
        String displayName,
        @Schema(example = "{\"theme\":\"light\"}")
        Map<String, Object> settings
) {
}

package ru.medmentor.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public record UpdateUserSettingsRequestDto(
        @NotBlank(message = "Display name is required")
        String displayName,
        Map<String, Object> settings
) {
}

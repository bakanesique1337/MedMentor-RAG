package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Map;

public record UserSettingsDto(
        String username,
        String displayName,
        @Schema(example = "{\"theme\":\"light\"}")
        Map<String, Object> settings
) {
}

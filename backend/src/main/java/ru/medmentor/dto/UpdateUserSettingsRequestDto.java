package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public record UpdateUserSettingsRequestDto(
        @NotBlank(message = "Display name is required")
        String displayName,
        String firstName,
        String lastName,
        String email,
        String role,
        String course,
        String faculty,
        String university,
        String avatarVariant,
        @Schema(example = "{\"theme\":\"light\"}")
        Map<String, Object> settings
) {
}

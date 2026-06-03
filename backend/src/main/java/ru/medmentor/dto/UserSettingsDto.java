package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Map;

public record UserSettingsDto(
        String username,
        String displayName,
        String firstName,
        String lastName,
        String email,
        @Schema(example = "Студент", description = "One of: Студент, Ординатор, Врач, Преподаватель")
        String role,
        @Schema(example = "5 курс")
        String course,
        @Schema(example = "Лечебный факультет")
        String faculty,
        @Schema(example = "РНИМУ им. Н.И. Пирогова")
        String university,
        @Schema(example = "teal", description = "One of: teal, sand, rose, violet, mint, sky")
        String avatarVariant,
        @Schema(example = "{\"theme\":\"light\"}", description = "Misc preferences map (excludes typed profile keys)")
        Map<String, Object> settings
) {
}

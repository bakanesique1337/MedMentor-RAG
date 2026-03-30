package ru.medmentor.dto;

import java.util.Map;

public record UserSettingsDto(
        String username,
        String displayName,
        Map<String, Object> settings
) {
}

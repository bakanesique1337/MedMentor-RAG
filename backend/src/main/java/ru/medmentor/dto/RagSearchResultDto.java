package ru.medmentor.dto;

import java.util.Map;

public record RagSearchResultDto(
        String id,
        String content,
        Double score,
        Map<String, Object> metadata
) {
}

package ru.medmentor.dto;

import java.util.List;

public record RagSearchResponseDto(
        String query,
        int topK,
        List<RagSearchResultDto> results
) {
}

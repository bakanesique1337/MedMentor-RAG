package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Map;

public record RagSearchResultDto(
        String id,
        String content,
        Double score,
        @Schema(example = "{\"sourcePath\":\"guidelines/heart-failure.md\",\"chunkIndex\":0,\"chunkCount\":4}")
        Map<String, Object> metadata
) {
}

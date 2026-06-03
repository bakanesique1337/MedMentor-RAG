package ru.medmentor.dto;

import java.time.LocalDateTime;

public record RagSyncResponseDto(
        String trigger,
        int indexedFiles,
        int updatedFiles,
        int removedFiles,
        int skippedFiles,
        int totalIndexedChunks,
        LocalDateTime completedAt
) {
}

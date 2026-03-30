package ru.medmentor.service;

import java.time.LocalDateTime;

public record RagSyncReport(
        String trigger,
        int indexedFiles,
        int updatedFiles,
        int removedFiles,
        int skippedFiles,
        int totalIndexedChunks,
        LocalDateTime completedAt
) {
}

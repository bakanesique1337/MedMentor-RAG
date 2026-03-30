package ru.medmentor.controller;

import org.springframework.ai.document.Document;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.medmentor.dto.RagSearchResponseDto;
import ru.medmentor.dto.RagSearchResultDto;
import ru.medmentor.dto.RagSyncResponseDto;
import ru.medmentor.service.RagIngestionService;
import ru.medmentor.service.RagSearchService;
import ru.medmentor.service.RagSyncReport;

import java.util.List;

@RestController
@RequestMapping("/api/rag")
public class RagController {

    private final RagIngestionService ragIngestionService;
    private final RagSearchService ragSearchService;

    public RagController(RagIngestionService ragIngestionService, RagSearchService ragSearchService) {
        this.ragIngestionService = ragIngestionService;
        this.ragSearchService = ragSearchService;
    }

    @GetMapping("/search")
    public RagSearchResponseDto search(
            @RequestParam String query,
            @RequestParam(required = false) Integer topK
    ) {
        final List<Document> documents = ragSearchService.search(query, topK);
        final List<RagSearchResultDto> results = documents.stream()
                .map(document -> new RagSearchResultDto(
                        document.getId(),
                        document.getText(),
                        document.getScore(),
                        document.getMetadata()
                ))
                .toList();
        return new RagSearchResponseDto(query, topK == null ? results.size() : topK, results);
    }

    @PostMapping("/sync")
    public RagSyncResponseDto sync() {
        final RagSyncReport report = ragIngestionService.syncNow("manual");
        return new RagSyncResponseDto(
                report.trigger(),
                report.indexedFiles(),
                report.updatedFiles(),
                report.removedFiles(),
                report.skippedFiles(),
                report.totalIndexedChunks(),
                report.completedAt()
        );
    }
}

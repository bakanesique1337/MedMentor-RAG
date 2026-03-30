package ru.medmentor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.event.EventListener;
import ru.medmentor.config.RagProperties;
import ru.medmentor.model.RagSourceFile;
import ru.medmentor.repository.RagSourceFileRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class RagIngestionService {

    private static final Logger log = LoggerFactory.getLogger(RagIngestionService.class);

    private final RagChunkingService ragChunkingService;
    private final RagProperties ragProperties;
    private final RagSourceFileRepository ragSourceFileRepository;
    private final RagSourceParserService ragSourceParserService;
    private final VectorStore vectorStore;

    private final AtomicBoolean syncInProgress = new AtomicBoolean(false);

    public RagIngestionService(
            RagChunkingService ragChunkingService,
            RagProperties ragProperties,
            RagSourceFileRepository ragSourceFileRepository,
            RagSourceParserService ragSourceParserService,
            VectorStore vectorStore
    ) {
        this.ragChunkingService = ragChunkingService;
        this.ragProperties = ragProperties;
        this.ragSourceFileRepository = ragSourceFileRepository;
        this.ragSourceParserService = ragSourceParserService;
        this.vectorStore = vectorStore;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void startupSync() {
        if (!ragProperties.isEnabled()) {
            return;
        }
        try {
            syncNow("startup");
        } catch (Exception exception) {
            log.error("RAG startup sync failed", exception);
        }
    }

    @Scheduled(fixedDelayString = "${medmentor.rag.sync-interval-ms:30000}")
    public void scheduledSync() {
        if (!ragProperties.isEnabled()) {
            return;
        }
        syncNow("scheduled");
    }

    @Transactional
    public RagSyncReport syncNow(String trigger) {
        if (!ragProperties.isEnabled()) {
            return new RagSyncReport(trigger, 0, 0, 0, 0, 0, LocalDateTime.now());
        }
        if (!syncInProgress.compareAndSet(false, true)) {
            log.info("Skipping RAG sync; another sync is already in progress");
            return new RagSyncReport(trigger, 0, 0, 0, 0, 0, LocalDateTime.now());
        }

        try {
            return doSync(trigger);
        } finally {
            syncInProgress.set(false);
        }
    }

    private RagSyncReport doSync(String trigger) {
        final Path sourceRoot = Paths.get(ragProperties.getSourcePath()).toAbsolutePath().normalize();
        if (!Files.exists(sourceRoot) || !Files.isDirectory(sourceRoot)) {
            log.warn("RAG source path does not exist or is not a directory: {}", sourceRoot);
            return new RagSyncReport(trigger, 0, 0, 0, 0, 0, LocalDateTime.now());
        }

        final List<Path> sourceFiles = collectSourceFiles(sourceRoot);
        final Map<String, RagSourceFile> existingStateByPath = ragSourceFileRepository.findAll().stream()
                .collect(Collectors.toMap(RagSourceFile::getSourcePath, file -> file, (left, right) -> left, HashMap::new));
        final Set<String> discoveredPaths = new HashSet<>();

        int indexedFiles = 0;
        int updatedFiles = 0;
        int removedFiles = 0;
        int skippedFiles = 0;
        int totalIndexedChunks = 0;

        for (final Path sourceFile : sourceFiles) {
            final String relativePath = toRelativePath(sourceRoot, sourceFile);
            discoveredPaths.add(relativePath);

            final RagSourceFile existingState = existingStateByPath.get(relativePath);
            final long lastModifiedEpochMs = readLastModified(sourceFile);
            final String contentHash = computeContentHash(sourceFile);

            if (isUnchanged(existingState, contentHash, lastModifiedEpochMs)) {
                skippedFiles++;
                continue;
            }

            final String parsedContent = parseFileContent(sourceFile);
            final List<String> chunks = ragChunkingService.chunkText(
                    parsedContent,
                    ragProperties.getChunkSize(),
                    ragProperties.getChunkOverlap(),
                    ragProperties.getMinChunkSize()
            );
            if (chunks.isEmpty()) {
                if (existingState != null) {
                    deleteVectorChunks(existingState.getChunkIds());
                    ragSourceFileRepository.delete(existingState);
                    updatedFiles++;
                } else {
                    skippedFiles++;
                }
                continue;
            }

            if (existingState != null) {
                deleteVectorChunks(existingState.getChunkIds());
            }

            final List<Document> documents = new ArrayList<>(chunks.size());
            final List<String> chunkIds = new ArrayList<>(chunks.size());
            for (int index = 0; index < chunks.size(); index++) {
                final int chunkNumber = index + 1;
                final String chunkId = buildChunkId(relativePath, contentHash, chunkNumber);
                final Map<String, Object> metadata = new LinkedHashMap<>();
                metadata.put("sourcePath", relativePath);
                metadata.put("fileName", sourceFile.getFileName().toString());
                metadata.put("chunkIndex", chunkNumber);
                metadata.put("chunkCount", chunks.size());
                metadata.put("contentHash", contentHash);
                metadata.put("lastModifiedEpochMs", lastModifiedEpochMs);
                documents.add(new Document(chunkId, chunks.get(index), metadata));
                chunkIds.add(chunkId);
            }
            vectorStore.add(documents);
            totalIndexedChunks += documents.size();

            final RagSourceFile savedState = existingState == null ? new RagSourceFile() : existingState;
            savedState.setSourcePath(relativePath);
            savedState.setContentHash(contentHash);
            savedState.setLastModifiedEpochMs(lastModifiedEpochMs);
            savedState.setChunkCount(chunks.size());
            savedState.setChunkIds(String.join("\n", chunkIds));
            ragSourceFileRepository.save(savedState);

            if (existingState == null) {
                indexedFiles++;
            } else {
                updatedFiles++;
            }
        }

        for (final RagSourceFile existingState : existingStateByPath.values()) {
            if (discoveredPaths.contains(existingState.getSourcePath())) {
                continue;
            }
            deleteVectorChunks(existingState.getChunkIds());
            ragSourceFileRepository.delete(existingState);
            removedFiles++;
        }

        final RagSyncReport report = new RagSyncReport(
                trigger,
                indexedFiles,
                updatedFiles,
                removedFiles,
                skippedFiles,
                totalIndexedChunks,
                LocalDateTime.now()
        );
        log.info(
                "RAG sync completed trigger={} indexed={} updated={} removed={} skipped={} chunks={}",
                report.trigger(),
                report.indexedFiles(),
                report.updatedFiles(),
                report.removedFiles(),
                report.skippedFiles(),
                report.totalIndexedChunks()
        );
        return report;
    }

    private List<Path> collectSourceFiles(Path sourceRoot) {
        try (Stream<Path> stream = Files.walk(sourceRoot)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(this::isSupportedExtension)
                    .sorted(Comparator.comparing(Path::toString))
                    .toList();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to scan RAG source directory: " + sourceRoot, exception);
        }
    }

    private boolean isSupportedExtension(Path filePath) {
        final String fileName = filePath.getFileName().toString();
        final int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0) {
            return false;
        }
        final String extension = fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        return ragProperties.getIncludeExtensions().stream()
                .filter(Objects::nonNull)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .anyMatch(extension::equals);
    }

    private boolean isUnchanged(RagSourceFile existingState, String contentHash, long lastModifiedEpochMs) {
        return existingState != null
                && contentHash.equals(existingState.getContentHash())
                && lastModifiedEpochMs == existingState.getLastModifiedEpochMs();
    }

    private String parseFileContent(Path sourceFile) {
        try {
            return ragSourceParserService.parse(sourceFile);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to parse source file for RAG: " + sourceFile, exception);
        }
    }

    private long readLastModified(Path sourceFile) {
        try {
            return Files.getLastModifiedTime(sourceFile).toMillis();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read last-modified timestamp: " + sourceFile, exception);
        }
    }

    private String toRelativePath(Path sourceRoot, Path sourceFile) {
        return sourceRoot.relativize(sourceFile).toString().replace('\\', '/');
    }

    private String computeContentHash(Path sourceFile) {
        final byte[] bytes;
        try {
            bytes = Files.readAllBytes(sourceFile);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read source file for hashing: " + sourceFile, exception);
        }

        final MessageDigest messageDigest;
        try {
            messageDigest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available in this JVM", exception);
        }

        final byte[] digest = messageDigest.digest(bytes);
        final StringBuilder hashBuilder = new StringBuilder();
        for (final byte value : digest) {
            hashBuilder.append(String.format("%02x", value));
        }
        return hashBuilder.toString();
    }

    private String buildChunkId(String relativePath, String contentHash, int chunkNumber) {
        final String rawId = "%s|%s|%d".formatted(relativePath, contentHash, chunkNumber);
        return UUID.nameUUIDFromBytes(rawId.getBytes(StandardCharsets.UTF_8)).toString();
    }

    private void deleteVectorChunks(String chunkIdsText) {
        if (chunkIdsText == null || chunkIdsText.isBlank()) {
            return;
        }
        final List<String> chunkIds = Stream.of(chunkIdsText.split("\n"))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
        if (!chunkIds.isEmpty()) {
            vectorStore.delete(chunkIds);
        }
    }
}

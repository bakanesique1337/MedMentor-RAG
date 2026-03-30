package ru.medmentor.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import ru.medmentor.config.CaseProperties;
import ru.medmentor.model.MedicalCase;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

@Service
public class FileSystemCaseLoaderService implements CaseLoaderService {

    private static final String SCHEMA_FILE_NAME = "case.schema.json";

    private final ObjectMapper objectMapper;
    private final CaseProperties caseProperties;

    private Map<String, MedicalCase> casesById = Map.of();

    public FileSystemCaseLoaderService(ObjectMapper objectMapper, CaseProperties caseProperties) {
        this.objectMapper = objectMapper.copy()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, true);
        this.caseProperties = caseProperties;
    }

    @PostConstruct
    public void loadCases() {
        final Path rootPath = resolveCasesRoot();
        if (!Files.isDirectory(rootPath)) {
            throw new IllegalStateException("Cases directory not found: " + rootPath.toAbsolutePath());
        }

        try (Stream<Path> pathStream = Files.walk(rootPath)) {
            final List<Path> caseFiles = pathStream
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().endsWith(".json"))
                    .filter(path -> !SCHEMA_FILE_NAME.equals(path.getFileName().toString()))
                    .sorted(Comparator.naturalOrder())
                    .toList();

            final Map<String, MedicalCase> loadedCases = new LinkedHashMap<>();
            for (final Path caseFile : caseFiles) {
                final MedicalCase medicalCase = objectMapper.readValue(caseFile.toFile(), MedicalCase.class);
                validateCase(medicalCase, caseFile);
                final MedicalCase previous = loadedCases.putIfAbsent(medicalCase.id(), medicalCase);
                if (previous != null) {
                    throw new IllegalStateException("Duplicate case id '" + medicalCase.id() + "' in " + caseFile);
                }
            }
            casesById = Map.copyOf(loadedCases);
        } catch (IOException exception) {
            throw new UncheckedIOException("Failed to load case files from " + rootPath.toAbsolutePath(), exception);
        }
    }

    @Override
    public List<MedicalCase> getCases() {
        return casesById.values().stream().toList();
    }

    @Override
    public List<MedicalCase> getCasesByCategory(String category) {
        final String normalizedCategory = category == null ? "" : category.trim().toLowerCase(Locale.ROOT);
        if (normalizedCategory.isEmpty()) {
            return getCases();
        }
        return casesById.values().stream()
                .filter(medicalCase -> medicalCase.category().trim().toLowerCase(Locale.ROOT).equals(normalizedCategory))
                .toList();
    }

    @Override
    public MedicalCase getCaseById(String caseId) {
        final MedicalCase medicalCase = casesById.get(caseId);
        if (medicalCase == null) {
            throw new IllegalArgumentException("Unknown case id: " + caseId);
        }
        return medicalCase;
    }

    private Path resolveCasesRoot() {
        final Path configuredPath = Path.of(caseProperties.getPath());
        if (configuredPath.isAbsolute()) {
            return configuredPath.normalize();
        }

        final Path userDir = Path.of(System.getProperty("user.dir"));
        final List<Path> candidates = List.of(
                userDir.resolve(configuredPath),
                userDir.resolve("..").resolve(configuredPath),
                userDir.resolve("cases"),
                userDir.resolve("..").resolve("cases")
        );

        for (final Path candidate : candidates) {
            final Path normalized = candidate.normalize();
            if (Files.isDirectory(normalized)) {
                return normalized;
            }
        }

        return userDir.resolve(configuredPath).normalize();
    }

    private void validateCase(MedicalCase medicalCase, Path caseFile) {
        if (medicalCase.diagnosisOptions() == null || !medicalCase.diagnosisOptions().contains(medicalCase.correctDiagnosis())) {
            throw new IllegalStateException("Case file " + caseFile + " has correctDiagnosis outside diagnosisOptions");
        }
    }
}

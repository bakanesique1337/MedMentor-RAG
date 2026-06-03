package ru.medmentor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import ru.medmentor.config.CaseProperties;
import ru.medmentor.model.MedicalCase;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FileSystemCaseLoaderServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void loadCasesAndFilterByCategory() throws IOException {
        final Path casesRoot = tempDir.resolve("cases");
        Files.createDirectories(casesRoot.resolve("infections"));
        Files.createDirectories(casesRoot.resolve("cardiology"));

        Files.writeString(casesRoot.resolve("infections/infection-a.json"), """
                {
                  "id": "infection-a",
                  "version": 1,
                  "category": "Infections",
                  "title": "Case A",
                  "difficulty": "easy",
                  "tags": ["fever"],
                  "patientName": "A",
                  "patientAge": 20,
                  "patientSex": "female",
                  "patientBrief": "brief",
                  "openingComplaint": "complaint",
                  "authorNote": "note",
                  "facts": {
                    "symptoms": ["fever"],
                    "history": ["history"],
                    "negatives": ["none"]
                  },
                  "diagnosisOptions": ["Influenza", "Cold"],
                  "correctDiagnosis": "Influenza"
                }
                """);

        Files.writeString(casesRoot.resolve("cardiology/cardiology-a.json"), """
                {
                  "id": "cardiology-a",
                  "version": 1,
                  "category": "Cardiology",
                  "title": "Case B",
                  "difficulty": "medium",
                  "tags": ["chest pain"],
                  "patientName": "B",
                  "patientAge": 50,
                  "patientSex": "male",
                  "patientBrief": "brief",
                  "openingComplaint": "complaint",
                  "authorNote": "note",
                  "facts": {
                    "symptoms": ["pain"],
                    "history": ["history"],
                    "negatives": ["none"]
                  },
                  "diagnosisOptions": ["Stable angina", "GERD"],
                  "correctDiagnosis": "Stable angina"
                }
                """);

        final CaseProperties properties = new CaseProperties();
        properties.setPath(casesRoot.toString());
        final FileSystemCaseLoaderService service = new FileSystemCaseLoaderService(new ObjectMapper(), properties);

        service.loadCases();

        final List<MedicalCase> allCases = service.getCases();
        final List<MedicalCase> infections = service.getCasesByCategory("infections");

        assertEquals(2, allCases.size());
        assertEquals(1, infections.size());
        assertEquals("infection-a", service.getCaseById("infection-a").id());
    }

    @Test
    void loadCasesFailsWhenCorrectDiagnosisIsNotInOptions() throws IOException {
        final Path casesRoot = tempDir.resolve("cases");
        Files.createDirectories(casesRoot.resolve("infections"));

        Files.writeString(casesRoot.resolve("infections/bad-case.json"), """
                {
                  "id": "bad-case",
                  "version": 1,
                  "category": "Infections",
                  "title": "Bad Case",
                  "difficulty": "easy",
                  "tags": ["fever"],
                  "patientName": "A",
                  "patientAge": 20,
                  "patientSex": "female",
                  "patientBrief": "brief",
                  "openingComplaint": "complaint",
                  "authorNote": "note",
                  "facts": {
                    "symptoms": ["fever"],
                    "history": ["history"],
                    "negatives": ["none"]
                  },
                  "diagnosisOptions": ["Influenza", "Cold"],
                  "correctDiagnosis": "Appendicitis"
                }
                """);

        final CaseProperties properties = new CaseProperties();
        properties.setPath(casesRoot.toString());
        final FileSystemCaseLoaderService service = new FileSystemCaseLoaderService(new ObjectMapper(), properties);

        assertThrows(IllegalStateException.class, service::loadCases);
    }
}

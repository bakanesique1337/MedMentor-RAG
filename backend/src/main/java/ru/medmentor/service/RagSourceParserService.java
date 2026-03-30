package ru.medmentor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class RagSourceParserService {

    private final ObjectMapper objectMapper;

    public RagSourceParserService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String parse(Path filePath) throws IOException {
        final String fileName = filePath.getFileName().toString().toLowerCase();
        if (fileName.endsWith(".json")) {
            return objectMapper.readTree(filePath.toFile()).toPrettyString();
        }
        return Files.readString(filePath, StandardCharsets.UTF_8);
    }
}

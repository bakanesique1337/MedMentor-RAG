package ru.medmentor.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RagChunkingService {

    public List<String> chunkText(String content, int chunkSize, int chunkOverlap, int minChunkSize) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        final int normalizedChunkSize = Math.max(200, chunkSize);
        final int normalizedOverlap = Math.max(0, Math.min(chunkOverlap, normalizedChunkSize / 2));
        final int normalizedMinChunkSize = Math.max(50, Math.min(minChunkSize, normalizedChunkSize));

        final String normalizedContent = content.replace("\r\n", "\n").trim();
        if (normalizedContent.length() <= normalizedChunkSize) {
            return List.of(normalizedContent);
        }

        final List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < normalizedContent.length()) {
            final int maxEnd = Math.min(start + normalizedChunkSize, normalizedContent.length());
            final int splitEnd = findSplitPosition(normalizedContent, start, maxEnd);
            final String chunk = normalizedContent.substring(start, splitEnd).trim();
            if (!chunk.isEmpty()) {
                chunks.add(chunk);
            }
            if (splitEnd >= normalizedContent.length()) {
                break;
            }
            start = Math.max(splitEnd - normalizedOverlap, start + 1);
        }

        if (chunks.size() > 1) {
            final int lastIndex = chunks.size() - 1;
            final String lastChunk = chunks.get(lastIndex);
            if (lastChunk.length() < normalizedMinChunkSize) {
                final String mergedChunk = (chunks.get(lastIndex - 1) + "\n" + lastChunk).trim();
                chunks.set(lastIndex - 1, mergedChunk);
                chunks.remove(lastIndex);
            }
        }
        return chunks;
    }

    private int findSplitPosition(String content, int start, int maxEnd) {
        if (maxEnd >= content.length()) {
            return content.length();
        }

        for (int index = maxEnd; index > start + 50; index--) {
            final char current = content.charAt(index - 1);
            if (current == '\n') {
                return index;
            }
        }

        for (int index = maxEnd; index > start + 50; index--) {
            final char current = content.charAt(index - 1);
            if (Character.isWhitespace(current) || current == '.' || current == ',' || current == ';') {
                return index;
            }
        }
        return maxEnd;
    }
}

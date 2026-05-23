package ru.medmentor.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Markdown-aware chunker for clinical-recommendations documents.
 *
 * <p>Splits a markdown file into one section per top-level heading
 * ({@code #}, {@code ##}, {@code ###}) and emits one or more chunks per
 * section. Each chunk is prefixed with the full heading path so the
 * embedder sees a strong topical anchor and the downstream LLM sees what
 * section the chunk came from.
 *
 * <p>Two filters are applied at section boundaries:
 * <ul>
 *   <li>Section-level: headings matching {@link #DROPPABLE_HEADING_MARKERS}
 *   (TOC, list of abbreviations, definitions, ICD codes, bibliography,
 *   appendices about working group / methodology, etc.) are dropped
 *   entirely — they crowd top-K with content that has high lexical overlap
 *   with the disease name but zero clinical value for the simulation.</li>
 *   <li>Line-level: page-number-only lines (an artifact of the source PDF
 *   → markdown conversion) are stripped from every surviving section.</li>
 * </ul>
 *
 * <p>If a single section exceeds {@code chunkSize}, it is split further on
 * paragraph boundaries with intra-section overlap, so a long «Клиническая
 * картина» does not collapse into one giant chunk.
 */
@Service
public class RagMarkdownChunkingService {

    private static final Pattern HEADING_LINE = Pattern.compile(
            "^(#{1,3})\\s+(.+?)\\s*$",
            Pattern.MULTILINE
    );

    private static final Pattern PAGE_NUMBER_LINE = Pattern.compile(
            "(?m)^\\s*\\d{1,3}\\s*$\\n?"
    );

    /**
     * Substrings that mark a heading as describing / non-clinical for our
     * simulation use case. Matched case-insensitively against the heading
     * text with markdown decoration ({@code <u>}, {@code **}, surrounding
     * whitespace) stripped first. Conservative on purpose — anything that
     * could plausibly help a doctor in conversation stays in.
     */
    private static final List<String> DROPPABLE_HEADING_MARKERS = List.of(
            "оглавление",
            "список сокращений",
            "термины и определения",
            "определение заболевания",
            "особенности кодирования",
            "список литературы",
            "целевая аудитория",
            "порядок обновления",
            "критерии оценки качества",
            "организация оказания медицинской помощи",
            "организация медицинской помощи",
            "конфликт интересов",
            "состав рабочей группы",
            "методология разработки клинических рекомендаций",
            "уровни достоверности доказательств",
            "уровни убедительности рекомендаций"
    );

    public List<String> chunkMarkdown(String content, int chunkSize, int chunkOverlap, int minChunkSize) {
        if (content == null || content.isBlank()) {
            return List.of();
        }
        final int normalizedChunkSize = Math.max(400, chunkSize);
        final int normalizedOverlap = Math.max(0, Math.min(chunkOverlap, normalizedChunkSize / 2));
        final int normalizedMinChunkSize = Math.max(50, Math.min(minChunkSize, normalizedChunkSize));

        final String normalizedContent = content.replace("\r\n", "\n");
        final List<Section> sections = splitIntoSections(normalizedContent);
        final List<String> chunks = new ArrayList<>();

        for (final Section section : sections) {
            if (isDroppable(section.headingPath().getLast())) {
                continue;
            }
            final String cleanBody = cleanBody(section.body());
            if (cleanBody.isBlank()) {
                continue;
            }
            final String headingPrefix = "Раздел: " + String.join(" / ", section.headingPath()) + "\n\n";
            final int bodyBudget = Math.max(200, normalizedChunkSize - headingPrefix.length());
            final List<String> bodyChunks = chunkBody(cleanBody, bodyBudget, normalizedOverlap, normalizedMinChunkSize);
            for (final String bodyChunk : bodyChunks) {
                chunks.add(headingPrefix + bodyChunk);
            }
        }
        return chunks;
    }

    /**
     * Walks the file once, emitting one {@link Section} per heading found.
     * Maintains the heading path (one entry per level) so a {@code ### 2.1}
     * under {@code ## 2.} gets the path {@code ["2.", "2.1"]}.
     *
     * <p>Pre-amble content before the first heading is dropped — in our
     * corpus this is always the metadata table at the top of the file.
     */
    private List<Section> splitIntoSections(String content) {
        final List<Section> sections = new ArrayList<>();
        final Matcher matcher = HEADING_LINE.matcher(content);
        final String[] pathByLevel = new String[3];

        int prevHeadingEnd = -1;
        int prevHeadingLevel = -1;

        while (matcher.find()) {
            if (prevHeadingEnd >= 0) {
                final String body = content.substring(prevHeadingEnd, matcher.start());
                sections.add(new Section(buildPath(pathByLevel, prevHeadingLevel), body));
            }
            final int level = matcher.group(1).length();
            final String headingText = stripHeadingDecoration(matcher.group(2));
            pathByLevel[level - 1] = headingText;
            for (int deeper = level; deeper < pathByLevel.length; deeper++) {
                pathByLevel[deeper] = null;
            }
            prevHeadingEnd = matcher.end();
            prevHeadingLevel = level;
        }
        if (prevHeadingEnd >= 0 && prevHeadingEnd < content.length()) {
            final String body = content.substring(prevHeadingEnd);
            sections.add(new Section(buildPath(pathByLevel, prevHeadingLevel), body));
        }
        return sections;
    }

    private List<String> buildPath(String[] pathByLevel, int level) {
        final List<String> path = new ArrayList<>(level);
        for (int index = 0; index < level; index++) {
            if (pathByLevel[index] != null) {
                path.add(pathByLevel[index]);
            }
        }
        if (path.isEmpty() && pathByLevel[level - 1] != null) {
            path.add(pathByLevel[level - 1]);
        }
        return path;
    }

    private String stripHeadingDecoration(String headingText) {
        return headingText
                .replace("<u>", "")
                .replace("</u>", "")
                .replace("**", "")
                .replace("*", "")
                .trim();
    }

    private boolean isDroppable(String headingText) {
        final String normalized = headingText.toLowerCase(Locale.ROOT);
        for (final String marker : DROPPABLE_HEADING_MARKERS) {
            if (normalized.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    private String cleanBody(String body) {
        return PAGE_NUMBER_LINE.matcher(body).replaceAll("").trim();
    }

    /**
     * Splits a single section's body into chunks ≤ {@code budget}. If the
     * body already fits, returns one chunk. Otherwise walks paragraph by
     * paragraph (double-newline boundaries), starts a new chunk when adding
     * the next paragraph would overflow, and seeds the new chunk with the
     * last {@code overlap} characters of the previous chunk for continuity.
     */
    private List<String> chunkBody(String body, int budget, int overlap, int minChunkSize) {
        if (body.length() <= budget) {
            return List.of(body);
        }
        final List<String> chunks = new ArrayList<>();
        final String[] paragraphs = body.split("\n{2,}");
        final StringBuilder current = new StringBuilder();
        for (final String paragraphRaw : paragraphs) {
            final String paragraph = paragraphRaw.trim();
            if (paragraph.isEmpty()) {
                continue;
            }
            if (current.length() + paragraph.length() + 2 > budget && !current.isEmpty()) {
                chunks.add(current.toString().trim());
                final String tail = tail(current.toString(), overlap);
                current.setLength(0);
                if (!tail.isEmpty()) {
                    current.append(tail).append("\n\n");
                }
            }
            if (paragraph.length() > budget) {
                if (!current.isEmpty()) {
                    chunks.add(current.toString().trim());
                    current.setLength(0);
                }
                chunks.addAll(hardSplit(paragraph, budget, overlap));
                continue;
            }
            current.append(paragraph).append("\n\n");
        }
        if (!current.isEmpty()) {
            final String tailChunk = current.toString().trim();
            if (chunks.isEmpty() || tailChunk.length() >= minChunkSize) {
                chunks.add(tailChunk);
            } else {
                final int last = chunks.size() - 1;
                chunks.set(last, (chunks.get(last) + "\n\n" + tailChunk).trim());
            }
        }
        return chunks;
    }

    /**
     * Last-resort splitter for a paragraph that on its own exceeds the
     * chunk budget. Walks back from the budget boundary looking for
     * whitespace, mirroring the behaviour of {@link RagChunkingService}.
     */
    private List<String> hardSplit(String paragraph, int budget, int overlap) {
        final List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < paragraph.length()) {
            final int maxEnd = Math.min(start + budget, paragraph.length());
            int splitEnd = maxEnd;
            if (maxEnd < paragraph.length()) {
                for (int index = maxEnd; index > start + budget / 2; index--) {
                    final char ch = paragraph.charAt(index - 1);
                    if (Character.isWhitespace(ch) || ch == '.' || ch == ',' || ch == ';') {
                        splitEnd = index;
                        break;
                    }
                }
            }
            final String slice = paragraph.substring(start, splitEnd).trim();
            if (!slice.isEmpty()) {
                chunks.add(slice);
            }
            if (splitEnd >= paragraph.length()) {
                break;
            }
            start = Math.max(splitEnd - overlap, start + 1);
        }
        return chunks;
    }

    private String tail(String text, int overlap) {
        if (overlap <= 0 || text.length() <= overlap) {
            return text.trim();
        }
        return text.substring(text.length() - overlap).trim();
    }

    private record Section(List<String> headingPath, String body) { }
}

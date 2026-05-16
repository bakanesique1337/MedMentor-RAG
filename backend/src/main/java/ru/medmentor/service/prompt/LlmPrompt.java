package ru.medmentor.service.prompt;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Single source of truth for an LLM prompt: the same template definition
 * produces both the text sent to the model ({@link #forLlm()}) and the
 * audit text written to logs ({@link #forAudit()}).
 *
 * Two block kinds are supported:
 * <ul>
 *   <li><b>system</b> — fixed prompt-template content (role description,
 *       scoring rubric, etc.). Sent to the model, hidden from audit logs
 *       to keep them focused on the variable inputs.</li>
 *   <li><b>section</b> — variable inputs assembled per-request (case data,
 *       RAG context, conversation history, latest user message). Sent to
 *       the model AND included in audit logs.</li>
 * </ul>
 *
 * Because both outputs share the same ordered block list, changing what the
 * model sees automatically changes what the audit log shows. There is no
 * second place to update.
 */
public final class LlmPrompt {

    private final List<Block> blocks;

    private LlmPrompt(List<Block> blocks) {
        this.blocks = List.copyOf(blocks);
    }

    public static Builder builder() {
        return new Builder();
    }

    /**
     * Full prompt text sent to the LLM (includes both system and section blocks).
     */
    public String forLlm() {
        return blocks.stream()
                .map(Block::render)
                .collect(Collectors.joining("\n\n"));
    }

    /**
     * Audit-facing prompt text (only section blocks). Use this in DEBUG logs to
     * inspect exactly what variable content the model received without dumping
     * the fixed system templates on every call.
     */
    public String forAudit() {
        return blocks.stream()
                .filter(Block::loggable)
                .map(Block::render)
                .collect(Collectors.joining("\n\n"));
    }

    public static final class Builder {

        private final List<Block> blocks = new ArrayList<>();

        /**
         * Append a fixed system-template block. Headerless variant — used for
         * top-of-prompt role/system text that does not need a label.
         */
        public Builder system(String content) {
            return system(null, content);
        }

        /**
         * Append a fixed system-template block with a header (e.g. "Instructions").
         * Header and content are both hidden from the audit log.
         */
        public Builder system(String header, String content) {
            if (content == null) {
                return this;
            }
            blocks.add(new Block(header, content, false));
            return this;
        }

        /**
         * Append a variable input block. Header is the noun phrase (the colon
         * is added by the renderer). Both header and content appear in the
         * audit log so that the log shows the LLM input verbatim.
         */
        public Builder section(String header, String content) {
            if (header == null) {
                throw new IllegalArgumentException("section header must not be null");
            }
            blocks.add(new Block(header, content == null ? "" : content, true));
            return this;
        }

        public LlmPrompt build() {
            return new LlmPrompt(blocks);
        }
    }

    private record Block(String header, String content, boolean loggable) {
        String render() {
            if (header == null || header.isEmpty()) {
                return content;
            }
            return header + ":\n" + content;
        }
    }
}

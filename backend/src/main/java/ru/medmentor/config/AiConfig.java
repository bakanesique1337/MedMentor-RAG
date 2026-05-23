package ru.medmentor.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.ollama.api.OllamaChatOptions;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import ru.medmentor.service.PromptTemplateService;

import java.util.List;

@Configuration
public class AiConfig {

    /**
     * Default ChatClient backed by Google Gemini (active when the "ollama" profile is NOT enabled).
     * Профиль по умолчанию: чат через Google Gemini.
     */
    @Bean
    @Profile("!ollama")
    public ChatClient chatClient(
            @Qualifier("googleGenAiChatModel") ChatModel chatModel,
            PromptTemplateService promptTemplateService
    ) {
        return ChatClient.builder(chatModel)
                .defaultSystem(promptTemplateService.getGlobalSystemPrompt())
                .build();
    }

    /**
     * ChatClient backed by local Ollama. Active when the "ollama" profile is enabled
     * (e.g. SPRING_PROFILES_ACTIVE=ollama).
     * Профиль "ollama": чат через локальный Ollama, эмбеддинги остаются на Ollama же.
     */
    @Bean
    @Profile("ollama")
    public ChatClient chatClientOllama(
            @Qualifier("ollamaChatModel") ChatModel chatModel,
            PromptTemplateService promptTemplateService
    ) {
        // Стоп-последовательности страхуют от «второго круга» в лаб/инструментальных
        // ответах: после `**Заключение.** …` qwen3 любит поставить `---` и начать
        // дублирующий `### …`-раздел. `repeat_penalty` не ловит это, потому что
        // первый раздел уже выпал из окна `repeat_last_n`. Stop-токены физически
        // обрывают поток на разделителе. Применимо только к patient-role.txt; в
        // session-opening / score-review / examination-finding `\n---` и `\n\n###`
        // не встречаются, табличный `|---|---|` начинается с `|` и не матчится.
        final OllamaChatOptions defaultOptions = OllamaChatOptions.builder()
                .disableThinking()
                .stop(List.of("\n---", "\n\n###"))
                .build();
        return ChatClient.builder(chatModel)
                .defaultSystem(promptTemplateService.getGlobalSystemPrompt())
                .defaultOptions(defaultOptions)
                .build();
    }

    @Bean
    public TokenTextSplitter textSplitter() {
        return new TokenTextSplitter();
    }
}

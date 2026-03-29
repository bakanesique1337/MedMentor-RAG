package ru.medmentor.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ru.medmentor.service.PromptTemplateService;

@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(
            @Qualifier("googleGenAiChatModel") ChatModel chatModel,
            PromptTemplateService promptTemplateService
    ) {
        return ChatClient.builder(chatModel)
                .defaultSystem(promptTemplateService.getGlobalSystemPrompt())
                .build();
    }

    @Bean
    public TokenTextSplitter textSplitter() {
        return new TokenTextSplitter();
    }
}

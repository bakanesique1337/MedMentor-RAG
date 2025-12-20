package ru.medmentor.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(ChatModel chatModel, AiProperties aiProperties) {
        return ChatClient.builder(chatModel)
                .defaultSystem(aiProperties.getSystemPrompt())
                .build();
    }

    @Bean
    public TokenTextSplitter textSplitter() {
        return new TokenTextSplitter();
    }
}

package com.mattuttis.chatbot.chat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.Assert;

@Configuration
class ChatClientConfig {

    private static final Logger log = LoggerFactory.getLogger(ChatClientConfig.class);

    @Bean
    ChatClient chatClient(ChatClient.Builder builder, @Value("${spring.ai.anthropic.api-key}") String apiKey) {
        Assert.hasText(apiKey, "ANTHROPIC_API_KEY is not set");
        log.info("Chat client ready");
        return builder.build();
    }
}

package com.mattuttis.chatbot;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(properties = "spring.ai.anthropic.api-key=test-key")
@AutoConfigureWebTestClient
class ChatbotApplicationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void reportsReadiness() {
        webTestClient.get().uri("/actuator/health/readiness").exchange().expectStatus().isOk();
    }

    @Test
    void reportsLiveness() {
        webTestClient.get().uri("/actuator/health/liveness").exchange().expectStatus().isOk();
    }
}

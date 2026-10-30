package com.mattuttis.chatbot.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webflux.test.autoconfigure.WebFluxTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;

@WebFluxTest(ChatController.class)
class ChatControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean(answers = Answers.RETURNS_DEEP_STUBS)
    private ChatClient chatClient;

    @Test
    void streamsReplyAsServerSentEvents() {
        when(chatClient.prompt().user(anyString()).stream().content())
                .thenReturn(Flux.just("Hello", " world"));

        String body = post("{\"message\":\"Hi\"}")
                .expectStatus().isOk()
                .expectHeader().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM)
                .expectBody(String.class).returnResult().getResponseBody();

        assertThat(body).contains("{\"text\":\"Hello\"}").contains("{\"text\":\" world\"}");
    }

    @Test
    void sendsErrorEventWhenClaudeFails() {
        when(chatClient.prompt().user(anyString()).stream().content())
                .thenReturn(Flux.error(new IllegalStateException("API unavailable")));

        String body = post("{\"message\":\"Hi\"}")
                .expectStatus().isOk()
                .expectBody(String.class).returnResult().getResponseBody();

        assertThat(body).contains("event:error").doesNotContain("API unavailable");
    }

    @Test
    void rejectsBlankMessage() {
        post("{\"message\":\"  \"}").expectStatus().isBadRequest();
    }

    @Test
    void rejectsMessageOverSizeLimit() {
        String message = "a".repeat(4001);

        post("{\"message\":\"" + message + "\"}").expectStatus().isBadRequest();
    }

    private WebTestClient.ResponseSpec post(String body) {
        return webTestClient.post().uri("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchange();
    }
}

package com.mattuttis.chatbot.chat;

import jakarta.validation.constraints.NotBlank;

record ChatRequest(@NotBlank String message) {
}

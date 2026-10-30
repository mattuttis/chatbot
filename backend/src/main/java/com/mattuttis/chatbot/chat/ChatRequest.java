package com.mattuttis.chatbot.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record ChatRequest(@NotBlank @Size(max = 4000) String message) {
}

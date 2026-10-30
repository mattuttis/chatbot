package com.mattuttis.chatbot.chat;

/**
 * One piece of a streamed reply. Sent as JSON because SSE clients strip the
 * leading space from plain-text data, which would join words together.
 */
record ChatChunk(String text) {
}

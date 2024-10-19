package com.example.chat.confg;

import com.example.chat.chat.ChatMessage;
import com.example.chat.chat.MassageType;
import com.example.chat.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final SimpMessageSendingOperations messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = (String) headerAccessor.getSessionAttributes().get("username");

        if (username != null) {
            log.info("User Disconnected: " + username);

            // Create a ChatMessage to store in the database
            ChatMessage chatMessage = ChatMessage.builder()
                    .sender(username)
                    .type(MassageType.LEAVE)
                    .content("User " + username + " has left the chat")
                    .timestamp(LocalDateTime.now())
                    .build();

            // Save the message to the database
            chatMessageRepository.save(chatMessage);

            // Send the message to other clients
            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }
}

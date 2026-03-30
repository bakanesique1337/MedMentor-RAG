package ru.medmentor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.medmentor.model.ConversationMessage;

import java.util.List;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, Long> {

    List<ConversationMessage> findBySessionIdOrderByMessageOrderAsc(Long sessionId);
}

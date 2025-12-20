package ru.medmentor;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import ru.medmentor.config.AiProperties;
import ru.medmentor.service.AiServiceImpl;

@ExtendWith(MockitoExtension.class)
class MedMentorRAGApplicationTests {

	@Mock
	private ChatClient chatClient;

	@Mock
	private AiProperties aiProperties;

	@InjectMocks
	private AiServiceImpl aiService;
}

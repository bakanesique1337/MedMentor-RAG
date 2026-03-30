package ru.medmentor.service;

import ru.medmentor.model.ConversationMessage;
import ru.medmentor.model.MedicalCase;
import reactor.core.publisher.Flux;

import java.util.List;

public interface SimulationAiService {

    String generateOpeningMessage(MedicalCase medicalCase);

    Flux<String> streamOpeningMessage(MedicalCase medicalCase);

    String generatePatientReply(MedicalCase medicalCase, List<ConversationMessage> conversationHistory, String doctorMessage);

    Flux<String> streamPatientReply(MedicalCase medicalCase, List<ConversationMessage> conversationHistory, String doctorMessage);

    ScoreReviewPayload generateScoreReview(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String selectedDiagnosis
    );
}

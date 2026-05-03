package ru.medmentor.service;

import ru.medmentor.model.ConversationMessage;
import ru.medmentor.model.MedicalCase;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.function.Consumer;

public interface SimulationAiService {

    String generateOpeningMessage(MedicalCase medicalCase);

    Flux<String> streamOpeningMessage(MedicalCase medicalCase);

    Flux<String> streamOpeningMessage(MedicalCase medicalCase, Consumer<String> warningSink);

    String generatePatientReply(MedicalCase medicalCase, List<ConversationMessage> conversationHistory, String doctorMessage);

    Flux<String> streamPatientReply(MedicalCase medicalCase, List<ConversationMessage> conversationHistory, String doctorMessage);

    Flux<String> streamPatientReply(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage,
            Consumer<String> warningSink
    );

    Flux<String> streamExaminationFinding(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage,
            Consumer<String> warningSink
    );

    ScoreReviewPayload generateScoreReview(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String selectedDiagnosis,
            String selectedDiagnosisRationale,
            Integer selectedDiagnosisConfidence
    );
}

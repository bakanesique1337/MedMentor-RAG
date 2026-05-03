package ru.medmentor.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScoreReviewPayload(
        ScorePayload score,
        boolean diagnosisMatch,
        String summary,
        CriterionNotesPayload criterionNotes,
        List<KeyTurnPayload> keyTurns,
        List<String> missedFindings
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ScorePayload(
            double politeness,
            @JsonProperty("questioningStructure") double questioningStructure,
            double thoroughness,
            double empathy,
            double correctDiagnosis
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CriterionNotesPayload(
            String politeness,
            String questioningStructure,
            String thoroughness,
            String empathy,
            String correctDiagnosis
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record KeyTurnPayload(
            int turn,
            String kind,
            String text,
            String tag
    ) {
    }
}

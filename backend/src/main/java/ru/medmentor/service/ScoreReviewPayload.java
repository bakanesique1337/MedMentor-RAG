package ru.medmentor.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ScoreReviewPayload(
        ScorePayload score,
        String summary
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
}

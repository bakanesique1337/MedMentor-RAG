package ru.medmentor.dto;

public record StreamingStatusDto(
        boolean inFlight,
        String type
) {
}

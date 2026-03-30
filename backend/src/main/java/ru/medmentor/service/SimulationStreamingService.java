package ru.medmentor.service;

public interface SimulationStreamingService {

    void startOpeningMessage(Long sessionId);

    void retryOpeningMessage(Long sessionId);

    void startPatientReply(Long sessionId, String doctorMessage);

    boolean isAnyResponseInFlight(Long sessionId);
}

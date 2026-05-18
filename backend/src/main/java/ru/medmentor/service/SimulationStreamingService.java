package ru.medmentor.service;

public interface SimulationStreamingService {

    void startOpeningMessage(Long sessionId);

    void retryOpeningMessage(Long sessionId);

    void startPatientReply(Long sessionId, String doctorMessage);

    /**
     * Запускает стрим ответа модели и сохраняет результат как сообщение с ролью
     * {@code SYSTEM} (а не {@code PATIENT}). Используется для запросов
     * лабораторных/инструментальных данных, на которые модель отвечает не от лица
     * пациента, а в формате клинической карточки (markdown).
     */
    void startSystemReply(Long sessionId, String doctorMessage);

    void startExaminationFinding(Long sessionId, String doctorMessage);

    boolean isAnyResponseInFlight(Long sessionId);
}

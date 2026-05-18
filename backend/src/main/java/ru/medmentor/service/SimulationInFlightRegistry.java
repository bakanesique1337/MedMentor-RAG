package ru.medmentor.service;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SimulationInFlightRegistry {

    private final Set<Long> sessionsInFlight = ConcurrentHashMap.newKeySet();
    private final Set<Long> openingSessionsInFlight = ConcurrentHashMap.newKeySet();
    private final Set<Long> findingSessionsInFlight = ConcurrentHashMap.newKeySet();
    private final Set<Long> systemSessionsInFlight = ConcurrentHashMap.newKeySet();

    public boolean markMessageInFlight(Long sessionId) {
        return sessionsInFlight.add(sessionId);
    }

    public void clearMessageInFlight(Long sessionId) {
        sessionsInFlight.remove(sessionId);
    }

    public boolean isMessageInFlight(Long sessionId) {
        return sessionsInFlight.contains(sessionId);
    }

    public boolean markOpeningInFlight(Long sessionId) {
        return openingSessionsInFlight.add(sessionId);
    }

    public void clearOpeningInFlight(Long sessionId) {
        openingSessionsInFlight.remove(sessionId);
    }

    public boolean isOpeningInFlight(Long sessionId) {
        return openingSessionsInFlight.contains(sessionId);
    }

    public boolean markFindingInFlight(Long sessionId) {
        return findingSessionsInFlight.add(sessionId);
    }

    public void clearFindingInFlight(Long sessionId) {
        findingSessionsInFlight.remove(sessionId);
    }

    public boolean isFindingInFlight(Long sessionId) {
        return findingSessionsInFlight.contains(sessionId);
    }

    public boolean markSystemInFlight(Long sessionId) {
        return systemSessionsInFlight.add(sessionId);
    }

    public void clearSystemInFlight(Long sessionId) {
        systemSessionsInFlight.remove(sessionId);
    }

    public boolean isSystemInFlight(Long sessionId) {
        return systemSessionsInFlight.contains(sessionId);
    }

    public boolean isAnyResponseInFlight(Long sessionId) {
        return isOpeningInFlight(sessionId)
                || isMessageInFlight(sessionId)
                || isFindingInFlight(sessionId)
                || isSystemInFlight(sessionId);
    }
}

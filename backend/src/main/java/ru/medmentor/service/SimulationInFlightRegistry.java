package ru.medmentor.service;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SimulationInFlightRegistry {

    private final Set<Long> sessionsInFlight = ConcurrentHashMap.newKeySet();
    private final Set<Long> openingSessionsInFlight = ConcurrentHashMap.newKeySet();

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

    public boolean isAnyResponseInFlight(Long sessionId) {
        return isOpeningInFlight(sessionId) || isMessageInFlight(sessionId);
    }
}

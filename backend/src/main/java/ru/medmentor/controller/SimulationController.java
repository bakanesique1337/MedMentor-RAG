package ru.medmentor.controller;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.medmentor.dto.ActiveSimulationDto;
import ru.medmentor.dto.ResultDto;
import ru.medmentor.dto.SimulationCommandResponseDto;
import ru.medmentor.dto.SimulationDiagnosisRequestDto;
import ru.medmentor.dto.SimulationMessageRequestDto;
import ru.medmentor.dto.SimulationSessionDto;
import ru.medmentor.dto.StartSimulationRequestDto;
import ru.medmentor.service.SimulationService;

import java.util.Optional;

@RestController
@RequestMapping("/api/simulations")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/start")
    public SimulationCommandResponseDto startSimulation(
            Authentication authentication,
            @Valid @RequestBody StartSimulationRequestDto request
    ) {
        return simulationService.startSession(authentication.getName(), request.caseId());
    }

    @PostMapping("/{sessionId}/message")
    public SimulationCommandResponseDto sendMessage(
            Authentication authentication,
            @PathVariable Long sessionId,
            @Valid @RequestBody SimulationMessageRequestDto request
    ) {
        return simulationService.sendMessage(authentication.getName(), sessionId, request.content());
    }

    @PostMapping("/{sessionId}/finish-examination")
    public SimulationSessionDto finishExamination(Authentication authentication, @PathVariable Long sessionId) {
        return simulationService.finishExamination(authentication.getName(), sessionId);
    }

    @PostMapping("/{sessionId}/diagnose")
    public SimulationSessionDto diagnose(
            Authentication authentication,
            @PathVariable Long sessionId,
            @Valid @RequestBody SimulationDiagnosisRequestDto request
    ) {
        return simulationService.submitDiagnosis(authentication.getName(), sessionId, request.diagnosis());
    }

    @GetMapping("/{sessionId}")
    public SimulationSessionDto getSession(
            Authentication authentication,
            @PathVariable Long sessionId,
            @RequestParam(defaultValue = "false") boolean retryOpening
    ) {
        return simulationService.getSession(authentication.getName(), sessionId, retryOpening);
    }

    @PostMapping("/{sessionId}/score")
    public ResultDto score(Authentication authentication, @PathVariable Long sessionId) {
        return simulationService.scoreSession(authentication.getName(), sessionId);
    }

    @GetMapping("/active")
    public Optional<ActiveSimulationDto> active(Authentication authentication) {
        return simulationService.getActiveSession(authentication.getName());
    }
}

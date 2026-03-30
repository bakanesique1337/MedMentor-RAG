package ru.medmentor.controller;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.medmentor.dto.CaseCardDto;
import ru.medmentor.dto.HistorySessionDto;
import ru.medmentor.dto.SimulationSessionDto;
import ru.medmentor.dto.SimulationStatsOverviewDto;
import ru.medmentor.dto.UpdateUserSettingsRequestDto;
import ru.medmentor.dto.UserSettingsDto;
import ru.medmentor.service.SimulationService;
import ru.medmentor.service.UserAccountService;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SupportingController {

    private final SimulationService simulationService;
    private final UserAccountService userAccountService;

    public SupportingController(SimulationService simulationService, UserAccountService userAccountService) {
        this.simulationService = simulationService;
        this.userAccountService = userAccountService;
    }

    @GetMapping("/cases")
    public List<CaseCardDto> cases(@RequestParam(required = false) String category) {
        return simulationService.getCaseCards(category);
    }

    @GetMapping("/settings")
    public UserSettingsDto settings(Authentication authentication) {
        return userAccountService.getSettings(authentication.getName());
    }

    @PutMapping("/settings")
    public UserSettingsDto updateSettings(
            Authentication authentication,
            @Valid @RequestBody UpdateUserSettingsRequestDto request
    ) {
        return userAccountService.updateSettings(authentication.getName(), request.displayName(), request.settings());
    }

    @GetMapping("/history")
    public List<HistorySessionDto> history(Authentication authentication) {
        return simulationService.getHistory(authentication.getName());
    }

    @GetMapping("/history/{sessionId}")
    public SimulationSessionDto historyDetail(Authentication authentication, @PathVariable Long sessionId) {
        return simulationService.getSession(authentication.getName(), sessionId, false);
    }

    @GetMapping("/stats/overview")
    public SimulationStatsOverviewDto statsOverview(Authentication authentication) {
        return simulationService.getStatsOverview(authentication.getName());
    }
}

package ru.medmentor.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import ru.medmentor.config.SecurityConfig;
import ru.medmentor.controller.ApiExceptionHandler;
import ru.medmentor.controller.AuthController;
import ru.medmentor.controller.SimulationController;
import ru.medmentor.controller.SupportingController;
import ru.medmentor.dto.ActiveSimulationDto;
import ru.medmentor.dto.CaseCardDto;
import ru.medmentor.dto.SimulationCommandResponseDto;
import ru.medmentor.dto.SimulationStatsOverviewDto;
import ru.medmentor.dto.UserSettingsDto;
import ru.medmentor.model.OpeningStatus;
import ru.medmentor.model.SimulationState;
import ru.medmentor.model.UserAccount;
import ru.medmentor.service.SimulationService;
import ru.medmentor.service.UserAccountService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        AuthController.class,
        SupportingController.class,
        SimulationController.class,
        ApiExceptionHandler.class
})
@Import(SecurityConfig.class)
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "medmentor.auth.username=doctor",
        "medmentor.auth.password=change_me",
        "medmentor.auth.display-name=Local Doctor",
        "medmentor.auth.allowed-origins=http://localhost:3000"
})
class ApiE2eTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SimulationService simulationService;

    @MockitoBean
    private UserAccountService userAccountService;

    @BeforeEach
    void setUp() {
        when(userAccountService.getByUsername("doctor")).thenReturn(
                UserAccount.builder().id(1L).username("doctor").displayName("Local Doctor").build()
        );
        when(userAccountService.getSettings("doctor")).thenReturn(
                new UserSettingsDto("doctor", "Local Doctor", Map.of("theme", "light"))
        );
        when(userAccountService.updateSettings(eq("doctor"), eq("Dr. House"), eq(Map.of("theme", "dark"))))
                .thenReturn(new UserSettingsDto("doctor", "Dr. House", Map.of("theme", "dark")));
    }

    @Test
    void protectedEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/settings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginThenAccessProtectedEndpoints() throws Exception {
        final MockHttpSession session = login("doctor", "change_me");

        when(simulationService.getCaseCards(null)).thenReturn(List.of(
                new CaseCardDto(
                        "infection-influenza-001",
                        "Infections",
                        "Classic influenza presentation",
                        "easy",
                        List.of("fever"),
                        "Anna Petrova",
                        26,
                        "female",
                        "Fever and cough"
                )
        ));
        when(simulationService.getStatsOverview("doctor")).thenReturn(new SimulationStatsOverviewDto(
                2,
                0.80,
                0.70,
                0.75,
                0.85,
                0.50
        ));

        mockMvc.perform(get("/api/settings").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("doctor"))
                .andExpect(jsonPath("$.displayName").value("Local Doctor"));

        mockMvc.perform(get("/api/cases").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("infection-influenza-001"));

        mockMvc.perform(get("/api/stats/overview").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedSessions").value(2));
    }

    @Test
    void invalidLoginReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"doctor","password":"wrong"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void simulationEndpointsRespectConflictMapping() throws Exception {
        final MockHttpSession session = login("doctor", "change_me");

        when(simulationService.startSession("doctor", "infection-influenza-001"))
                .thenThrow(new IllegalStateException("User already has an unfinished simulation session"));

        mockMvc.perform(post("/api/simulations/start")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"caseId":"infection-influenza-001"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("User already has an unfinished simulation session"));
    }

    @Test
    void simulationEndpointsReturnExpectedPayloads() throws Exception {
        final MockHttpSession session = login("doctor", "change_me");

        when(simulationService.startSession("doctor", "infection-influenza-001"))
                .thenReturn(new SimulationCommandResponseDto(11L, "OPENING_STARTED"));
        when(simulationService.getActiveSession("doctor")).thenReturn(java.util.Optional.of(
                new ActiveSimulationDto(
                        11L,
                        "infection-influenza-001",
                        "Classic influenza presentation",
                        "Anna Petrova",
                        SimulationState.CASE_STARTED,
                        OpeningStatus.OPENING_PENDING,
                        LocalDateTime.now()
                )
        ));

        mockMvc.perform(post("/api/simulations/start")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("caseId", "infection-influenza-001"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(11))
                .andExpect(jsonPath("$.status").value("OPENING_STARTED"));

        mockMvc.perform(get("/api/simulations/active").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(11))
                .andExpect(jsonPath("$.openingStatus").value("OPENING_PENDING"));

        mockMvc.perform(put("/api/settings")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "displayName", "Dr. House",
                                "settings", Map.of("theme", "dark")
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Dr. House"))
                .andExpect(jsonPath("$.settings.theme").value("dark"));
    }

    private MockHttpSession login(String username, String password) throws Exception {
        return (MockHttpSession) mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", username,
                                "password", password
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getRequest()
                .getSession();
    }
}

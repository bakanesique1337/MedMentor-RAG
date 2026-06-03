package ru.medmentor.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.medmentor.dto.AuthLoginRequestDto;
import ru.medmentor.dto.AuthUserDto;
import ru.medmentor.model.UserAccount;
import ru.medmentor.service.UserAccountService;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserAccountService userAccountService;

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody AuthLoginRequestDto request,
            HttpServletRequest httpRequest
    ) {
        try {
            final Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            final SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            final HttpSession session = httpRequest.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

            return ResponseEntity.ok(toUserDto(authentication.getName(), true));
        } catch (BadCredentialsException ex) {
            final Map<String, Object> error = new LinkedHashMap<>();
            error.put("error", "Invalid username or password");
            error.put("status", HttpStatus.UNAUTHORIZED.value());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        SecurityContextHolder.clearContext();

        final HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        response.setHeader("Clear-Site-Data", "\"cookies\"");

        final Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserDto> me(Authentication authentication) {
        return ResponseEntity.ok(toUserDto(authentication.getName(), true));
    }

    private AuthUserDto toUserDto(String username, boolean authenticated) {
        final UserAccount userAccount = userAccountService.getByUsername(username);
        return AuthUserDto.builder()
                .username(username)
                .displayName(userAccount.getDisplayName())
                .authenticated(authenticated)
                .build()
                ;
    }
}

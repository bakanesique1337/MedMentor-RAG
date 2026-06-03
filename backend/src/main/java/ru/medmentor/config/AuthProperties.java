package ru.medmentor.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "medmentor.auth")
public class AuthProperties {

    /**
     * Username for the single local development user.
     */
    private String username;

    /**
     * Plain-text password sourced from local env for development bootstrap.
     */
    private String password;

    /**
     * Friendly display name returned by auth endpoints until the DB-backed user model exists.
     */
    private String displayName = "Local Doctor";

    /**
     * Frontend origins allowed to send cookie-based API requests.
     */
    private List<String> allowedOrigins = new ArrayList<>(List.of(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173"
    ));
}

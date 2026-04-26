package ru.medmentor.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.medmentor.config.AuthProperties;
import ru.medmentor.dto.UpdateUserSettingsRequestDto;
import ru.medmentor.dto.UserSettingsDto;
import ru.medmentor.model.UserAccount;
import ru.medmentor.repository.UserAccountRepository;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Service
public class UserAccountServiceImpl implements UserAccountService {

    /**
     * Reserved keys persisted as typed fields in the profile DTO.
     * Stored inside the JSONB settings column but exposed at the top level of the response.
     */
    private static final Set<String> PROFILE_KEYS = Set.of(
            "firstName",
            "lastName",
            "email",
            "role",
            "course",
            "faculty",
            "university",
            "avatarVariant"
    );

    private final UserAccountRepository userAccountRepository;
    private final AuthProperties authProperties;

    public UserAccountServiceImpl(UserAccountRepository userAccountRepository, AuthProperties authProperties) {
        this.userAccountRepository = userAccountRepository;
        this.authProperties = authProperties;
    }

    @PostConstruct
    @Transactional
    public void bootstrapDefaultUser() {
        getOrCreateDefaultUser();
    }

    @Override
    @Transactional
    public UserAccount getOrCreateDefaultUser() {
        return userAccountRepository.findByUsername(authProperties.getUsername())
                .orElseGet(() -> userAccountRepository.save(UserAccount.builder()
                        .username(authProperties.getUsername())
                        .displayName(authProperties.getDisplayName())
                        .settings(new LinkedHashMap<>())
                        .build()));
    }

    @Override
    @Transactional(readOnly = true)
    public UserAccount getByUsername(String username) {
        return userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Unknown username: " + username));
    }

    @Override
    @Transactional(readOnly = true)
    public UserSettingsDto getSettings(String username) {
        final UserAccount userAccount = getByUsername(username);
        return toDto(userAccount);
    }

    @Override
    @Transactional
    public UserSettingsDto updateSettings(String username, UpdateUserSettingsRequestDto request) {
        final UserAccount userAccount = getByUsername(username);
        userAccount.setDisplayName(request.displayName().trim());

        // Start from the misc settings map, then layer typed profile fields on top
        // so they win over any duplicate keys submitted in the misc map.
        final Map<String, Object> merged = new LinkedHashMap<>(
                request.settings() == null ? Map.of() : request.settings()
        );

        // Strip any reserved keys that may have been sent inside the misc map
        // to avoid stale duplicates competing with the typed fields.
        PROFILE_KEYS.forEach(merged::remove);

        putIfPresent(merged, "firstName", request.firstName());
        putIfPresent(merged, "lastName", request.lastName());
        putIfPresent(merged, "email", request.email());
        putIfPresent(merged, "role", request.role());
        putIfPresent(merged, "course", request.course());
        putIfPresent(merged, "faculty", request.faculty());
        putIfPresent(merged, "university", request.university());
        putIfPresent(merged, "avatarVariant", request.avatarVariant());

        userAccount.setSettings(merged);
        final UserAccount saved = userAccountRepository.save(userAccount);
        return toDto(saved);
    }

    private static UserSettingsDto toDto(UserAccount user) {
        final Map<String, Object> raw = user.getSettings() == null ? Map.of() : user.getSettings();
        final Map<String, Object> misc = new LinkedHashMap<>(raw);
        PROFILE_KEYS.forEach(misc::remove);

        return new UserSettingsDto(
                user.getUsername(),
                user.getDisplayName(),
                asString(raw.get("firstName")),
                asString(raw.get("lastName")),
                asString(raw.get("email")),
                asString(raw.get("role")),
                asString(raw.get("course")),
                asString(raw.get("faculty")),
                asString(raw.get("university")),
                asString(raw.get("avatarVariant")),
                Map.copyOf(misc)
        );
    }

    private static void putIfPresent(Map<String, Object> map, String key, String value) {
        if (value != null) {
            map.put(key, value);
        }
    }

    private static String asString(Object value) {
        return value instanceof String s ? s : null;
    }
}

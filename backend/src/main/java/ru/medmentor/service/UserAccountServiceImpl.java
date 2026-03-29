package ru.medmentor.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.medmentor.config.AuthProperties;
import ru.medmentor.dto.UserSettingsDto;
import ru.medmentor.model.UserAccount;
import ru.medmentor.repository.UserAccountRepository;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class UserAccountServiceImpl implements UserAccountService {

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
        return new UserSettingsDto(
                userAccount.getUsername(),
                userAccount.getDisplayName(),
                Map.copyOf(userAccount.getSettings())
        );
    }

    @Override
    @Transactional
    public UserSettingsDto updateSettings(String username, String displayName, Map<String, Object> settings) {
        final UserAccount userAccount = getByUsername(username);
        userAccount.setDisplayName(displayName.trim());
        userAccount.setSettings(settings == null ? new LinkedHashMap<>() : new LinkedHashMap<>(settings));
        final UserAccount savedUser = userAccountRepository.save(userAccount);
        return new UserSettingsDto(
                savedUser.getUsername(),
                savedUser.getDisplayName(),
                Map.copyOf(savedUser.getSettings())
        );
    }
}

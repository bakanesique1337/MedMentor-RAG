package ru.medmentor.service;

import ru.medmentor.dto.UserSettingsDto;
import ru.medmentor.model.UserAccount;

import java.util.Map;

public interface UserAccountService {

    UserAccount getOrCreateDefaultUser();

    UserAccount getByUsername(String username);

    UserSettingsDto getSettings(String username);

    UserSettingsDto updateSettings(String username, String displayName, Map<String, Object> settings);
}

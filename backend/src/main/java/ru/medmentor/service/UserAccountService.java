package ru.medmentor.service;

import ru.medmentor.dto.UpdateUserSettingsRequestDto;
import ru.medmentor.dto.UserSettingsDto;
import ru.medmentor.model.UserAccount;

public interface UserAccountService {

    UserAccount getOrCreateDefaultUser();

    UserAccount getByUsername(String username);

    UserSettingsDto getSettings(String username);

    UserSettingsDto updateSettings(String username, UpdateUserSettingsRequestDto request);
}

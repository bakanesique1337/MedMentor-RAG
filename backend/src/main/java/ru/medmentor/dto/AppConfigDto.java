package ru.medmentor.dto;

/**
 * Публичная информация о текущей конфигурации приложения.
 */
public record AppConfigDto(
        String provider,
        String model
) {
}
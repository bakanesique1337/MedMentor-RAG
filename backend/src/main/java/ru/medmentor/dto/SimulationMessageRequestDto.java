package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * Запрос на отправку реплики врача в активной сессии.
 *
 * <p>{@code content} — текст, который будет сохранён в ленте как DOCTOR-сообщение
 * и показан пользователю. {@code narratorPrompt} — необязательный «технический»
 * промпт, который уйдёт нарратору вместо {@code content}. Используется
 * quick-prompt'ами, где UI-формулировка адресована пациенту, а инструкция
 * модели должна оставаться формальной (например, запрос лабораторных данных).
 * Если {@code narratorPrompt} не задан или пуст — нарратору уходит {@code content}.
 */
public record SimulationMessageRequestDto(
        @Schema(example = "When did your symptoms start?")
        @NotBlank(message = "Message content is required")
        String content,

        @Schema(
                description = "Optional internal prompt routed to the narrator model instead of content",
                example = "Давайте назначим лабораторные исследования и посмотрим доступные результаты"
        )
        String narratorPrompt
) {
}
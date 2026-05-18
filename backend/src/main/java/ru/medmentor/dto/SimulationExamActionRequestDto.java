package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * Тело запроса на действие «провести осмотр».
 *
 * <p>Содержит необязательную реплику врача: если она передана, бэкенд
 * персистит её как DOCTOR-сообщение в ленту перед SYSTEM-карточкой осмотра.
 * Это нужно для quick-prompt из чата (когда врач формулирует своё действие
 * текстом), и не нужно для побочной кнопки «Провести осмотр» в сайдбаре,
 * которая просто раскрывает карточку без сопроводительной реплики.
 */
public record SimulationExamActionRequestDto(
        @Schema(description = "Optional doctor turn to persist before the exam card. May be null/blank.",
                example = "Давайте проведём физикальный осмотр пациента.")
        @Size(max = 2000, message = "Message must not exceed 2000 characters")
        String content
) {
}

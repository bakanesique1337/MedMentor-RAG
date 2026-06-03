package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiRequestDto {

    @Schema(example = "What symptoms are you experiencing?")
    @NotBlank(message = "User message is required")
    private String userMessage;
}

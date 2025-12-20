package ru.medmentor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiRequestDto {

    @NotBlank(message = "User message is required")
    private String userMessage;

    private Map<String, Object> metadata;
}

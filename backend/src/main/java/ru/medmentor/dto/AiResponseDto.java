package ru.medmentor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiResponseDto {

    private String aiMessage;

    private String requestId;

    private Long timestamp;

    private Map<String, Object> metadata;
}

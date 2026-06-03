package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiResponseDto {

    @Schema(example = "I have had fever and dry cough for 3 days.")
    private String aiMessage;

    @Schema(example = "7b2fce17-18cb-41fd-9f5e-7240e4a67a95")
    private String requestId;

    @Schema(example = "1743339600000")
    private Long timestamp;
}

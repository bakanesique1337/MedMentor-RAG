package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Pivotal moment in the dialogue, used to build the result-page timeline")
public record KeyTurnDto(
        @Schema(example = "3", description = "1-based index of the doctor's message in the dialogue")
        int turn,
        @Schema(example = "good", description = "good | warn", allowableValues = {"good", "warn"})
        String kind,
        @Schema(example = "Уточнение характера боли (\"давящая, иррадиация в левую руку\").")
        String text,
        @Schema(example = "ВЕРНО")
        String tag
) {
}

package ru.medmentor.service;

import ru.medmentor.dto.AiRequestDto;
import ru.medmentor.dto.AiResponseDto;

public interface AiService {

    AiResponseDto processRequest(AiRequestDto request);
}

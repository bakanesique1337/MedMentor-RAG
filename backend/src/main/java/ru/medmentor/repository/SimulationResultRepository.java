package ru.medmentor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.medmentor.model.SimulationResult;

import java.util.Optional;

public interface SimulationResultRepository extends JpaRepository<SimulationResult, Long> {

    Optional<SimulationResult> findBySessionId(Long sessionId);
}

package ru.medmentor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.medmentor.model.SimulationSession;
import ru.medmentor.model.SimulationState;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SimulationSessionRepository extends JpaRepository<SimulationSession, Long> {

    Optional<SimulationSession> findFirstByUserIdAndStateNotInOrderByCreatedAtDesc(
            Long userId,
            Collection<SimulationState> states
    );

    List<SimulationSession> findByUserIdAndStateOrderByCreatedAtDesc(Long userId, SimulationState state);

    List<SimulationSession> findByUserIdOrderByCreatedAtDesc(Long userId);
}

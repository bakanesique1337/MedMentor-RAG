package ru.medmentor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.medmentor.model.UserScore;

import java.util.Optional;

public interface UserScoreRepository extends JpaRepository<UserScore, Long> {

    Optional<UserScore> findBySessionId(Long sessionId);
}

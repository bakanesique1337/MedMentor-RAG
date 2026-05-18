package ru.medmentor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    /**
     * Атомарно выставляет {@code exam_revealed=true} ровно один раз для сессии.
     * Возвращает количество обновлённых строк: {@code 1}, если осмотр был раскрыт
     * именно этим вызовом, и {@code 0}, если флаг уже был {@code true} (другой
     * параллельный запрос уже успел раскрыть осмотр).
     *
     * <p>Используется как гонко-безопасный признак «я первый» для вставки
     * SYSTEM-карточки осмотра в ленту. На Postgres работает через row-level lock:
     * параллельные UPDATE'ы сериализуются, и только один из них видит
     * {@code exam_revealed=false} в WHERE — остальные получают 0.
     */
    @Modifying
    @Query("UPDATE SimulationSession s SET s.examRevealed = true "
            + "WHERE s.id = :id AND s.examRevealed = false")
    int markExamRevealedIfNot(@Param("id") Long id);
}

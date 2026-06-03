package ru.medmentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "simulation_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private SimulationSession session;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    /**
     * Per-criterion notes returned by the LLM. Keys mirror {@link UserScore} fields:
     * politeness, questioningStructure, thoroughness, empathy, correctDiagnosis.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "criterion_notes", columnDefinition = "jsonb")
    private Map<String, String> criterionNotes;

    /**
     * Pivotal turns extracted from the dialogue: each entry has turn index, kind (good/warn),
     * text, and a short tag. Stored as a free-form list of maps to keep the schema flexible.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "key_turns", columnDefinition = "jsonb")
    private List<Map<String, Object>> keyTurns;

    /**
     * Items the LLM judged the doctor missed during the interview.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "missed_findings", columnDefinition = "jsonb")
    private List<String> missedFindings;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

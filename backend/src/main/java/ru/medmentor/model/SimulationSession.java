package ru.medmentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "simulation_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(name = "case_id", nullable = false)
    private String caseId;

    @Column(name = "selected_diagnosis")
    private String selectedDiagnosis;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SimulationState state;

    @Enumerated(EnumType.STRING)
    @Column(name = "opening_status", nullable = false, length = 32)
    private OpeningStatus openingStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "shuffled_diagnosis_options", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private List<String> shuffledDiagnosisOptions = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        final LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (shuffledDiagnosisOptions == null) {
            shuffledDiagnosisOptions = new ArrayList<>();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
        if (shuffledDiagnosisOptions == null) {
            shuffledDiagnosisOptions = new ArrayList<>();
        }
    }
}

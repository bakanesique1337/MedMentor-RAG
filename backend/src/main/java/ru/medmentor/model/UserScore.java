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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private SimulationSession session;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal politeness;

    @Column(name = "questioning_structure", nullable = false, precision = 3, scale = 2)
    private BigDecimal questioningStructure;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal thoroughness;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal empathy;

    @Column(name = "diagnosis_correct", nullable = false, precision = 3, scale = 2)
    private BigDecimal diagnosisCorrect;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

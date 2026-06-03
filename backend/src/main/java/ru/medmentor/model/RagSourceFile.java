package ru.medmentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "rag_source_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RagSourceFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_path", nullable = false, unique = true, length = 1024)
    private String sourcePath;

    @Column(name = "content_hash", nullable = false, length = 128)
    private String contentHash;

    @Column(name = "last_modified_epoch_ms", nullable = false)
    private Long lastModifiedEpochMs;

    @Column(name = "chunk_ids", nullable = false, columnDefinition = "TEXT")
    private String chunkIds;

    @Column(name = "chunk_count", nullable = false)
    private Integer chunkCount;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void touch() {
        updatedAt = LocalDateTime.now();
    }
}

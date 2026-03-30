package ru.medmentor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.medmentor.model.RagSourceFile;

import java.util.Optional;

public interface RagSourceFileRepository extends JpaRepository<RagSourceFile, Long> {

    Optional<RagSourceFile> findBySourcePath(String sourcePath);
}

package ru.medmentor.service;

import ru.medmentor.model.MedicalCase;

import java.util.List;

public interface CaseLoaderService {

    List<MedicalCase> getCases();

    List<MedicalCase> getCasesByCategory(String category);

    MedicalCase getCaseById(String caseId);
}

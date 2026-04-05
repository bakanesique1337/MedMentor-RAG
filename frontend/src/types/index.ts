export interface AuthLoginRequest {
    username: string;
    password: string;
}

export interface AuthUser {
    username: string;
    displayName: string;
    authenticated: boolean;
}

export interface CaseCard {
    id: string;
    category: string;
    title: string;
    difficulty: string;
    tags: string[];
    patientName: string;
    patientAge: number;
    patientSex: string;
    patientBrief: string;
}

export interface ConversationMessage {
    id: number;
    role: string;
    content: string;
    messageOrder: number;
    timestamp: string;
}

export interface Score {
    politeness: number | null;
    questioningStructure: number | null;
    thoroughness: number | null;
    empathy: number | null;
    diagnosisCorrect: number | null;
    createdAt: string;
}

export interface Result {
    summary: string;
    createdAt: string;
}

export interface StreamingStatus {
    inFlight: boolean;
    type: string;
}

export interface SimulationSession {
    id: number;
    caseId: string;
    caseTitle: string;
    patientName: string;
    state: string;
    openingStatus: string;
    diagnosisOptions: string[];
    selectedDiagnosis: string | null;
    messages: ConversationMessage[];
    streamingStatus: StreamingStatus | null;
    score: Score | null;
    result: Result | null;
    createdAt: string;
    updatedAt: string;
}

export interface SimulationCommandResponse {
    sessionId: number;
    status: string;
}

export interface ActiveSimulation {
    id: number;
    caseId: string;
    caseTitle: string;
    patientName: string;
    state: string;
    openingStatus: string;
    updatedAt: string;
}

export interface UserSettings {
    username: string;
    displayName: string;
    settings: Record<string, unknown>;
}

export interface UpdateUserSettingsRequest {
    displayName: string;
    settings: Record<string, unknown>;
}

export interface SimulationStatsOverview {
    completedSessions: number;
    averagePoliteness: number | null;
    averageQuestioningStructure: number | null;
    averageThoroughness: number | null;
    averageEmpathy: number | null;
    averageDiagnosisCorrect: number | null;
}

export interface HistorySession {
    id: number;
    caseId: string;
    caseTitle: string;
    patientName: string;
    state: string;
    score: Score | null;
    result: Result | null;
    createdAt: string;
    updatedAt: string;
}

export interface ApiError {
    error: string;
    status: number;
    fieldErrors?: Record<string, string>;
}

/**
 * Checks whether an unknown value matches the shared API error shape.
 */
export function isApiError(value: unknown): value is ApiError {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    const candidate = value as Record<string, unknown>
    const fieldErrors = candidate.fieldErrors
    const hasValidFieldErrors = fieldErrors === undefined || isStringRecord(fieldErrors)

    return typeof candidate.error === 'string'
        && typeof candidate.status === 'number'
        && hasValidFieldErrors
}

/**
 * Checks whether an unknown value matches an active simulation payload.
 */
export function isActiveSimulation(value: unknown): value is ActiveSimulation {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    const candidate = value as Record<string, unknown>

    return typeof candidate.id === 'number'
        && typeof candidate.caseId === 'string'
        && typeof candidate.caseTitle === 'string'
        && typeof candidate.patientName === 'string'
        && typeof candidate.state === 'string'
        && typeof candidate.openingStatus === 'string'
        && typeof candidate.updatedAt === 'string'
}

/**
 * Validates that a value is a string-keyed record of string values.
 */
function isStringRecord(value: unknown): value is Record<string, string> {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    return Object.values(value).every((entry) => typeof entry === 'string')
}

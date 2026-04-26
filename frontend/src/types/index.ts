export interface AuthLoginRequest {
    username: string;
    password: string;
}

export type SimulationState =
    | 'CASE_BROWSE'
    | 'CASE_SELECTED'
    | 'CASE_STARTED'
    | 'IN_PROGRESS'
    | 'DIAGNOSIS_SELECT'
    | 'SCORING'
    | 'COMPLETED'
    | 'ABANDONED'

export type OpeningStatus =
    | 'OPENING_PENDING'
    | 'OPENING_STREAMING'
    | 'OPENING_READY'
    | 'OPENING_FAILED'

export type MessageRole = 'SYSTEM' | 'DOCTOR' | 'PATIENT'

export type StreamingStatusType = 'opening' | 'message' | 'idle'

export type StreamChunkType = 'chunk' | 'done' | 'error'

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
    role: MessageRole;
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
    totalScore: number | null;
    createdAt: string;
}

export interface CriterionNotes {
    politeness: string | null;
    questioningStructure: string | null;
    thoroughness: string | null;
    empathy: string | null;
    correctDiagnosis: string | null;
}

export interface KeyTurn {
    turn: number;
    kind: 'good' | 'warn';
    text: string;
    tag: string;
}

export interface Result {
    summary: string;
    criterionNotes: CriterionNotes | null;
    keyTurns: KeyTurn[];
    missedFindings: string[];
    createdAt: string;
}

export interface StreamingStatus {
    inFlight: boolean;
    type: StreamingStatusType;
}

export interface StreamChunk {
    conversationId: string;
    content?: string | null;
    type: StreamChunkType;
    error?: string | null;
    timestamp: number;
}

export interface PatientPassport {
    heightCm: number;
    weightKg: number;
    allergies: string;
    chronicConditions: string;
    smoking: string;
}

export interface PatientVitals {
    heartRate: number;
    bloodPressure: string;
    respiratoryRate: number;
    spo2: number;
    temperatureC: number;
}

export interface SimulationSession {
    id: number;
    caseId: string;
    caseTitle: string;
    caseCategory: string;
    caseDifficulty: string;
    patientName: string;
    patientAge: number;
    patientSex: string;
    state: SimulationState;
    openingStatus: OpeningStatus;
    diagnosisOptions: string[];
    selectedDiagnosis: string | null;
    selectedDiagnosisRationale: string | null;
    selectedDiagnosisConfidence: number | null;
    correctDiagnosis: string | null;
    messages: ConversationMessage[];
    streamingStatus: StreamingStatus;
    examRevealed: boolean;
    passport: PatientPassport | null;
    vitals: PatientVitals | null;
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
    state: SimulationState;
    openingStatus: OpeningStatus;
    updatedAt: string;
}

export type ProfileRole = 'Студент' | 'Ординатор' | 'Врач' | 'Преподаватель';

export type AvatarVariant = 'teal' | 'sand' | 'rose' | 'violet' | 'mint' | 'sky';

export interface UserSettings {
    username: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    role: ProfileRole | null;
    course: string | null;
    faculty: string | null;
    university: string | null;
    avatarVariant: AvatarVariant | null;
    settings: Record<string, unknown>;
}

export interface UpdateUserSettingsRequest {
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    role: ProfileRole | null;
    course: string | null;
    faculty: string | null;
    university: string | null;
    avatarVariant: AvatarVariant | null;
    settings: Record<string, unknown>;
}

export interface SimulationStatsOverview {
    completedSessions: number;
    averagePoliteness: number | null;
    averageQuestioningStructure: number | null;
    averageThoroughness: number | null;
    averageEmpathy: number | null;
    averageDiagnosisCorrect: number | null;
    averageTotalScore: number | null;
}

export interface HistorySession {
    id: number;
    caseId: string;
    caseTitle: string;
    caseCategory: string;
    patientName: string;
    state: SimulationState;
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

const SIMULATION_STATES = new Set<string>([
    'CASE_BROWSE',
    'CASE_SELECTED',
    'CASE_STARTED',
    'IN_PROGRESS',
    'DIAGNOSIS_SELECT',
    'SCORING',
    'COMPLETED',
    'ABANDONED',
])

const OPENING_STATUSES = new Set<string>([
    'OPENING_PENDING',
    'OPENING_STREAMING',
    'OPENING_READY',
    'OPENING_FAILED',
])

const STREAMING_STATUS_TYPES = new Set<string>([
    'opening',
    'message',
    'idle',
])

const STREAM_CHUNK_TYPES = new Set<string>([
    'chunk',
    'done',
    'error',
])

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
        && isSimulationState(candidate.state)
        && isOpeningStatus(candidate.openingStatus)
        && typeof candidate.updatedAt === 'string'
}

/**
 * Checks whether an unknown value matches a simulation stream chunk.
 */
export function isStreamChunk(value: unknown): value is StreamChunk {
    if (typeof value !== 'object' || value === null) {
        return false
    }

    const candidate = value as Record<string, unknown>
    const content = candidate.content
    const error = candidate.error

    // Backend serializes absent fields as JSON null (no @JsonInclude), so null
    // must be accepted alongside undefined for optional fields.
    return typeof candidate.conversationId === 'string'
        && (typeof content === 'string' || content === undefined || content === null)
        && isStreamChunkType(candidate.type)
        && (typeof error === 'string' || error === undefined || error === null)
        && typeof candidate.timestamp === 'number'
}

/**
 * Validates backend simulation state enum values.
 */
export function isSimulationState(value: unknown): value is SimulationState {
    return typeof value === 'string' && SIMULATION_STATES.has(value)
}

/**
 * Validates backend opening status enum values.
 */
export function isOpeningStatus(value: unknown): value is OpeningStatus {
    return typeof value === 'string' && OPENING_STATUSES.has(value)
}

/**
 * Validates frontend stream status values.
 */
export function isStreamingStatusType(value: unknown): value is StreamingStatusType {
    return typeof value === 'string' && STREAMING_STATUS_TYPES.has(value)
}

/**
 * Validates simulation chunk event names.
 */
export function isStreamChunkType(value: unknown): value is StreamChunkType {
    return typeof value === 'string' && STREAM_CHUNK_TYPES.has(value)
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

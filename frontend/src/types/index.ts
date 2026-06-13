import type {Ref} from 'vue'

export interface AuthLoginRequest {
    username: string;
    password: string;
}

/**
 * Состояние симуляции
 */
export type SimulationState =
    | 'CASE_BROWSE'
    | 'CASE_SELECTED'
    | 'CASE_STARTED'
    | 'IN_PROGRESS'
    | 'DIAGNOSIS_SELECT'
    | 'SCORING'
    | 'COMPLETED'
    | 'ABANDONED'

export const SIMULATION_STATE = {
    CASE_BROWSE: 'CASE_BROWSE',
    CASE_SELECTED: 'CASE_SELECTED',
    CASE_STARTED: 'CASE_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    DIAGNOSIS_SELECT: 'DIAGNOSIS_SELECT',
    SCORING: 'SCORING',
    COMPLETED: 'COMPLETED',
    ABANDONED: 'ABANDONED',
} as const satisfies Record<string, SimulationState>

export type OpeningStatus =
    | 'OPENING_PENDING'
    | 'OPENING_STREAMING'
    | 'OPENING_READY'
    | 'OPENING_FAILED'

export const OPENING_STATUS = {
    PENDING: 'OPENING_PENDING',
    STREAMING: 'OPENING_STREAMING',
    READY: 'OPENING_READY',
    FAILED: 'OPENING_FAILED',
} as const satisfies Record<string, OpeningStatus>

export type SimulationCommandStatus =
    | 'OPENING_STARTED'
    | 'REPLY_STARTED'
    | 'FINDING_STARTED'
    | 'SYSTEM_STARTED'
    | 'ABANDONED'

export const SIMULATION_COMMAND_STATUS = {
    OPENING_STARTED: 'OPENING_STARTED',
    REPLY_STARTED: 'REPLY_STARTED',
    FINDING_STARTED: 'FINDING_STARTED',
    SYSTEM_STARTED: 'SYSTEM_STARTED',
    ABANDONED: 'ABANDONED',
} as const satisfies Record<string, SimulationCommandStatus>

export type MessageRole = 'SYSTEM' | 'DOCTOR' | 'PATIENT' | 'MENTOR'

export const MESSAGE_ROLE = {
    SYSTEM: 'SYSTEM',
    DOCTOR: 'DOCTOR',
    PATIENT: 'PATIENT',
    MENTOR: 'MENTOR',
} as const satisfies Record<string, MessageRole>

/**
 * Уровень сложности клинического кейса.
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export const DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
} as const satisfies Record<string, DifficultyLevel>

/**
 * Sentinel для UI-фильтра "все уровни"
 */
export const ALL_DIFFICULTIES = 'all' as const

export type DifficultyFilterValue = DifficultyLevel | typeof ALL_DIFFICULTIES

interface DifficultyPreset {
    label: string
    dotCount: 1 | 2 | 3
}

/**
 * Общие для всего UI атрибуты уровня сложности: человекочитаемая метка и
 * количество точек-маркеров (1..3).
 */
export const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultyPreset> = {
    easy: {label: 'Лёгкий', dotCount: 1},
    medium: {label: 'Средний', dotCount: 2},
    hard: {label: 'Сложный', dotCount: 3},
}

export type StreamingStatusType = 'opening' | 'message' | 'finding' | 'system' | 'idle'

export const STREAMING_STATUS_TYPE = {
    OPENING: 'opening',
    MESSAGE: 'message',
    FINDING: 'finding',
    SYSTEM: 'system',
    IDLE: 'idle',
} as const satisfies Record<string, StreamingStatusType>

export type StreamChunkType = 'chunk' | 'done' | 'warning' | 'error'

export const STREAM_CHUNK_TYPE = {
    CHUNK: 'chunk',
    DONE: 'done',
    WARNING: 'warning',
    ERROR: 'error',
} as const satisfies Record<string, StreamChunkType>

/**
 * Сужение StreamingStatusType до тех типов, которые могут быть "активными",
 * то есть пользователь сейчас видит идущий стрим этого вида. 'idle' исключён —
 * это псевдо-значение для "стрима нет".
 */
export type ActiveStreamKind = Exclude<StreamingStatusType, 'idle'>

/**
 * Состояние транспорта WebSocket-сокета. Отражает только сетевой уровень.
 */
export type SocketStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error'

/**
 * Публичный API сокета симуляции.
 */
export interface SimulationSocket {
    connect: (sessionId: number) => void
    disconnect: () => void
    reconnect: () => void
    onChunk: (handler: (chunk: StreamChunk) => void) => () => void
    status: Ref<SocketStatus>
    error: Ref<ApiError | null>
    lastChunk: Ref<StreamChunk | null>
}

/**
 * Публичный API стрим-композабла. Используется в useChatActions, чтобы передавать
 * стрим параметром, не импортируя сам composable как тип.
 */
export interface SimulationStream {
    streamingContent: Ref<string>
    pendingSentMessage: Ref<string | null>
    activeStreamKind: Ref<ActiveStreamKind | null>
    streamErrorMessage: Ref<string | null>
    beginStream: (kind: ActiveStreamKind) => void
    resetBuffers: () => void
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
    difficulty: DifficultyLevel;
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
    diagnosisMatch: boolean | null;
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
    caseDifficulty: DifficultyLevel;
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
    status: SimulationCommandStatus;
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

/**
 * Конфигурация приложения
 */
export interface AppConfig {
    provider: string;
    model: string;
}

# MedMentor-RAG

Тренажёр клинического мышления для медицинских специалистов. Система симулирует диалог с виртуальным пациентом, ведёт
нарратив физикального осмотра и автоматически оценивает работу врача-обучающегося. Все генеративные подсистемы построены
поверх **модульной RAG-архитектуры**: каждая функция собирает собственный запрос в векторное хранилище клинических
рекомендаций и подмешивает релевантные фрагменты в LLM-промпт.

---

## 1. Технологический стек

| Слой                      | Технология                                                           |
|---------------------------|----------------------------------------------------------------------|
| Frontend                  | Vue 3 + TypeScript + Vite + Pinia + Tailwind                         |
| Транспорт (стриминг)      | STOMP over WebSocket (SockJS)                                        |
| Backend                   | Spring Boot 3 (Java), Spring AI                                      |
| LLM (генеративная модель) | Google Gemini 3.1 Flash Lite (через Spring AI)                       |
| Embedding-модель          | Ollama BGE-M3 (1024-мерные эмбеддинги)                               |
| Векторное хранилище       | PostgreSQL + расширение `pgvector` (индекс HNSW, косинусная метрика) |
| Контейнеризация           | Docker Compose (backend + Postgres/pgvector + Ollama)                |

---

## 2. Модульная RAG-архитектура

Ядром системы является сервис `SimulationAiServiceImpl` (
`backend/src/main/java/ru/medmentor/service/SimulationAiServiceImpl.java`), который инкапсулирует **четыре функционально
независимых модуля**. Все модули:

- работают с одним общим векторным хранилищем (`pgvector`);
- разделяют единый системный промпт (`global-system.txt`) и общий `ChatClient`;
- но **каждый формирует собственный embedding-запрос, собственный prompt-шаблон и собственный «срез» данных кейса**,
  который попадает в LLM.

Именно это разделение делает архитектуру модульной RAG, а не монолитным RAG-пайплайном.

### 2.1. Модуль ① — Открытие диалога (*Session Opening*)

| Свойство        | Значение                                                           |
|-----------------|--------------------------------------------------------------------|
| Метод           | `generateOpeningMessage` / `streamOpeningMessage`                  |
| Промпт          | `prompts/session-opening.txt` + `prompts/patient-role.txt`         |
| Видимость кейса | `formatCaseForPatient` — без объективного осмотра и инструменталки |
| RAG-запрос      | `buildOpeningRagQuery` — жалоба + симптомы + анамнез               |

**Назначение.** Сгенерировать первое сообщение пациента: предъявить врачу основную жалобу естественным языком, не
раскрывая ни диагноза, ни «осмотровых» данных.

### 2.2. Модуль ② — Ответ пациента (*Patient Reply*)

| Свойство        | Значение                                                                                |
|-----------------|-----------------------------------------------------------------------------------------|
| Метод           | `generatePatientReply` / `streamPatientReply`                                           |
| Промпт          | `prompts/patient-role.txt`                                                              |
| Видимость кейса | `formatCaseForPatient` (та же ограниченная)                                             |
| RAG-запрос      | `buildReplyRagQuery` — симптомы + анамнез + последнее сообщение врача + история диалога |

**Назначение.** Поддерживать роль пациента в диалоге: отвечать на вопросы врача в рамках субъективной картины, не
«выдавая» ни ЭКГ, ни лабораторных значений, ни правильного диагноза.

### 2.3. Модуль ③ — Нарратор осмотра (*Examination Finding*)

| Свойство        | Значение                                                                                                           |
|-----------------|--------------------------------------------------------------------------------------------------------------------|
| Метод           | `streamExaminationFinding`                                                                                         |
| Промпт          | `prompts/examination-finding.txt`                                                                                  |
| Видимость кейса | `formatCaseForExamFinding` — раскрывает объективные находки и инструментальные данные, но всё ещё скрывает диагноз |
| RAG-запрос      | `buildExaminationFindingRagQuery` — манёвр врача + симптомы + анамнез + диалог                                     |

**Назначение.** Когда врач запрашивает физикальное обследование или инструментальное исследование (аускультация,
пальпация, ЭКГ и т.д.), модуль выступает как объективный «нарратор» — описывает находки от третьего лица, опираясь на
данные кейса, которые пациенту знать неоткуда.

### 2.4. Модуль ④ — Автоматическая оценка (*Score Review*)

| Свойство        | Значение                                                                                           |
|-----------------|----------------------------------------------------------------------------------------------------|
| Метод           | `generateScoreReview`                                                                              |
| Промпт          | `prompts/score-review.txt`                                                                         |
| Видимость кейса | `formatCaseForReview` — **полная истина**: правильный диагноз, дифдиагнозы, все данные             |
| RAG-запрос      | `buildScoreRagQuery` — симптомы + анамнез + выбранный диагноз + правильный диагноз + полный диалог |
| Формат вывода   | Структурированный JSON (`ScoreReviewPayload`)                                                      |

**Назначение.** После завершения сессии модуль получает полный транскрипт диалога, выбранный врачом диагноз с
обоснованием и уверенностью, и формирует структурированную оценку: численный балл, текстовое резюме, ссылки на ключевые
реплики (`keyTurns` с индексами реплик врача, проставленными в промпте).

### 2.5. Сводная таблица модулей

| # | Модуль                | Промпт                                     | Срез данных кейса      | RAG-query builder                 |
|---|-----------------------|--------------------------------------------|------------------------|-----------------------------------|
| ① | Открытие диалога      | `session-opening.txt` + `patient-role.txt` | patient                | `buildOpeningRagQuery`            |
| ② | Ответ пациента        | `patient-role.txt`                         | patient                | `buildReplyRagQuery`              |
| ③ | Нарратор осмотра      | `examination-finding.txt`                  | exam (объективный)     | `buildExaminationFindingRagQuery` |
| ④ | Автоматическая оценка | `score-review.txt`                         | review (полная истина) | `buildScoreRagQuery`              |

Все четыре модуля вызывают `ragSearchService.buildPromptContext(promptKind, query)` и подмешивают результат в LLM-промпт
секцией `Relevant clinical recommendations`.

---

## 3. RAG-пайплайн

### 3.1. Индексация (offline / фоновая)

```
rag-data/*.md
      │
      ▼
RagSourceParserService     ── приведение к чистому тексту
      │
      ▼
RagChunkingService         ── разбиение по \n / пунктуации
      │                         (chunk-size = 1200, overlap = 200)
      ▼
Ollama BGE-M3 (embedding)  ── 1024-мерные векторы
      │
      ▼
pgvector (HNSW, COSINE)    ── persistent vector store
```

Сервис `RagIngestionService` запускает синхронизацию:

- **на старте приложения** (`@EventListener(ApplicationReadyEvent.class)`);
- **периодически** (`@Scheduled`, по умолчанию каждые 5 минут);
- **по требованию** через `RagController` (ручной триггер).

Состояние индекса хранится в таблице `rag_source_files` (модель `RagSourceFile`). Для каждого файла сохраняются SHA-256
хеш и список UUID чанков. При повторной синхронизации:

- неизменные файлы пропускаются (`isUnchanged` по хешу и mtime);
- изменённые — старые чанки удаляются из векторного хранилища и переиндексируются;
- удалённые из `rag-data/` — вычищаются из индекса.

### 3.2. Извлечение (online, на каждый ход)

`RagSearchService` принимает запрос модуля, обрезает его до `max-query-chars` (1500), выполняет `similaritySearch` в
pgvector с порогом `similarity-threshold = 0.6` и `top-K = 5`, и собирает результат в виде prompt-секции с метаданными
`[source=... chunk=...]`.

Ключевая особенность — **взвешивание диагноза в embedding-запросе** (`buildDiagnosisRagHeader`): строка с правильным
диагнозом повторяется N раз (`diagnosis-query-weight`, по умолчанию 2) в начале query-строки. Это сдвигает плотный
embedding запроса в сторону релевантных клиническому диагнозу фрагментов корпуса, не раскрывая сам диагноз LLM (header
участвует только в построении вектора и не попадает в LLM-промпт).

### 3.3. Параметры RAG (`application.properties`)

| Параметр                                       | Значение        | Назначение                            |
|------------------------------------------------|-----------------|---------------------------------------|
| `medmentor.rag.chunk-size`                     | 1200            | Размер чанка в символах               |
| `medmentor.rag.chunk-overlap`                  | 200             | Перекрытие соседних чанков            |
| `medmentor.rag.min-chunk-size`                 | 120             | Минимальный остаточный чанк           |
| `medmentor.rag.top-k`                          | 5               | Количество чанков на запрос           |
| `medmentor.rag.similarity-threshold`           | 0.6             | Порог косинусной близости             |
| `medmentor.rag.max-chunk-chars-for-prompt`     | 700             | Обрезка чанка перед подачей в LLM     |
| `medmentor.rag.max-query-chars`                | 1500            | Обрезка запроса для embedding         |
| `medmentor.rag.diagnosis-query-weight`         | 2               | Кратность повторения диагноза в query |
| `medmentor.rag.sync-interval-ms`               | 300000          | Период фоновой синхронизации (мс)     |
| `spring.ai.vectorstore.pgvector.dimensions`    | 1024            | Размерность embedding-вектора         |
| `spring.ai.vectorstore.pgvector.index-type`    | HNSW            | Индекс векторного хранилища           |
| `spring.ai.vectorstore.pgvector.distance-type` | COSINE_DISTANCE | Метрика близости                      |

---

## 4. Сборка промпта (на примере модуля)

Для каждого модуля промпт собирается единым билдером `LlmPrompt.builder()`:

```text
LlmPrompt = [
   system:   global-system.txt                       ← общая роль
   system:   <module-specific>.txt                   ← роль модуля
   section:  Case data           = formatCaseFor*    ← срез кейса
   section:  Relevant clinical
             recommendations     = ragContext        ← RAG-вставка
   section:  Conversation so far = <история>         ← (если есть)
   section:  Latest doctor msg   = <реплика>         ← (если есть)
]
```

Три функции форматирования кейса — `formatCaseForPatient`, `formatCaseForExamFinding`, `formatCaseForReview` — реализуют
**строгое разграничение видимости данных** между модулями: правильный диагноз и инструментальные находки не утекают в
модули диалога. Разделение симптомов и анамнеза на «субъективные/объективные» и «анамнестические/инструментальные»
выполняется по префиксам (`splitFacts`, шаблоны `OBJECTIVE_SYMPTOM_PREFIX`, `INSTRUMENTAL_HISTORY_PREFIX`).

---

## 5. Структура репозитория

```text
MedMentor-RAG/
├── backend/                          # Spring Boot — оркестрация, RAG, AI
│   ├── src/main/java/ru/medmentor/
│   │   ├── controller/               # REST + WebSocket контроллеры
│   │   ├── service/
│   │   │   ├── SimulationAiServiceImpl.java       ← 4 модуля
│   │   │   ├── SimulationStreamingServiceImpl.java
│   │   │   ├── RagSourceParserService.java        ← парсинг источников
│   │   │   ├── RagChunkingService.java            ← чанкирование
│   │   │   ├── RagIngestionService.java           ← индексация
│   │   │   ├── RagSearchService.java              ← retrieval
│   │   │   └── ClasspathPromptTemplateService.java
│   │   ├── model/                    # MedicalCase, ConversationMessage, RagSourceFile
│   │   ├── repository/               # JPA-репозитории
│   │   └── config/                   # AiProperties, RagProperties
│   └── src/main/resources/
│       ├── prompts/
│       │   ├── global-system.txt
│       │   ├── patient-role.txt
│       │   ├── session-opening.txt
│       │   ├── examination-finding.txt
│       │   └── score-review.txt 
│       ├── application.properties
│       └── schema.sql
├── frontend/                         # Vue 3 + TS + Pinia
├── cases/                            # клинические сценарии (JSON)
│   ├── cardiology/  gastroenterology/  infections/
│   ├── case.schema.json
│   └── AUTHORING.md
├── rag-data/                         # корпус для RAG (.md)
│   ├── hypertension.md  angina_pectoris.md  ...
│   └── (клинические рекомендации)
├── docker-compose.yml                # backend + postgres-pgvector + ollama
└── .env.example
```

---

## 6. Запуск

Проект разворачивается одной командой Docker Compose — на хосте достаточно Docker:

```bash
cp .env.example .env
# заполнить GEMINI_API_KEY в .env
docker compose up --build
```

После старта:

- backend доступен на `http://localhost:8080`;
- Postgres с расширением `pgvector` — на `:5432`;
- Ollama (embeddings) — на `:11434`;
- индексация `rag-data/` запускается автоматически и далее обновляется по расписанию.

Детали API и операционные параметры backend описаны в `backend/README.md`.
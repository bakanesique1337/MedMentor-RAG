# MedMentor-RAG — Backend

Медицинское учебное приложение, в котором врачи отрабатывают диагностику: ИИ играет роль пациента,
а врач должен поставить диагноз за ограниченное число сообщений.

## Структура проекта

```text
backend/
├── src/main/java/ru/medmentor/
│   ├── config/              # Spring-конфигурация (security, AI, websocket, properties)
│   ├── controller/          # REST/WebSocket контроллеры (симуляция, auth, RAG и т.д.)
│   ├── dto/                 # Request/response DTO
│   ├── model/               # JPA-сущности + доменные модели
│   ├── repository/          # Spring Data репозитории
│   └── service/             # Бизнес-логика, оркестрация AI, стриминг, RAG-пайплайн
├── src/main/resources/
│   ├── application.properties             # Основной конфиг (профиль по умолчанию — Gemini)
│   ├── application-ollama.properties      # Профиль "ollama" — локальный чат через Ollama
│   ├── prompts/             # Шаблоны промптов (роль пациента, открытие, скоринг)
│   └── schema.sql
├── src/test/                # Unit + web-layer тесты
├── build.gradle
└── README.md
```

### RAG-модули в бэкенде

- `src/main/java/ru/medmentor/service/RagIngestionService.java`  
  Оркестрация синхронизации индекса: стартовая, по расписанию и ручная.
- `src/main/java/ru/medmentor/service/RagSourceParserService.java`  
  Парсинг поддерживаемых форматов исходников.
- `src/main/java/ru/medmentor/service/RagChunkingService.java`  
  Разбиение текста на чанки перед эмбеддингом.
- `src/main/java/ru/medmentor/service/RagSearchService.java`  
  Similarity-поиск и сборка prompt-контекста.
- `src/main/java/ru/medmentor/controller/RagController.java`  
  Защищённые REST-эндпоинты RAG.
- `src/main/java/ru/medmentor/model/RagSourceFile.java` и
  `src/main/java/ru/medmentor/repository/RagSourceFileRepository.java`  
  Хранение состояния инкрементальной индексации.

## Текущий статус

Базовый бэкенд симуляции реализован:
- API авторизации и сценария симуляции;
- ИИ-пациент и автоматическая оценка;
- RAG-пайплайн с поиском по pgvector;
- два чат-провайдера: облачный Google Gemini (по умолчанию) и локальный Ollama (профиль `ollama`).

## Технологический стек

- **Бэкенд:** Spring Boot 3.5.10-SNAPSHOT
- **AI-интеграция:** Spring AI 1.1.2
- **LLM (по умолчанию):** Google Gemini (`gemini-3.1-flash-lite-preview`)
- **LLM (профиль `ollama`):** локальный Ollama (по умолчанию `qwen2.5:7b`)
- **Эмбеддинги:** Ollama с `bge-m3` (1024 измерения)
- **База данных:** PostgreSQL 16 + расширение pgvector
- **WebSocket:** STOMP поверх WebSocket с SockJS-фолбэком
- **API-документация:** Swagger/OpenAPI (springdoc-openapi)
- **Язык:** Java 25
- **Сборка:** Gradle
- **Контейнеризация:** Docker и Docker Compose

## Предварительные требования

- Установленные Docker и Docker Compose;
- API-ключ Google Gemini (получить можно на https://makersuite.google.com/app/apikey,
  бесплатный тариф доступен) — **только** если планируется запуск с дефолтным Gemini-профилем;
- Установленный Ollama локально или контейнером — если планируется запуск с локальным LLM;
- Java 25 — для локальной разработки без Docker.

## Переменные окружения

Скопируйте `.env.example` в `.env` и задайте нужные значения:

```bash
cp .env.example .env
# Затем отредактируйте .env под свою конфигурацию (Gemini API key и/или профиль Ollama).
```

`docker compose` читает корневой `.env` для контейнеров `postgres-pgvector` и `backend`,
поэтому учётные данные БД, дефолтного пользователя и API-ключи живут в одном месте.

В этом же `.env` лежат значения локального single-user-бутстрапа:
`MEDMENTOR_DEFAULT_USERNAME`, `MEDMENTOR_DEFAULT_PASSWORD`, `MEDMENTOR_DEFAULT_DISPLAY_NAME`.
На старте бэкенд создаёт этого пользователя в БД (или загружает уже существующего, если
он был забутстрапен ранее).

Альтернативно переменные можно экспортировать напрямую:

```bash
export GEMINI_API_KEY=your_gemini_api_key_here
```

## Быстрый старт через Docker Compose

1. Клонируем репозиторий:
```bash
git clone <repository-url>
cd MedMentor-RAG
```

2. Прописываем ключ Gemini:
```bash
cp .env.example .env
# Отредактируйте .env и подставьте свой GEMINI_API_KEY.
```

3. Поднимаем сервисы:
```bash
docker compose up --build
```

Поднимутся:
- PostgreSQL с pgvector на порту 5432;
- Ollama (для эмбеддингов) на порту 11434;
- бэкенд приложения на порту 8080.

Локальный single-user-бутстрап:
- В `.env` лежит одна учётка локального врача — это аккаунт для разработки.
- На первом старте этот пользователь создаётся в PostgreSQL с указанным display name.
- На последующих стартах используется уже созданный пользователь — дубли не создаются.

4. Открываем приложение:
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **API-документация:** http://localhost:8080/api-docs
- **Health-check:** http://localhost:8080/actuator/health

## Запуск с локальным Ollama (профиль `ollama`)

В дефолтном профиле чат-модель — Google Gemini, а Ollama используется только для эмбеддингов.
Чтобы перевести и чат на локальный Ollama, активируйте профиль `ollama`. Эмбеддинги при этом
по-прежнему берутся из Ollama (никакой дополнительной настройки эмбеддингов не требуется).

### 1. Подготовка Ollama

Убедитесь, что Ollama запущен и нужная чат-модель скачана. Локально:

```bash
# Установите Ollama: https://ollama.com/download
ollama serve                       # запустить демона (если ещё не запущен)
ollama pull qwen2.5:7b             # скачать дефолтную чат-модель профиля
ollama pull bge-m3                 # модель для эмбеддингов (используется в любом профиле)
```

Если Ollama запущен в контейнере из `docker-compose.yml`, скачивание чат-модели можно
выполнить внутри контейнера:

```bash
docker compose up -d ollama
docker compose exec ollama ollama pull qwen2.5:7b
```

### 2. Локальный запуск бэкенда с профилем `ollama`

```bash
cd backend
export SPRING_PROFILES_ACTIVE=ollama
export SPRING_AI_OLLAMA_BASE_URL=http://localhost:11434   # если Ollama локальный
# (опционально) переопределить модель/температуру:
export MEDMENTOR_OLLAMA_CHAT_MODEL=qwen2.5:7b
export MEDMENTOR_OLLAMA_CHAT_TEMPERATURE=0.7
./gradlew bootRun
```

При активном профиле `ollama` переменная `GEMINI_API_KEY` не обязательна.

### 3. Запуск через Docker Compose с профилем `ollama`

В корневом `.env` раскомментируйте строки:

```dotenv
SPRING_PROFILES_ACTIVE=ollama
MEDMENTOR_OLLAMA_CHAT_MODEL=qwen2.5:7b
MEDMENTOR_OLLAMA_CHAT_TEMPERATURE=0.7
```

И поднимите стек как обычно:

```bash
docker compose up --build
```

Внутри контейнера бэкенд будет ходить за чатом по адресу `http://ollama:11434` (этот URL
уже прописан в `docker-compose.yml` через `SPRING_AI_OLLAMA_BASE_URL`).

### 4. Что именно делает профиль

Файл `src/main/resources/application-ollama.properties`:

- отключает автоконфигурацию Google Gemini, чтобы не требовать `GEMINI_API_KEY`;
- включает Ollama-чат через `spring.ai.model.chat=ollama`;
- задаёт `spring.ai.ollama.chat.options.model` и `temperature` (с переопределением через env);
- синхронизирует `medmentor.ai.provider` и `medmentor.ai.model`, чтобы корректно отображались
  в логах и метаданных;
- включает `DEBUG`-логи `org.springframework.ai.ollama`.

Чтобы посмотреть итоговый prompt, который реально получает модель, запустите Ollama-сервер с
`OLLAMA_DEBUG=1` — это единственное надёжное место с RAW HTTP body. Spring AI RestClient без
кастомного интерцептора тело запроса не логирует.

## Локальный запуск (только бэкенд)

Если удобнее держать БД в Docker, а бэкенд запускать локально:

1. Поднять только PostgreSQL:
```bash
docker compose up -d postgres-pgvector
```

2. (Опционально) поднять Ollama для эмбеддингов:
```bash
docker compose up -d ollama
```

3. Собрать и запустить бэкенд с Gemini:
```bash
cd backend
export GEMINI_API_KEY=your_gemini_api_key_here
./gradlew bootRun
```

или с локальным Ollama-чатом:
```bash
cd backend
export SPRING_PROFILES_ACTIVE=ollama
./gradlew bootRun
```

## Обзор API

Приложение предоставляет два способа взаимодействия с ИИ:
1. **REST API** — простая модель request/response (без стриминга);
2. **WebSocket** — стриминг ответов в реальном времени (рекомендуется для фронтенда).

### Вариант 1. REST API (без стриминга)

#### POST /api/ai — обработка запроса к ИИ

Отправить сообщение симулятору-пациенту и получить полный ответ.

**Запрос:**
```bash
curl -X POST http://localhost:8080/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "What symptoms are you experiencing?"
  }'
```

**Ответ:**
```json
{
  "aiMessage": "I've been feeling tired and have a persistent cough for the past week...",
  "requestId": "uuid-here",
  "timestamp": 1234567890
}
```

**HTTP-коды:**
- `200 OK` — успех;
- `400 Bad Request` — некорректный ввод (например, пустое сообщение);
- `500 Internal Server Error` — ошибка AI-сервиса.

### Вариант 2. WebSocket (стриминг — рекомендуемый)

WebSocket-эндпоинт обеспечивает потоковую передачу ответов ИИ по протоколу STOMP с
SockJS-фолбэком.

**WebSocket-эндпоинт:** `ws://localhost:8080/ws`

**Клиент шлёт в:** `/app/ai/chat`

**Клиент подписывается на:** `/topic/ai/{conversationId}`

#### Формат сообщений

**Запрос (отправляется в `/app/ai/chat`):**
```json
{
  "conversationId": "optional-conversation-id",
  "userMessage": "What symptoms are you experiencing?"
}
```

**Ответ (принимается на `/topic/ai/{conversationId}`):**
```json
{
  "conversationId": "conversation-id",
  "content": "I've been feeling...",
  "type": "chunk",
  "timestamp": 1234567890
}
```

**Типы сообщений:**
- `chunk` — очередной фрагмент текста от ИИ;
- `done` — поток успешно завершён;
- `error` — произошла ошибка.

#### Использование WebSocket из Vue.js-фронтенда

Установить STOMP-клиент:
```bash
npm install @stomp/stompjs sockjs-client
```

**Базовый пример подключения:**

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Подключение к WebSocket
const stompClient = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  onConnect: () => {
    console.log('Connected');

    // Подписка на ответы ИИ
    stompClient.subscribe(`/topic/ai/${conversationId}`, (message) => {
      const chunk = JSON.parse(message.body);

      if (chunk.type === 'chunk') {
        currentMessage += chunk.content;
      } else if (chunk.type === 'done') {
        console.log('Stream completed');
      }
    });
  }
});

stompClient.activate();

// Отправка сообщения
function sendMessage(text) {
  stompClient.publish({
    destination: '/app/ai/chat',
    body: JSON.stringify({
      conversationId: conversationId,
      userMessage: text
    })
  });
}
```

**Подробные примеры интеграции с Vue.js** (composables, обработка ошибок, реконнект) —
см. документацию фронтенда.

### Тестирование через Swagger UI

1. Откройте http://localhost:8080/swagger-ui.html
2. Разверните раздел "AI Chat".
3. Нажмите "Try it out" на `POST /api/ai`.
4. Подставьте тело запроса.
5. Нажмите "Execute".

**Внимание:** Swagger UI не поддерживает тестирование WebSocket. Используйте Vue.js-примеры
выше или инструменты вроде Postman/websocat.

### RAG-эндпоинты (с авторизацией)

Сначала логинимся (cookie-сессия):
```bash
curl -i -c /tmp/medmentor.cookies \
  -H "Content-Type: application/json" \
  -d '{"username":"doctor","password":"change_me"}' \
  http://localhost:8080/api/auth/login
```

Поиск по векторному индексу:
```bash
curl -b /tmp/medmentor.cookies \
  "http://localhost:8080/api/rag/search?query=heart%20failure%20dyspnea&topK=3"
```

Ручная переиндексация:
```bash
curl -X POST -b /tmp/medmentor.cookies \
  http://localhost:8080/api/rag/sync
```

Зачем эти эндпоинты:
- `GET /api/rag/search` — отладочная поверхность для проверки качества retrieval отдельно от
  генерации;
- `POST /api/rag/sync` — операционная ручка для немедленной переиндексации после массового
  обновления файлов, без ожидания фонового полла;
- оба помогают наблюдаемости и безопасному выкату новых файлов клинических рекомендаций.

## Структура репозитория (общая)

```
MedMentor-RAG/
├── backend/
│   ├── src/main/
│   │   ├── java/ru/medmentor/
│   │   │   ├── MedMentorRAGApplication.java
│   │   │   ├── config/          # Конфигурация (AI, WebSocket, OpenAPI)
│   │   │   ├── controller/      # REST- и WebSocket-контроллеры
│   │   │   ├── service/         # Бизнес-логика
│   │   │   ├── model/           # JPA-сущности
│   │   │   └── dto/             # Объекты передачи данных
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-ollama.properties
│   │       ├── schema.sql
│   │       └── logback-spring.xml
│   ├── build.gradle
│   ├── Dockerfile
│   └── logs/                    # Логи приложения (в .gitignore)
├── docker-compose.yml
├── data/                        # Данные PostgreSQL (в .gitignore)
└── README.md
```

## Конфигурация

Ключевые свойства в `application.properties`:

### База данных
```properties
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/medmentor}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:medmentor}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:medmentor123}
```

### LLM (Gemini, профиль по умолчанию)
```properties
spring.ai.google.genai.api-key=${GEMINI_API_KEY}
spring.ai.google.genai.chat.options.model=gemini-3.1-flash-lite-preview
spring.ai.google.genai.chat.options.temperature=0.7
spring.ai.google.genai.chat.options.max-output-tokens=2048
```

### LLM (Ollama, профиль `ollama`)

См. `application-ollama.properties`. Основные переопределения через env:
```bash
SPRING_PROFILES_ACTIVE=ollama
MEDMENTOR_OLLAMA_CHAT_MODEL=qwen2.5:7b
MEDMENTOR_OLLAMA_CHAT_TEMPERATURE=0.7
SPRING_AI_OLLAMA_BASE_URL=http://localhost:11434
```

### Эмбеддинги (Ollama)
```properties
spring.ai.ollama.base-url=${SPRING_AI_OLLAMA_BASE_URL:http://localhost:11434}
spring.ai.ollama.embedding.options.model=bge-m3
spring.ai.ollama.init.pull-model-strategy=when_missing
```

### Кастомная AI-конфигурация
```properties
medmentor.ai.provider=gemini
medmentor.ai.model=gemini-3.1-flash-lite-preview
medmentor.ai.system-prompt=You are a helpful medical AI assistant...
medmentor.ai.constant-context=
```

## Логирование

Логи пишутся одновременно в консоль и в файл:
- **Консоль:** логи в реальном времени;
- **Файл:** `backend/logs/medmentor-rag.log`;
- **Ротация:** ежедневно, история 30 дней, общий лимит 1 ГБ.

Каждый запрос сопровождается уникальным `requestId` — удобно для отладки.

## Health-checks

Поднимаются эндпоинты Spring Boot Actuator:

- **Health:** http://localhost:8080/actuator/health
- **Info:** http://localhost:8080/actuator/info

Health-check включает проверку соединения с БД.

## Схема БД

Приложение автоматически создаёт:
- таблицу `conversation_log` — журнал диалогов с ИИ;
- таблицу `rag_source_files` — состояние индексации файлов и идентификаторы чанков;
- расширение `pgvector` + таблицу `vector_store` для retrieval по эмбеддингам.

## Заметки для разработки

### Добавление постоянного контекста

К каждому запросу можно подмешивать константный контекст:
```properties
medmentor.ai.constant-context=You are simulating a patient with specific symptoms...
```

### Смена модели Gemini

Чтобы использовать другую модель Gemini:
```properties
spring.ai.google.genai.chat.options.model=gemini-3.1-pro-preview
medmentor.ai.model=gemini-3.1-pro-preview
```

### Смена модели Ollama

Любую модель из `ollama list` можно подставить через env-переменную:
```bash
export MEDMENTOR_OLLAMA_CHAT_MODEL=llama3.1:8b
SPRING_PROFILES_ACTIVE=ollama ./gradlew bootRun
```

### Отладка

Включить подробное логирование:
```properties
logging.level.ru.medmentor=DEBUG
logging.level.org.springframework.ai=DEBUG
```

Для профиля `ollama` отдельно полезно:
```properties
logging.level.org.springframework.ai.ollama=DEBUG
```
А итоговый prompt модели смотрите в логах самого Ollama-сервера, запущенного с
`OLLAMA_DEBUG=1`.

## Траблшутинг

### Проблемы с подключением к БД

1. Проверить, что PostgreSQL поднят:
```bash
docker compose ps
```

2. Посмотреть логи БД:
```bash
docker compose logs postgres-pgvector
```

### Проблемы с Gemini API

1. Проверьте, что `GEMINI_API_KEY` корректно задан в `.env`.
2. Поищите ошибки API в `backend/logs/medmentor-rag.log`.
3. Убедитесь, что квота не исчерпана (у Gemini есть бесплатный тариф).
4. Проверить ключ можно тут: https://makersuite.google.com/

### Проблемы с Ollama

1. Убедитесь, что контейнер/демон Ollama работает:
```bash
docker compose logs ollama
# или локально:
ollama list
```

2. Проверить доступность Ollama:
```bash
curl http://localhost:11434/api/tags
```

3. Если используется профиль `ollama`, проверьте, что нужная чат-модель скачана:
```bash
ollama list | grep qwen2.5
# при необходимости:
ollama pull qwen2.5:7b
```

4. Embedding-модель `bge-m3` скачается автоматически при первом запросе
   (стратегия `pull-model-strategy=when_missing`).

### Порт уже занят

Если порты 8080, 5432 или 11434 заняты, поправьте `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # сменить внешний порт
```

### Проблемы с WebSocket

1. Проверьте CORS-конфигурацию в `WebSocketConfig.java`.
2. Убедитесь, что SockJS-фолбэк работает (HTTP вместо WS).
3. Тест из консоли браузера: `new WebSocket('ws://localhost:8080/ws')`.

## Дальнейшее развитие

- **Phase 4:** функциональность тестирования по клиническим кейсам;
- **Phase 5:** Vue.js-фронтенд с чат-интерфейсом.

## Лицензия

[Укажите лицензию]

## Контрибьютинг

[Укажите правила контрибьютинга]

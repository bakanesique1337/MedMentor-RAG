/**
 * Базовый URL REST- и WebSocket-эндпоинтов бэкенда.
 *
 * По умолчанию пустая строка: и REST, и SockJS строят запросы относительно
 * текущего origin. Это позволяет одному и тому же бандлу работать через любой
 * single-port reverse proxy (Vite dev `server.proxy`, docker-compose, ngrok)
 * без перенастройки фронта и без CORS, потому что браузер видит запросы
 * как same-origin.
 *
 * Переопределять только когда фронтенд раздаётся с другого origin, чем бэкенд
 * (например, статический хостинг + отдельный API-домен). В таком случае
 * адреса в `MEDMENTOR_ALLOWED_ORIGINS` бэкенда должны включать origin фронта.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

/**
 * Таймаут HTTP-запросов в миллисекундах.
 */
export const REQUEST_TIMEOUT_MS = 15000

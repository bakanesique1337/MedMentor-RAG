# Project Structure

```
src/                                                                                                                                                                                             
  ├── router/     
  │   └── index.ts
  │
  ├── stores/                 # Pinia stores
  │   ├── session.ts                                                                                                                                                                               
  │   └── messages.ts
  │                                                                                                                                                                                                
  ├── composables/            # useXxx — бизнес-логика и переиспользуемое поведение
  │   ├── useSession.ts                                                                                                                                                                            
  │   ├── useChat.ts
  │   └── useApi.ts                                                                                                                                                                                
  │               
  ├── components/             # Переиспользуемые "немые" компоненты
  │   ├── ui/                 # VButton, VInput, VBadge...
  │   ├── common/             # MessageBubble, LoadingSpinner...
  │   └── layout/
  │      ├── TheHeader/      # TheHeader + дочерние компоненты
  │      ├── TheFooter/
  │      └── TheMenu/ 
  │                                                                                                                                                                                                
  ├── views/                  # Компоненты страниц
  │   ├── HomeView.vue
  │   └── SessionView.vue
  │                                                                                                                                                                                                
  ├── services/               # API-слой
  │   ├── api.ts              # axios/fetch instance
  │   ├── sessionService.ts                                                                                                                                                                        
  │   └── messageService.ts
  │                                                                                                                                                                                                
  ├── types/                  # TypeScript интерфейсы
  │   ├── session.ts                                                                                                                                                                               
  │   └── message.ts
  │                                                                                                                                                                                                
  ├── utils/                  # Чистые функции
  │   └── formatters.ts                                                                                                                                                                            
  │
  ├── assets/                                                                                                                                                                                      
  ├── App.vue     
  └── main.ts 
```

**Правила:**

- Компоненты конкретной страницы именуются с её префиксом: `InvestorsHero`, `ProjectsCard`
- Компонент используется на 2+ страницах → переносим в `common/`

## src/stores/

Pinia stores — только для глобального состояния. Предпочитай prop drilling для локальной коммуникации компонентов.

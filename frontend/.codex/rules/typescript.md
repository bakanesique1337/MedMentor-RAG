# TypeScript Rules

## Forbidden Patterns

```ts
// ❌ any
const data: any = response;

// ✅ Type it
const data: ApiResponse<User> = response;

// ❌ as unknown as
const user = data as unknown as User;

// ✅ Type guard
function isUser(data: unknown): data is User {
    return typeof data === 'object' && data !== null && 'id' in data;
}
```

## Prefer Object Maps over Switch

```ts
// ❌ switch-case
function getStatusText(status: string): string {
    switch (status) {
        case 'pending':
            return 'Ожидание';
        case 'approved':
            return 'Одобрено';
        default:
            return 'Неизвестно';
    }
}

// ✅ Object map
type Status = 'pending' | 'approved' | 'rejected';

const STATUS_TEXT: Record<Status, string> = {
    pending: 'Ожидание',
    approved: 'Одобрено',
    rejected: 'Отклонено',
};

function getStatusText(status: Status): string {
    return STATUS_TEXT[status] || 'Неизвестно';
}
```

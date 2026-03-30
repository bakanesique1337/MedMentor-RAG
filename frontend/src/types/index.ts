export interface DynamicObject {
    [key: string]: any;
}

export interface AIRequest {
    userMessage: string;
    metadata?: DynamicObject;
}

export interface AIResponse {
    aiMessage?: string;
    requestId?: string;
    timestamp?: number;
    metadata?: DynamicObject;
}

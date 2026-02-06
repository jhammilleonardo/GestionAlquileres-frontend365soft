// Enums para mensajes
export enum MessageStatus {
    UNREAD = 'UNREAD',
    READ = 'READ',
    ARCHIVED = 'ARCHIVED'
}

export enum MessagePriority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

// Interfaces
export interface Message {
    id: number;
    subject: string;
    body: string;
    sender_id: number;
    sender_name: string;
    sender_role: string;
    recipient_id: number;
    recipient_name: string;
    status: MessageStatus;
    priority: MessagePriority;
    parent_message_id?: number;
    created_at: Date;
    read_at?: Date;
    attachments: MessageAttachment[];
}

export interface MessageAttachment {
    id: number;
    message_id: number;
    file_name: string;
    file_url: string;
    file_size: number;
}

export interface MessageThread {
    id: number;
    subject: string;
    last_message: string;
    last_message_date: Date;
    unread_count: number;
    participants: string[];
    messages: Message[];
}

// DTOs
export interface CreateMessageDto {
    subject: string;
    body: string;
    recipient_id?: number;
    priority: MessagePriority;
    parent_message_id?: number;
}

export interface ReplyMessageDto {
    body: string;
    parent_message_id: number;
}

// Labels para UI
export const MessageStatusLabels: Record<MessageStatus, string> = {
    [MessageStatus.UNREAD]: 'No leído',
    [MessageStatus.READ]: 'Leído',
    [MessageStatus.ARCHIVED]: 'Archivado'
};

export const MessagePriorityLabels: Record<MessagePriority, string> = {
    [MessagePriority.LOW]: 'Baja',
    [MessagePriority.NORMAL]: 'Normal',
    [MessagePriority.HIGH]: 'Alta',
    [MessagePriority.URGENT]: 'Urgente'
};

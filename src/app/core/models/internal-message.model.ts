export interface InternalMessage {
  id: number;
  sender_id: number;
  recipient_id: number;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageThread {
  user_id: number;
  user_name: string;
  user_role: string;
  last_message: string;
  last_at: string;
  unread: number;
}

export interface MessageRecipient {
  id: number;
  name: string;
  role: string;
}

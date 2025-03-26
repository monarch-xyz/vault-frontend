// todo: rename to Activity once the DB changes
export interface Memory {
  id: string;
  created_at: string;
  text: string;
  type: string;
  action_id?: string;
  sub_type?: string;
  activity_id?: string;
  metadata?: Record<string, any>;
}

export interface UserMessage {
  id: string;
  created_at: string;
  sender: string;
  tx: string;
}

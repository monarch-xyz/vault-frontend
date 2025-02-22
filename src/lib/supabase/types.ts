// todo: rename to Activity once the DB changes
export interface Memory {
  id: string
  created_at: string
  text: string
  type: string
  action_id?: string
  sub_type?: string
}

export interface UserMessage {
  id: string
  created_at: string
  sender: string
  tx: string
} 
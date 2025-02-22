export interface Memory {
  id: string
  created_at: string
  text: string
  type: string
}

export interface UserMessage {
  id: string
  created_at: string
  sender: string
  tx: string
} 
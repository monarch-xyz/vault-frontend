import { useState, useEffect } from 'react';
import { Memory } from '@/lib/supabase/types';

// --- Tool Call Types ---
// Structure within additional_kwargs.tool_calls
export interface FunctionCall {
  name: string;
  arguments: string; // JSON string arguments
}

export interface ToolCall {
  id: string;
  function: FunctionCall;
  type?: string; // Usually 'function'
}

// Parsed arguments for the 'market_analysis' tool call
export interface MarketAnalysisArgs {
  reasoning_prompt?: string;
  market_or_vault_data?: string;
  activity_id?: string;
}

// Define Message Types
export type MessageType = 'HumanMessage' | 'AIMessage' | 'ToolMessage';

export interface BaseMessage {
  type: MessageType;
  content: string | null; // Content can be null for some AI messages
  additional_kwargs?: {
    tool_calls?: ToolCall[]; // Use the specific ToolCall type
  } | null;
}

export interface HumanMessage extends BaseMessage {
  type: 'HumanMessage';
  content: string;
}

export interface AIMessage extends BaseMessage {
  type: 'AIMessage';
}

export interface ToolMessage extends BaseMessage {
  type: 'ToolMessage';
  content: string;
  tool_call_id?: string; // Optional: If the backend provides IDs linking tools and calls
}

export type Message = HumanMessage | AIMessage | ToolMessage;

// Define the new type for Activity data
type ActivityData = {
  id: string;
  fullHistory: Message[]; // Changed from string to Message[]
  createdAt: string; // Assuming created_at is returned as a string
  trigger: string; // Assuming trigger is returned as a string
};

export function useRun(id: string) {
  // Update state to hold ActivityData or null
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/runs/${id}`);
        if (!response.ok) {
          // Consider updating error message based on API changes
          throw new Error('Failed to fetch activity details');
        }

        const data = await response.json();
        console.log('data received:', data); // Keep log for debugging
        // Update type assertion to ActivityData
        setActivity(data.data as ActivityData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching activity:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchActivity(); // Rename function call for clarity
    }
  }, [id]);

  // Return the new state variable
  return {
    activity,
    isLoading,
    error,
  };
} 
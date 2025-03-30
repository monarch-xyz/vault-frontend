import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/client'; // Adjust path if necessary
import { ApiResponse } from '@/utils/api-response'; // Adjust path if necessary
import { Message } from '@/hooks/useRun'; // Import the Message type

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  ApiResponse.setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return ApiResponse.error(res, 405, 'Method not allowed');
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return ApiResponse.error(res, 400, 'Activity ID is required and must be a string');
  }

  try {
    const { data, error } = await supabase
      .from('activities')
      .select('id, full_history, created_at, trigger')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return ApiResponse.error(res, 404, `Activity with ID ${id} not found`);
      }
      console.error('Supabase error fetching activity:', error);
      throw error; // Re-throw other errors to be caught below
    }

    if (!data) {
      // Should be caught by the error check above
      return ApiResponse.error(res, 404, `Activity with ID ${id} not found`);
    }

    // Parse the full_history JSON string
    let parsedHistory: Message[] = [];
    try {
      // Ensure full_history is a string before parsing
      if (typeof data.full_history === 'string') {
        parsedHistory = JSON.parse(data.full_history);
      } else {
        // Handle case where full_history might be null or already an object (less likely)
        console.warn(`Activity ${id}: full_history was not a string, attempting to use as is.`);
        parsedHistory = data.full_history || []; // Use as is or default to empty array
      }
    } catch (parseError) {
      console.error(`Error parsing full_history for activity ${id}:`, parseError);
      // Decide how to handle parse errors: return error or empty history?
      // Returning empty history for now to avoid breaking the page entirely.
      parsedHistory = []; 
    }

    // Map Supabase columns to the expected ActivityData structure
    const responseData = {
      id: data.id,
      fullHistory: parsedHistory, // Use the parsed array
      createdAt: data.created_at,
      trigger: data.trigger,
    };

    console.log('responseData', responseData.fullHistory.map(h => h.additional_kwargs?.tool_calls ?? 'no tool calls'));

    // Return data in the structure the frontend expects ({ data: ... })
    return ApiResponse.success(res, { data: responseData });

  } catch (error) {
    console.error('Error in activity fetch API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch activity details';
    return ApiResponse.error(res, 500, errorMessage);
  }
} 
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/client';
import { Memory } from '@/lib/supabase/types';
import { ApiResponse } from '@/utils/api-response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  ApiResponse.setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return ApiResponse.error(res, 405, 'Method not allowed');
  }

  try {
    const { since_timestamp } = req.query;
    
    // Start building the query
    let query = supabase
      .from('memories')
      .select('id, created_at, text, type, sub_type, action_id');
    
    // Add timestamp filter if provided
    if (since_timestamp && typeof since_timestamp === 'string') {
      // Use gt (greater than) to get memories after the last timestamp
      query = query.gt('created_at', since_timestamp);
    }

    // Execute the query with ordering
    const { data, error } = await query.order('created_at', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (data.length === 0) return ApiResponse.success(res, { data: [] });
    if (!data) return ApiResponse.error(res, 404, 'No memories found');

    return ApiResponse.success(res, { data: data as Memory[] });
  } catch (error) {
    console.error('Error in memories API:', error);
    return ApiResponse.error(
      res,
      500,
      error instanceof Error ? error.message : 'Failed to fetch memories',
    );
  }
}

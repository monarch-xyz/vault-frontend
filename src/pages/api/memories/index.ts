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
    const { type, limit = '20' } = req.query;

    // Start building the query
    let query = supabase.from('memories').select('id, created_at, text, type, sub_type, action_id, activity_id');

    // Add type filter if provided and not 'all'
    if (type && typeof type === 'string' && type !== 'all') {
      query = query.eq('type', type);
    }

    // Add limit and order by created_at desc to get latest entries
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string, 10));

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

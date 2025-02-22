import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase/client'
import { Memory } from '@/lib/supabase/types'
import { ApiResponse } from '@/utils/api-response'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  ApiResponse.setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return ApiResponse.error(res, 405, 'Method not allowed')
  }

  try {
    const { data, error } = await supabase
      .from('memories')
      .select('id, created_at, text, type, sub_type, action_id')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!data) return ApiResponse.error(res, 404, 'No memories found')

    return ApiResponse.success(res, data as Memory[])
  } catch (error) {
    console.error('Supabase error:', error)
    return ApiResponse.error(
      res, 
      500, 
      error instanceof Error ? error.message : 'Failed to fetch memories'
    )
  }
} 
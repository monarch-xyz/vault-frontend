import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase/client'
import { UserMessage } from '@/lib/supabase/types'
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
      .from('user-messages')
      .select('id, created_at, sender, tx')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data.length === 0) return ApiResponse.success(res, { data: [] })

    // if wrong data type, return 404
    if (!data) return ApiResponse.error(res, 404, 'No messages found')

    return ApiResponse.success(res, { data: data as UserMessage[] })
  } catch (error) {
    console.error('Supabase error:', error)
    return ApiResponse.error(
      res,
      500,
      error instanceof Error ? error.message : 'Failed to fetch messages'
    )
  }
} 
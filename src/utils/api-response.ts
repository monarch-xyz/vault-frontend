import { NextApiResponse } from 'next'

export class ApiResponse {
  static success(res: NextApiResponse, data: any) {
    return res.status(200).json(data)
  }

  static error(res: NextApiResponse, status: number, message: string) {
    return res.status(status).json({ error: message })
  }

  static setCorsHeaders(res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  }
} 
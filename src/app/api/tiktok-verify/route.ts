import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse(
    'tiktok-developers-site-verification=iXOrX1LDJzbsBXu4UlvIbE90X6lcXUSu',
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  )
}

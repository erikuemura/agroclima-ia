import { NextResponse } from 'next/server'
import { chatWithAgronomist } from '@/lib/ai'

export async function POST(req: Request) {
  const { messages, context } = await req.json()
  const reply = await chatWithAgronomist(messages, context)
  return NextResponse.json({ reply })
}

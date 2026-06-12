import { NextResponse } from 'next/server'
import { isAdminRequest, unauthorized } from '@/lib/admin-auth'
import { getSubscriptions } from '@/lib/admin-finance'

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) return unauthorized()
  const { source, subscriptions } = await getSubscriptions()
  return NextResponse.json({ source, subscriptions })
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const expected = process.env.INVITE_CODE

  if (!expected) {
    return NextResponse.json({ valid: false, error: 'Invite gate not configured' }, { status: 500 })
  }

  let code: unknown
  try {
    const body = await req.json()
    code = body?.code
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 })
  }

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ valid: false }, { status: 400 })
  }

  const valid = code.trim().toLowerCase() === expected.trim().toLowerCase()
  return NextResponse.json({ valid })
}

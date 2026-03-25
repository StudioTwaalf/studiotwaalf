import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, message } = body

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'name, email, and message are required' },
      { status: 400 },
    )
  }

  // TODO: send email notification (e.g. Resend / nodemailer)
  console.log('[contact] New submission:', { name, email, message: message.slice(0, 100) })

  return NextResponse.json({ ok: true })
}

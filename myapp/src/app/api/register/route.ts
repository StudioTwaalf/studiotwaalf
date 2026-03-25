import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendWelkomstmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password, street, houseNumber, zipCode, city, phone } = await req.json()

    if (!email || !password || !firstName) {
      return NextResponse.json({ error: 'Vul alle verplichte velden in.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Wachtwoord moet minimaal 8 tekens bevatten.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik.' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName:    lastName    ?? null,
        name:        [firstName, lastName].filter(Boolean).join(' '),
        email:       email.toLowerCase(),
        hashedPassword,
        street:      street      ?? null,
        houseNumber: houseNumber ?? null,
        zipCode:     zipCode     ?? null,
        city:        city        ?? null,
        phone:       phone       ?? null,
      },
    })

    // ── event: user.created ──────────────────────────────────────────────────
    // Fire-and-forget — never blocks the 201 response
    sendWelkomstmail({
      id:        user.id,
      email:     user.email,
      firstName: firstName,
    }).catch((err) => console.error('[register] Welcome email error:', err))
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Er is iets misgegaan. Probeer opnieuw.' }, { status: 500 })
  }
}

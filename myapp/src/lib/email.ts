/**
 * EmailService — Studio Twaalf
 *
 * Central email sending service with:
 *   • Resend transport
 *   • Dev-mode console fallback (no RESEND_API_KEY needed)
 *   • Idempotency guard via EmailLog (DB check before every send)
 *   • Structured error handling — never crashes the calling flow
 *   • Typed convenience wrappers per email type
 *
 * Usage:
 *   import { sendBestelbevestiging } from '@/lib/email'
 *   await sendBestelbevestiging(order)   // ← fire-and-forget safe
 */

import * as React from 'react'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { formatEuro } from '@/lib/money'

// ─── Template imports ────────────────────────────────────────────────────────

import { Bestelbevestiging }   from '@/emails/templates/Bestelbevestiging'
import { OfferteBevestiging }  from '@/emails/templates/OfferteBevestiging'
import { Welkomstmail }        from '@/emails/templates/Welkomstmail'
import { AbandonedDesign }     from '@/emails/templates/AbandonedDesign'
import { BestellingVerzonden } from '@/emails/templates/BestellingVerzonden'

// ─── Email types (used as idempotency key) ────────────────────────────────────

export const EMAIL_TYPES = {
  ORDER_CONFIRMATION:   'order_confirmation',
  QUOTE_CONFIRMATION:   'quote_confirmation',
  WELCOME:              'welcome',
  ABANDONED_DESIGN:     'abandoned_design',
  ORDER_SHIPPED:        'order_shipped',
} as const

export type EmailType = (typeof EMAIL_TYPES)[keyof typeof EMAIL_TYPES]

// ─── Resend client (lazy-init) ────────────────────────────────────────────────

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'Studio Twaalf <hallo@studiotwaalf.be>'

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

// ─── Mode detection ──────────────────────────────────────────────────────────

type EmailMode = 'production' | 'staging' | 'dev'

function getEmailMode(): EmailMode {
  if (!process.env.RESEND_API_KEY)           return 'dev'
  if (process.env.NODE_ENV !== 'production') return 'staging'
  return 'production'
}

// ─── Core types ───────────────────────────────────────────────────────────────

export interface SendOnceOptions {
  type:        EmailType
  referenceId: string
  to:          string
  subject:     string
  react:       React.ReactElement
}

export interface EmailResult {
  sent:      boolean
  skipped?:  boolean   // already sent (idempotency)
  id?:       string    // Resend message ID
  error?:    string
}

// ─── Core: sendOnce ───────────────────────────────────────────────────────────
/**
 * Send an email exactly once per (type, referenceId) pair.
 *
 * Flow:
 *   1. Check EmailLog — skip if already sent successfully
 *   2. In dev mode → log to console only
 *   3. In staging → redirect to EMAIL_TEST_ADDRESS
 *   4. Send via Resend
 *   5. Write EmailLog record (success or failure)
 *
 * Never throws. Returns EmailResult.
 */
export async function sendOnce(opts: SendOnceOptions): Promise<EmailResult> {
  const { type, referenceId, to, subject, react } = opts

  // ── 1. Idempotency check ────────────────────────────────────────────────────
  try {
    const existing = await prisma.emailLog.findFirst({
      where: { type, referenceId, status: 'sent' },
    })
    if (existing) {
      console.log(`[email] Already sent "${type}" for ${referenceId} — skipping`)
      return { sent: false, skipped: true, id: existing.resendId ?? undefined }
    }
  } catch (dbErr) {
    // DB check failure → log and continue (better to risk a duplicate than block the flow)
    console.error('[email] EmailLog check failed:', dbErr)
  }

  const mode = getEmailMode()

  // ── 2. Dev mode — console only ──────────────────────────────────────────────
  if (mode === 'dev') {
    console.log('\n📧 [email] DEV — email not sent (no RESEND_API_KEY).')
    console.log(`   Type:    ${type}`)
    console.log(`   Ref:     ${referenceId}`)
    console.log(`   To:      ${to}`)
    console.log(`   Subject: ${subject}\n`)
    await _writeLog({ type, referenceId, recipient: to, subject, status: 'sent', resendId: 'dev-skip' })
    return { sent: false, skipped: false, id: 'dev-skip' }
  }

  // ── 3. Staging — redirect all emails to test address ───────────────────────
  const recipient = mode === 'staging'
    ? (process.env.EMAIL_TEST_ADDRESS ?? to)
    : to

  if (mode === 'staging' && recipient !== to) {
    console.log(`[email] STAGING — redirecting ${to} → ${recipient}`)
  }

  // ── 4. Send via Resend ──────────────────────────────────────────────────────
  const resend = getResend()!
  let resendId: string | undefined
  let errorMsg: string | undefined

  try {
    const { data, error } = await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      recipient,
      subject: mode === 'staging' ? `[STAGING] ${subject}` : subject,
      react,
      replyTo: 'hallo@studiotwaalf.be',
    })

    if (error) {
      errorMsg = error.message
      console.error(`[email] Resend error for "${type}":`, error)
    } else {
      resendId = data?.id
      console.log(`[email] Sent "${type}" for ${referenceId} → ${recipient} (id: ${resendId})`)
    }
  } catch (sendErr) {
    errorMsg = sendErr instanceof Error ? sendErr.message : String(sendErr)
    console.error(`[email] Unexpected send error for "${type}":`, sendErr)
  }

  // ── 5. Write log ────────────────────────────────────────────────────────────
  await _writeLog({
    type, referenceId,
    recipient: to,      // always log the original recipient, not the staging redirect
    subject,
    status:   errorMsg ? 'failed' : 'sent',
    resendId: resendId,
    error:    errorMsg,
  })

  if (errorMsg) return { sent: false, error: errorMsg }
  return { sent: true, id: resendId }
}

// ─── Private log writer ───────────────────────────────────────────────────────

async function _writeLog(data: {
  type: string; referenceId: string; recipient: string; subject: string
  status: string; resendId?: string; error?: string
}) {
  try {
    await prisma.emailLog.create({ data })
  } catch (err) {
    // Race condition or duplicate key — non-fatal
    console.warn('[email] EmailLog write failed:', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrappers — strongly typed, one per template
// ─────────────────────────────────────────────────────────────────────────────

/**
 * order.paid → bestelbevestiging
 * referenceId: order.id — idempotent per order
 */
export async function sendBestelbevestiging(order: {
  id:            string
  orderNumber:   string
  totalCents:    number
  customerEmail: string
  customerName:  string
}): Promise<EmailResult> {
  const voornaam = order.customerName.split(' ')[0] ?? order.customerName

  return sendOnce({
    type:        EMAIL_TYPES.ORDER_CONFIRMATION,
    referenceId: order.id,
    to:          order.customerEmail,
    subject:     `Bedankt voor je bestelling, ${voornaam} — ${order.orderNumber}`,
    react:       React.createElement(Bestelbevestiging, {
      voornaam,
      orderNumber: order.orderNumber,
      orderTotal:  formatEuro(order.totalCents),
    }),
  })
}

/**
 * quote.requested → offerte bevestiging
 * referenceId: offerRequest.id — idempotent per quote
 */
export async function sendOfferteBevestiging(offerRequest: {
  id:            string
  concept:       string        // template / product name
  customerEmail: string
  customerName:  string
}): Promise<EmailResult> {
  const voornaam = offerRequest.customerName.split(' ')[0] ?? offerRequest.customerName

  return sendOnce({
    type:        EMAIL_TYPES.QUOTE_CONFIRMATION,
    referenceId: offerRequest.id,
    to:          offerRequest.customerEmail,
    subject:     `Bedankt voor je aanvraag, ${voornaam}`,
    react:       React.createElement(OfferteBevestiging, {
      voornaam,
      concept: offerRequest.concept,
    }),
  })
}

/**
 * user.created → welkomstmail
 * referenceId: user.id — idempotent per user
 */
export async function sendWelkomstmail(user: {
  id:        string
  email:     string
  firstName: string
}): Promise<EmailResult> {
  return sendOnce({
    type:        EMAIL_TYPES.WELCOME,
    referenceId: user.id,
    to:          user.email,
    subject:     `Welkom bij Studio Twaalf, ${user.firstName}`,
    react:       React.createElement(Welkomstmail, { voornaam: user.firstName }),
  })
}

/**
 * design.abandoned → herinnering
 * Pass referenceId as `${designId}` or `${designId}-${weekKey}` to control
 * whether reminders can repeat (e.g. once per ISO week).
 */
export async function sendAbandonedDesignEmail(opts: {
  designId:    string
  referenceId: string
  to:          string
  voornaam:    string
  designUrl?:  string
}): Promise<EmailResult> {
  return sendOnce({
    type:        EMAIL_TYPES.ABANDONED_DESIGN,
    referenceId: opts.referenceId,
    to:          opts.to,
    subject:     `Je ontwerp staat nog klaar, ${opts.voornaam}`,
    react:       React.createElement(AbandonedDesign, {
      voornaam:  opts.voornaam,
      designUrl: opts.designUrl,
    }),
  })
}

/**
 * order.shipped → verzending bevestiging
 * referenceId: order.id — idempotent per order
 */
export async function sendBestellingVerzonden(order: {
  id:            string
  orderNumber:   string
  customerEmail: string
  customerName:  string
  trackingUrl?:  string
}): Promise<EmailResult> {
  const voornaam = order.customerName.split(' ')[0] ?? order.customerName

  return sendOnce({
    type:        EMAIL_TYPES.ORDER_SHIPPED,
    referenceId: order.id,
    to:          order.customerEmail,
    subject:     `Je bestelling is onderweg, ${voornaam}`,
    react:       React.createElement(BestellingVerzonden, {
      voornaam,
      orderNumber: order.orderNumber,
      trackingUrl: order.trackingUrl,
    }),
  })
}

import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'notifications@fretraq.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

const NAV = `#1a3a5c`

function base(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
      <tr><td style="background:${NAV};padding:24px 32px;">
        <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-.3px;">FreTraq</span>
        <span style="color:#93c5fd;font-size:12px;margin-left:8px;">AI Logistics Copilot</span>
      </td></tr>
      <tr><td style="padding:32px;">${body}</td></tr>
      <tr><td style="padding:16px 32px 28px;border-top:1px solid #f1f5f9;text-align:center;">
        <span style="color:#94a3b8;font-size:12px;">© 2026 FreTraq · <a href="${APP_URL}" style="color:#94a3b8;">fretraq.com</a></span>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

function btn(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:${NAV};color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${label}</a>`
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#64748b;width:140px;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:500;">${value}</td>
  </tr>`
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({ from: FROM, to, subject, html })
}

// ─── 1. Broker: new bid received ────────────────────────────────────────────

export interface NewBidEmailParams {
  brokerEmail: string
  carrierName: string
  bidAmount: number
  estimatedPickup: string | null
  originCity: string
  originState: string
  destinationCity: string
  destinationState: string
  loadId: string
}

export async function sendNewBidEmail(p: NewBidEmailParams): Promise<void> {
  try {
    const subject = `New bid on your load — $${p.bidAmount.toLocaleString()} from ${p.carrierName}`
    const html = base(`
      <h2 style="margin:0 0 4px;font-size:20px;color:#0f172a;">New bid received</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;">${p.originCity}, ${p.originState} → ${p.destinationCity}, ${p.destinationState}</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
        ${row('Carrier', p.carrierName)}
        ${row('Bid amount', `$${p.bidAmount.toLocaleString()}`)}
        ${p.estimatedPickup ? row('Est. pickup', new Date(p.estimatedPickup).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })) : ''}
        ${row('Route', `${p.originCity}, ${p.originState} → ${p.destinationCity}, ${p.destinationState}`)}
      </table>
      ${btn('Review Bid', `${APP_URL}/marketplace`)}
    `)
    await sendEmail(p.brokerEmail, subject, html)
  } catch (err) {
    console.error('[email] sendNewBidEmail failed:', err)
  }
}

// ─── 2. Carrier: bid accepted ────────────────────────────────────────────────

export interface BidAcceptedEmailParams {
  carrierEmail: string
  carrierName: string
  originCity: string
  originState: string
  destinationCity: string
  destinationState: string
  pickupDate: string
  brokerName: string
  brokerEmail: string
}

export async function sendBidAcceptedEmail(p: BidAcceptedEmailParams): Promise<void> {
  try {
    const subject = `Your bid was accepted — ${p.originCity}, ${p.originState} to ${p.destinationCity}, ${p.destinationState}`
    const html = base(`
      <h2 style="margin:0 0 4px;font-size:20px;color:#0f172a;">Congratulations, ${p.carrierName}!</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Your bid has been accepted. Here are the load details:</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
        ${row('Route', `${p.originCity}, ${p.originState} → ${p.destinationCity}, ${p.destinationState}`)}
        ${row('Pickup date', new Date(p.pickupDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))}
        ${row('Broker', p.brokerName)}
        ${row('Broker email', p.brokerEmail)}
      </table>
      ${btn('View My Loads', `${APP_URL}/carrier`)}
    `)
    await sendEmail(p.carrierEmail, subject, html)
  } catch (err) {
    console.error('[email] sendBidAcceptedEmail failed:', err)
  }
}

// ─── 3. Carrier: bid rejected ────────────────────────────────────────────────

export interface BidRejectedEmailParams {
  carrierEmail: string
  carrierName: string
  originCity: string
  originState: string
  destinationCity: string
  destinationState: string
}

export async function sendBidRejectedEmail(p: BidRejectedEmailParams): Promise<void> {
  try {
    const subject = `Update on your bid — ${p.originCity}, ${p.originState} to ${p.destinationCity}, ${p.destinationState}`
    const html = base(`
      <h2 style="margin:0 0 4px;font-size:20px;color:#0f172a;">Thanks for bidding, ${p.carrierName}</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#64748b;">
        Unfortunately this load (<strong>${p.originCity}, ${p.originState} → ${p.destinationCity}, ${p.destinationState}</strong>) was covered by another carrier.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;">
        New loads are posted regularly — keep bidding and you'll land the next one.
      </p>
      ${btn('Browse Available Loads', `${APP_URL}/carrier/marketplace`)}
    `)
    await sendEmail(p.carrierEmail, subject, html)
  } catch (err) {
    console.error('[email] sendBidRejectedEmail failed:', err)
  }
}

// ─── 4. Broker: load status update ──────────────────────────────────────────

export interface LoadStatusEmailParams {
  brokerEmail: string
  newStatus: string
  driverName: string
  originCity: string
  originState: string
  destinationCity: string
  destinationState: string
  currentLat: number | null
  currentLng: number | null
}

const STATUS_LABELS: Record<string, string> = {
  en_route_pickup: 'En Route to Pickup',
  at_pickup: 'At Pickup Location',
  loaded: 'Loaded & Departing',
  en_route_delivery: 'En Route to Delivery',
  at_delivery: 'At Delivery Location',
  delivered: 'Delivered',
}

export async function sendLoadStatusEmail(p: LoadStatusEmailParams): Promise<void> {
  try {
    const label = STATUS_LABELS[p.newStatus] ?? p.newStatus
    const subject = `Load status update — ${label}`
    const locationLine =
      p.currentLat != null && p.currentLng != null
        ? row('Last location', `${p.currentLat.toFixed(4)}, ${p.currentLng.toFixed(4)}`)
        : ''
    const html = base(`
      <h2 style="margin:0 0 4px;font-size:20px;color:#0f172a;">Status update: ${label}</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;">${p.originCity}, ${p.originState} → ${p.destinationCity}, ${p.destinationState}</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
        ${row('Status', label)}
        ${row('Driver', p.driverName)}
        ${row('Route', `${p.originCity}, ${p.originState} → ${p.destinationCity}, ${p.destinationState}`)}
        ${locationLine}
      </table>
      ${btn('View Tracking Dashboard', `${APP_URL}/tracking`)}
    `)
    await sendEmail(p.brokerEmail, subject, html)
  } catch (err) {
    console.error('[email] sendLoadStatusEmail failed:', err)
  }
}

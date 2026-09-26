import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema, type ContactFormData } from '@/lib/schemas';

/**
 * POST /api/contact
 *
 * Receives contact form submissions from FormCliente and FormProductor.
 * Validates, logs, and dispatches to configured channels:
 *   - Resend email (if RESEND_API_KEY is set)
 *   - Webhook (if CONTACT_WEBHOOK_URL is set, e.g. Slack/Discord/Zapier)
 *
 * Always returns 200 on success, 400 on validation error, 500 on dispatch error.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  // Validate against shared schema
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Validation failed',
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const submittedAt = new Date().toISOString();

  // 1) Always log (visible in Vercel logs)
  console.log('[contact] Submission received:', {
    type: data.type,
    submittedAt,
    summary: getSummary(data),
  });

  // 2) Dispatch to configured channels (async, non-blocking)
  const dispatchResults = await Promise.allSettled([
    sendEmailViaResend(data, submittedAt),
    sendWebhook(data, submittedAt),
  ]);

  const failures = dispatchResults
    .map((r, i) => ({ index: i, result: r }))
    .filter((r) => r.result.status === 'rejected');

  if (failures.length > 0) {
    console.error('[contact] Some dispatchers failed:', failures);
  }

  return NextResponse.json({ ok: true, submittedAt });
}

/* ----------------------- Helpers ----------------------- */

function getSummary(data: ContactFormData): string {
  if (data.type === 'cliente') {
    return `Cliente: ${data.empresa} - ${data.nombreContacto} (${data.email})`;
  }
  return `Productor: ${data.nombreCompleto} - ${data.ubicacionPredio} (${data.hectareas} ha)`;
}

function getSubject(data: ContactFormData): string {
  if (data.type === 'cliente') {
    return `[Collecta] Nuevo cliente: ${data.empresa}`;
  }
  return `[Collecta] Nuevo productor: ${data.nombreCompleto}`;
}

function formatPlainText(data: ContactFormData, submittedAt: string): string {
  const lines: string[] = [];
  lines.push(`Recibido: ${submittedAt}`);
  lines.push(`Tipo: ${data.type === 'cliente' ? 'Cliente B2B' : 'Productor'}`);
  lines.push('');

  if (data.type === 'cliente') {
    lines.push(`Empresa: ${data.empresa}`);
    lines.push(`Contacto: ${data.nombreContacto}`);
    lines.push(`Cargo: ${data.cargo}`);
    lines.push(`Email: ${data.email}`);
    lines.push(`Teléfono: ${data.countryCode} ${data.telefono}`);
    lines.push(`Ubicación: ${data.ubicacion}`);
    lines.push(`Productos de interés: ${data.productos}`);
    lines.push(`Volumen deseado: ${data.volumen}`);
    if (data.mensaje) {
      lines.push('');
      lines.push(`Mensaje: ${data.mensaje}`);
    }
  } else {
    lines.push(`Nombre: ${data.nombreCompleto}`);
    if (data.email) lines.push(`Email: ${data.email}`);
    lines.push(`Celular: ${data.countryCode} ${data.celular}`);
    lines.push(`Ubicación predio: ${data.ubicacionPredio}`);
    lines.push(`Hectáreas: ${data.hectareas}`);
    lines.push(`Pozo/riego: ${data.pozoRiego === 'si' ? 'Sí' : 'No'}`);
    lines.push(`Años de experiencia: ${data.experiencia}`);
    lines.push(`Productos con experiencia: ${data.productosExperiencia}`);
    lines.push(`Edad: ${data.edad} años`);
  }

  return lines.join('\n');
}

/* ----------------------- Email (Resend) ----------------------- */

async function sendEmailViaResend(
  data: ContactFormData,
  submittedAt: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  // Route emails based on form type:
  //   - cliente (B2B buyer)   → sales@collectaproduce.com
  //   - productor (agricultor) → contacto@collectaproduce.com
  // Override via env vars for testing/staging.
  const toAddress =
    data.type === 'cliente'
      ? process.env.CONTACT_EMAIL_CLIENTE || 'sales@collectaproduce.com'
      : process.env.CONTACT_EMAIL_PRODUCTOR || 'contacto@collectaproduce.com';

  const fromAddress =
    process.env.CONTACT_EMAIL_FROM || 'noreply@collectaproduce.com';

  if (!apiKey) {
    // Resend not configured - skip silently (still logs above)
    return;
  }

  const subject = getSubject(data);
  const text = formatPlainText(data, submittedAt);

  // Reply-To: when the recipient (sales/contacto) hits "Reply", the response
  // goes directly to the lead's email instead of the noreply address.
  const replyTo =
    data.type === 'cliente'
      ? data.email
      : data.email && data.email.length > 0
        ? data.email
        : undefined;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: toAddress,
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Resend error ${response.status}: ${errBody}`);
  }
}

/* ----------------------- Webhook (Slack/Discord/Zapier) ----------------------- */

async function sendWebhook(
  data: ContactFormData,
  submittedAt: string
): Promise<void> {
  const url = process.env.CONTACT_WEBHOOK_URL;
  if (!url) return;

  const payload = {
    text: getSubject(data),
    submittedAt,
    summary: getSummary(data),
    full: formatPlainText(data, submittedAt),
    data,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Webhook error ${response.status}: ${errBody}`);
  }
}

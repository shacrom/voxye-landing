import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';

export const prerender = false;

const MAX_BODY_BYTES = 10_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REQUEST_TYPES = new Set(['demo', 'info', 'partnership']);
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function normalizeField(value: string | null, max: number) {
  if (!value) return '';
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
}

function validEmail(email: string) {
  return email.length > 3 && email.length <= 254 && EMAIL_RE.test(email);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[char] || char);
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function requestIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const candidate = forwarded || realIp || 'unknown';
  return /^[a-f0-9:.]{3,45}$/i.test(candidate) ? candidate : 'unknown';
}

function rateLimited(ip: string) {
  const now = Date.now();
  for (const [key, value] of rateLimit) {
    if (value.resetAt <= now) rateLimit.delete(key);
  }

  const entry = rateLimit.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function sameOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (origin) return origin === requestUrl.origin;
  if (referer) {
    try {
      return new URL(referer).origin === requestUrl.origin;
    } catch {
      return false;
    }
  }

  return true;
}

export const ALL: APIRoute = async ({ request, cookies }) => {
  if (request.method !== 'POST') return json(405, { error: 'Metodo no permitido' });

  const contentLengthHeader = request.headers.get('content-length');
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
  if (contentLengthHeader && (!Number.isFinite(contentLength) || contentLength > MAX_BODY_BYTES)) {
    return json(413, { error: 'Solicitud demasiado grande' });
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/x-www-form-urlencoded')) {
    return json(400, { error: 'Formato no valido' });
  }

  if (!sameOrigin(request)) return json(403, { error: 'Origen no permitido' });
  if (rateLimited(requestIp(request))) return json(429, { error: 'Demasiadas solicitudes. Intentalo mas tarde.' });

  let body = '';
  try {
    body = await request.text();
  } catch {
    return json(400, { error: 'Formulario no valido' });
  }

  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return json(413, { error: 'Solicitud demasiado grande' });
  }

  const form = new URLSearchParams(body);
  const honeypot = normalizeField(form.get('website'), 200);
  if (honeypot) return json(200, { ok: true });

  const cookieToken = cookies.get('voxye_contact_csrf')?.value || '';
  const submittedToken = normalizeField(form.get('csrfToken'), 120);
  if (!cookieToken || !submittedToken || !safeCompare(cookieToken, submittedToken)) {
    return json(403, { error: 'Sesion de seguridad caducada. Recarga la pagina e intentalo de nuevo.' });
  }

  const name = normalizeField(form.get('name'), 120);
  const email = normalizeField(form.get('email'), 254).toLowerCase();
  const phone = normalizeField(form.get('phone'), 40);
  const company = normalizeField(form.get('company'), 120);
  const requestType = normalizeField(form.get('requestType'), 24);
  const message = normalizeField(form.get('message'), 1200);
  const consent = form.get('consent') === 'accepted';

  if (!name || !validEmail(email) || !REQUEST_TYPES.has(requestType) || !message || !consent) {
    return json(400, { error: 'Revisa los campos obligatorios y el consentimiento.' });
  }

  const apiKey = import.meta.env.RESEND_API_KEY;
  const to = import.meta.env.RESEND_TO;
  const from = import.meta.env.RESEND_FROM || 'onboarding@resend.dev';
  if (!apiKey || !to) return json(503, { error: 'Servicio no configurado' });

  const labels: Record<string, string> = {
    demo: 'Solicitar demo',
    info: 'Pedir informacion',
    partnership: 'Colaboracion',
  };
  const text = [
    `Tipo: ${labels[requestType]}`,
    `Nombre: ${name}`,
    `Email: ${email}`,
    `Telefono: ${phone || 'No indicado'}`,
    `Empresa: ${company || 'No indicada'}`,
    '',
    'Mensaje:',
    message,
    '',
    'Consentimiento privacidad: aceptado',
  ].join('\n');
  const html = `<p><strong>Tipo:</strong> ${escapeHtml(labels[requestType])}</p>
<p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
<p><strong>Telefono:</strong> ${escapeHtml(phone || 'No indicado')}</p>
<p><strong>Empresa:</strong> ${escapeHtml(company || 'No indicada')}</p>
<p><strong>Mensaje:</strong></p>
<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
<p><strong>Consentimiento privacidad:</strong> aceptado</p>`;

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `Nueva solicitud Voxye: ${labels[requestType]}`,
    text,
    html,
  }).catch(() => ({ error: true }));

  if (result.error) return json(502, { error: 'No se pudo enviar la solicitud' });

  cookies.delete('voxye_contact_csrf', { path: '/api/contacto' });
  return json(200, { ok: true });
};

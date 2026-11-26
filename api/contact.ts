import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

interface VercelRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string | string[]>;
}

interface VercelResponse extends ServerResponse {
  status(code: number): VercelResponse;
  json(data: unknown): void;
}

const DEFAULT_RECIPIENT = 'patricialosada98@gmail.com';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/[\r\n\0]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function sanitizeMessage(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\0/g, '').trim().slice(0, maxLength);
}

function resolveRequestReferer(req: VercelRequest): string {
  const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  const refererHeader = typeof req.headers.referer === 'string' ? req.headers.referer : '';
  const hostHeader =
    (typeof req.headers['x-forwarded-host'] === 'string' && req.headers['x-forwarded-host']) ||
    (typeof req.headers.host === 'string' && req.headers.host) ||
    '';
  const protoHeader =
    typeof req.headers['x-forwarded-proto'] === 'string' ? req.headers['x-forwarded-proto'] : 'https';

  const candidates = [originHeader, refererHeader, hostHeader ? `${protoHeader}://${hostHeader}` : ''];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return `${parsed.origin}/`;
      }
    } catch {
      // Try next candidate
    }
  }
  return process.env.APP_URL || 'https://vercel.app/';
}

function verifyOptionalSignedCaptcha(token: string, answer: string): boolean {
  const secret = process.env.CAPTCHA_SECRET?.trim();
  if (!secret) {
    return answer.trim().length > 0;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }
  const [encoded, providedSig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const sigBufA = Buffer.from(providedSig, 'utf8');
  const sigBufB = Buffer.from(expectedSig, 'utf8');
  if (sigBufA.length !== sigBufB.length || !crypto.timingSafeEqual(sigBufA, sigBufB)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      nonce?: string;
      answerHash?: string;
      exp?: number;
    };
    if (!payload.nonce || !payload.answerHash || typeof payload.exp !== 'number') {
      return false;
    }
    if (Date.now() > payload.exp) {
      return false;
    }
    const candidateHash = crypto
      .createHash('sha256')
      .update(`${answer.trim().toUpperCase()}:${payload.nonce}`)
      .digest('hex');
    const hashA = Buffer.from(candidateHash, 'utf8');
    const hashB = Buffer.from(payload.answerHash, 'utf8');
    return hashA.length === hashB.length && crypto.timingSafeEqual(hashA, hashB);
  } catch {
    return false;
  }
}

async function readJsonBody(req: VercelRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as Record<string, unknown>;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Método no permitido.' });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ ok: false, error: 'Cuerpo JSON no válido.' });
    return;
  }

  const recipientEmail = (process.env.CONTACT_RECIPIENT_EMAIL || DEFAULT_RECIPIENT).trim();
  const honeypot = sanitizeText(body.companyWebsite, 100);
  if (honeypot.length > 0) {
    res.status(200).json({
      ok: true,
      referenceId: `REF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      recipient: recipientEmail,
      deliveredVia: 'filtered',
    });
    return;
  }

  const name = sanitizeText(body.name, 100);
  const email = sanitizeText(body.email, 150);
  const phone = sanitizeText(body.phone, 30);
  const subject = sanitizeText(body.subject, 120) || 'Contacto desde web profesional';
  const message = sanitizeMessage(body.message, 2000);
  const captchaToken = typeof body.captchaToken === 'string' ? body.captchaToken.trim() : '';
  const captchaAnswer = typeof body.captchaAnswer === 'string' ? body.captchaAnswer.trim() : '';

  if (name.length < 2) {
    res.status(400).json({ ok: false, error: 'Introduce tu nombre o empresa (mínimo 2 caracteres).' });
    return;
  }

  if (!EMAIL_REGEX.test(email)) {
    res.status(400).json({ ok: false, error: 'Introduce una dirección de correo electrónico válida.' });
    return;
  }

  if (message.length < 10) {
    res.status(400).json({ ok: false, error: 'El mensaje debe tener al menos 10 caracteres.' });
    return;
  }

  if (!captchaAnswer) {
    res.status(400).json({ ok: false, error: 'Completa la verificación anti-spam.' });
    return;
  }

  if (captchaToken && captchaToken.includes('.') && !verifyOptionalSignedCaptcha(captchaToken, captchaAnswer)) {
    res.status(400).json({ ok: false, error: 'El código de verificación es incorrecto o ha caducado.' });
    return;
  }

  const referenceId = `OP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const refererOrigin = resolveRequestReferer(req);
  const formSubmitEndpoint = `https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`;

  try {
    const upstreamRes = await fetch(formSubmitEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Referer: refererOrigin,
      },
      body: JSON.stringify({
        name,
        email,
        phone: phone || 'No facilitado',
        subject,
        message,
        referenceId,
        _subject: `[Web Olga Posada] ${subject}`,
        _replyto: email,
        _template: 'table',
        _captcha: 'false',
      }),
    });

    const upstreamData = (await upstreamRes.json().catch(() => ({}))) as {
      success?: boolean | string;
      message?: string;
    };

    const rawMessage = typeof upstreamData.message === 'string' ? upstreamData.message : '';
    const needsActivation = rawMessage.toLowerCase().includes('activation');
    const isSuccess =
      upstreamRes.ok &&
      (upstreamData.success === true || upstreamData.success === 'true' || needsActivation);

    if (!isSuccess) {
      res.status(502).json({
        ok: false,
        error: 'El servicio de envío no pudo procesar la solicitud en este momento.',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      referenceId,
      recipient: recipientEmail,
      deliveredVia: needsActivation ? 'formsubmit-activation' : 'formsubmit',
      needsActivation,
    });
  } catch (err) {
    console.error('Error forwarding to FormSubmit on Vercel:', err);
    res.status(502).json({
      ok: false,
      error: 'Error de red al reenviar el mensaje. Usa el botón de respaldo por correo directo.',
    });
  }
}

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';
const RECIPIENT_EMAIL = (process.env.CONTACT_RECIPIENT_EMAIL || 'patricialosada98@gmail.com').trim();
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || crypto.randomBytes(32).toString('hex');
const CAPTCHA_TTL_MS = 10 * 60 * 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface CaptchaPayload {
  nonce: string;
  answerHash: string;
  exp: number;
}

interface CaptchaGlyph {
  char: string;
  x: number;
  y: number;
  rotate: number;
}

interface CaptchaNoiseLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const usedNonces = new Map<string, number>();
const rateLimitMap = new Map<string, number[]>();

function cleanupExpiredStores() {
  const now = Date.now();
  for (const [nonce, exp] of usedNonces.entries()) {
    if (exp < now) {
      usedNonces.delete(nonce);
    }
  }
  const windowStart = now - 15 * 60 * 1000;
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter((ts) => ts > windowStart);
    if (valid.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, valid);
    }
  }
}

function hashAnswer(answer: string, nonce: string): string {
  return crypto.createHash('sha256').update(`${answer.trim().toUpperCase()}:${nonce}`).digest('hex');
}

function signToken(payload: CaptchaPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', CAPTCHA_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyAndConsumeToken(token: string, userAnswer: string): { valid: boolean; reason?: string } {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'El código de verificación no es válido.' };
  }
  const [encoded, providedSig] = parts;
  const expectedSig = crypto.createHmac('sha256', CAPTCHA_SECRET).update(encoded).digest('base64url');

  const sigBufA = Buffer.from(providedSig, 'utf8');
  const sigBufB = Buffer.from(expectedSig, 'utf8');
  if (sigBufA.length !== sigBufB.length || !crypto.timingSafeEqual(sigBufA, sigBufB)) {
    return { valid: false, reason: 'La firma de verificación no coincide.' };
  }

  let payload: CaptchaPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as CaptchaPayload;
  } catch {
    return { valid: false, reason: 'Token de verificación corrupto.' };
  }

  if (!payload.nonce || !payload.answerHash || typeof payload.exp !== 'number') {
    return { valid: false, reason: 'Datos de verificación incompletos.' };
  }

  if (Date.now() > payload.exp) {
    return { valid: false, reason: 'El código de verificación ha caducado. Genera uno nuevo.' };
  }

  if (usedNonces.has(payload.nonce)) {
    return { valid: false, reason: 'Este código ya ha sido utilizado. Solicita uno nuevo.' };
  }

  const candidateHash = hashAnswer(userAnswer, payload.nonce);
  const hashBufA = Buffer.from(candidateHash, 'utf8');
  const hashBufB = Buffer.from(payload.answerHash, 'utf8');
  if (hashBufA.length !== hashBufB.length || !crypto.timingSafeEqual(hashBufA, hashBufB)) {
    return { valid: false, reason: 'El código de verificación es incorrecto.' };
  }

  usedNonces.set(payload.nonce, payload.exp);
  return { valid: true };
}

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

function resolveRequestReferer(req: Request): string {
  const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  const refererHeader = typeof req.headers.referer === 'string' ? req.headers.referer : '';
  const hostHeader =
    (typeof req.headers['x-forwarded-host'] === 'string' && req.headers['x-forwarded-host']) ||
    (typeof req.headers.host === 'string' && req.headers.host) ||
    '';
  const protoHeader =
    typeof req.headers['x-forwarded-proto'] === 'string' ? req.headers['x-forwarded-proto'] : req.protocol || 'https';

  const candidates = [originHeader, refererHeader, hostHeader ? `${protoHeader}://${hostHeader}` : ''];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return `${parsed.origin}/`;
      }
    } catch {
      // Ignore malformed candidate
    }
  }
  return process.env.APP_URL || `http://localhost:${PORT}/`;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  cleanupExpiredStores();
  const now = Date.now();
  const windowStart = now - 15 * 60 * 1000;
  const timestamps = (rateLimitMap.get(ip) || []).filter((ts) => ts > windowStart);
  if (timestamps.length >= 8) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

async function forwardToFormSubmit(params: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  referenceId: string;
  refererOrigin: string;
}): Promise<{ deliveredVia: string; needsActivation: boolean }> {
  const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(RECIPIENT_EMAIL)}`;
  const upstreamRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Referer: params.refererOrigin,
    },
    body: JSON.stringify({
      name: params.name,
      email: params.email,
      phone: params.phone || 'No facilitado',
      subject: params.subject,
      message: params.message,
      referenceId: params.referenceId,
      _subject: `[Web Olga Posada] ${params.subject}`,
      _replyto: params.email,
      _template: 'table',
      _captcha: 'false',
    }),
  });

  const upstreamData = (await upstreamRes.json().catch(() => ({}))) as {
    success?: boolean | string;
    message?: string;
  };

  const rawMsg = typeof upstreamData.message === 'string' ? upstreamData.message : '';
  const needsActivation = rawMsg.toLowerCase().includes('activation');
  const isSuccess =
    upstreamRes.ok &&
    (upstreamData.success === true || upstreamData.success === 'true' || needsActivation);

  if (!isSuccess) {
    throw new Error(`FormSubmit rechazó la solicitud (${upstreamRes.status}): ${rawMsg || 'sin detalle'}`);
  }

  return {
    deliveredVia: needsActivation ? 'formsubmit-activation' : 'formsubmit',
    needsActivation,
  };
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/captcha', (req: Request, res: Response) => {
    cleanupExpiredStores();
    const mode = req.query.mode === 'math' ? 'math' : 'visual';
    const nonce = crypto.randomBytes(16).toString('hex');
    const exp = Date.now() + CAPTCHA_TTL_MS;

    if (mode === 'math') {
      const a = crypto.randomInt(3, 18);
      const b = crypto.randomInt(2, 12);
      const answer = String(a + b);
      const token = signToken({
        nonce,
        answerHash: hashAnswer(answer, nonce),
        exp,
      });

      res.json({
        mode: 'math',
        token,
        prompt: `¿Cuánto es ${a} + ${b}?`,
        glyphs: [] as CaptchaGlyph[],
        noiseLines: [] as CaptchaNoiseLine[],
      });
      return;
    }

    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const glyphs: CaptchaGlyph[] = [];

    for (let i = 0; i < 5; i++) {
      const char = alphabet[crypto.randomInt(0, alphabet.length)];
      code += char;
      glyphs.push({
        char,
        x: 24 + i * 32 + crypto.randomInt(-3, 4),
        y: 34 + crypto.randomInt(-4, 5),
        rotate: crypto.randomInt(-18, 19),
      });
    }

    const noiseLines: CaptchaNoiseLine[] = [];
    for (let i = 0; i < 5; i++) {
      noiseLines.push({
        x1: crypto.randomInt(0, 45),
        y1: crypto.randomInt(4, 48),
        x2: crypto.randomInt(145, 190),
        y2: crypto.randomInt(4, 48),
      });
    }

    const token = signToken({
      nonce,
      answerHash: hashAnswer(code, nonce),
      exp,
    });

    res.json({
      mode: 'visual',
      token,
      prompt: 'Introduce los 5 caracteres mostrados en la imagen',
      glyphs,
      noiseLines,
    });
  });

  app.post('/api/contact', async (req: Request, res: Response) => {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      res.status(429).json({
        ok: false,
        error: 'Has realizado demasiados envíos recientes. Por favor, inténtalo de nuevo en unos minutos.',
      });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const honeypot = sanitizeText(body.companyWebsite, 100);
    if (honeypot.length > 0) {
      res.json({
        ok: true,
        referenceId: `REF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        recipient: RECIPIENT_EMAIL,
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

    if (!captchaToken || !captchaAnswer) {
      res.status(400).json({ ok: false, error: 'Completa el código de verificación anti-spam.' });
      return;
    }

    const captchaCheck = verifyAndConsumeToken(captchaToken, captchaAnswer);
    if (!captchaCheck.valid) {
      res.status(400).json({ ok: false, error: captchaCheck.reason });
      return;
    }

    const referenceId = `OP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const refererOrigin = resolveRequestReferer(req);

    try {
      const delivery = await forwardToFormSubmit({
        name,
        email,
        phone,
        subject,
        message,
        referenceId,
        refererOrigin,
      });

      res.json({
        ok: true,
        referenceId,
        recipient: RECIPIENT_EMAIL,
        deliveredVia: delivery.deliveredVia,
        needsActivation: delivery.needsActivation,
      });
    } catch (err) {
      console.error('Error al reenviar el contacto vía FormSubmit:', err);
      res.status(502).json({
        ok: false,
        error: 'No se pudo completar el envío automático en este momento. Puedes escribir directamente por correo.',
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const publicAssets = path.resolve(__dirname, 'public');
    if (fs.existsSync(publicAssets)) {
      app.use(express.static(publicAssets));
    }
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});

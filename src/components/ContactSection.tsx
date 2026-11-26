import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  CheckCircle2,
  Download,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { PROFILE_INFO } from '../data/cvData';

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

interface CaptchaChallenge {
  mode: 'visual' | 'math';
  token: string;
  prompt: string;
  glyphs: CaptchaGlyph[];
  noiseLines: CaptchaNoiseLine[];
  localExpected?: string;
}

interface SubmissionSuccess {
  referenceId: string;
  recipient: string;
  deliveredVia: string;
  needsActivation?: boolean;
}

const SUBJECT_OPTIONS = [
  'Oferta de empleo — Hogar y cuidado infantil',
  'Oferta de empleo — Comercio, caja y reposición',
  'Oferta de empleo — Administración o recepción',
  'Solicitud de entrevista personal',
];

function buildLocalFallbackCaptcha(preferredMode: 'visual' | 'math'): CaptchaChallenge {
  if (preferredMode === 'math') {
    const a = Math.floor(Math.random() * 14) + 3;
    const b = Math.floor(Math.random() * 9) + 2;
    return {
      mode: 'math',
      token: 'local-challenge',
      prompt: `¿Cuánto es ${a} + ${b}?`,
      glyphs: [],
      noiseLines: [],
      localExpected: String(a + b),
    };
  }

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const glyphs: CaptchaGlyph[] = [];
  for (let i = 0; i < 5; i++) {
    const char = alphabet[Math.floor(Math.random() * alphabet.length)];
    code += char;
    glyphs.push({
      char,
      x: 24 + i * 32 + Math.floor(Math.random() * 6) - 3,
      y: 34 + Math.floor(Math.random() * 8) - 4,
      rotate: Math.floor(Math.random() * 34) - 17,
    });
  }

  const noiseLines: CaptchaNoiseLine[] = [];
  for (let i = 0; i < 5; i++) {
    noiseLines.push({
      x1: Math.floor(Math.random() * 45),
      y1: Math.floor(Math.random() * 44) + 4,
      x2: Math.floor(Math.random() * 45) + 145,
      y2: Math.floor(Math.random() * 44) + 4,
    });
  }

  return {
    mode: 'visual',
    token: 'local-challenge',
    prompt: 'Introduce los 5 caracteres mostrados en la imagen',
    glyphs,
    noiseLines,
    localExpected: code,
  };
}

export function ContactSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaMode, setCaptchaMode] = useState<'visual' | 'math'>('visual');
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SubmissionSuccess | null>(null);

  const loadCaptcha = useCallback(async (mode: 'visual' | 'math') => {
    setCaptchaLoading(true);
    try {
      const res = await fetch(`/api/captcha?mode=${mode}`);
      if (!res.ok) {
        setCaptcha(buildLocalFallbackCaptcha(mode));
        setCaptchaAnswer('');
        return;
      }
      const data = (await res.json()) as CaptchaChallenge;
      setCaptcha(data);
      setCaptchaAnswer('');
    } catch {
      setCaptcha(buildLocalFallbackCaptcha(mode));
      setCaptchaAnswer('');
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCaptcha(captchaMode);
  }, [captchaMode, loadCaptcha]);

  const handleToggleCaptchaMode = () => {
    setCaptchaMode((prev) => (prev === 'visual' ? 'math' : 'visual'));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!captcha) {
      setErrorMsg('Espera a que cargue el código de verificación.');
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    const trimmedCaptcha = captchaAnswer.trim();

    if (trimmedName.length < 2) {
      setErrorMsg('Introduce tu nombre o empresa (mínimo 2 caracteres).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      setErrorMsg('Introduce una dirección de correo electrónico válida.');
      return;
    }
    if (trimmedMessage.length < 10) {
      setErrorMsg('El mensaje debe tener al menos 10 caracteres.');
      return;
    }
    if (!trimmedCaptcha) {
      setErrorMsg('Completa la verificación anti-spam.');
      return;
    }

    if (
      captcha.localExpected &&
      trimmedCaptcha.toUpperCase() !== captcha.localExpected.toUpperCase()
    ) {
      setErrorMsg('El código de verificación es incorrecto.');
      void loadCaptcha(captchaMode);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: phone.trim(),
          subject,
          message: trimmedMessage,
          companyWebsite,
          captchaToken: captcha.token,
          captchaAnswer: trimmedCaptcha,
        }),
      });

      // Fallback directo desde cliente cuando el alojamiento estático no dispone de ruta serverless (404)
      if (res.status === 404) {
        if (companyWebsite.trim().length > 0) {
          setSuccessData({
            referenceId: 'OP-LOCAL',
            recipient: PROFILE_INFO.contactRecipient,
            deliveredVia: 'filtered',
          });
          return;
        }

        const directEndpoint = `https://formsubmit.co/ajax/${encodeURIComponent(
          PROFILE_INFO.contactRecipient
        )}`;
        const directRes = await fetch(directEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
            phone: phone.trim() || 'No facilitado',
            subject,
            message: trimmedMessage,
            _subject: `[Web Olga Posada] ${subject}`,
            _replyto: trimmedEmail,
            _template: 'table',
            _captcha: 'false',
          }),
        });

        const directData = (await directRes.json().catch(() => ({}))) as {
          success?: boolean | string;
          message?: string;
        };
        const rawMsg = typeof directData.message === 'string' ? directData.message : '';
        const needsActivation = rawMsg.toLowerCase().includes('activation');
        const directOk =
          directRes.ok &&
          (directData.success === true || directData.success === 'true' || needsActivation);

        if (!directOk) {
          setErrorMsg(
            'No se pudo enviar automáticamente desde este servidor. Utiliza el botón de correo directo.'
          );
          return;
        }

        setSuccessData({
          referenceId: `OP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          recipient: PROFILE_INFO.contactRecipient,
          deliveredVia: 'formsubmit-client',
          needsActivation,
        });
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
        setCaptchaAnswer('');
        void loadCaptcha(captchaMode);
        return;
      }

      const result = (await res.json()) as {
        ok?: boolean;
        error?: string;
        referenceId?: string;
        recipient?: string;
        deliveredVia?: string;
        needsActivation?: boolean;
      };

      if (!res.ok || !result.ok) {
        setErrorMsg(result.error || 'No se pudo enviar el mensaje. Revisa los campos.');
        void loadCaptcha(captchaMode);
        return;
      }

      setSuccessData({
        referenceId: result.referenceId || 'OP-OK',
        recipient: result.recipient || PROFILE_INFO.contactRecipient,
        deliveredVia: result.deliveredVia || 'formsubmit',
        needsActivation: result.needsActivation,
      });
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setCaptchaAnswer('');
      void loadCaptcha(captchaMode);
    } catch {
      setErrorMsg(
        'Error de conexión al enviar el formulario. Puedes intentarlo de nuevo o escribir al correo directo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const directMailtoHref = `mailto:${PROFILE_INFO.contactRecipient}?subject=${encodeURIComponent(
    `Contacto profesional para Olga Posada — ${subject}`
  )}&body=${encodeURIComponent(
    `Nombre: ${name || ''}\nTeléfono: ${phone || ''}\n\n${message || ''}`
  )}`;

  return (
    <section
      id="contacto"
      aria-labelledby="heading-contacto"
      className="bg-[#0F2342] text-white py-20 lg:py-28 border-t border-[#163159]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          {/* Left Column: Direct Contact Details */}
          <div className="lg:col-span-5 reveal-block">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#7DD3FC] mb-3">
              Contacto directo
            </p>
            <h2
              id="heading-contacto"
              className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance"
            >
              Contacto y solicitud de <em className="italic font-semibold text-[#7DD3FC]">entrevista</em>
            </h2>
            <p className="mt-4 text-slate-200 text-base leading-relaxed">
              Disponible para entrevistas presenciales en Rentería, Donostia y comarca de Oarsoaldea, o por vía telefónica.{' '}
              <em className="italic text-slate-100">Incorporación inmediata y disponibilidad horaria completa.</em>
            </p>

            <address className="not-italic mt-8 space-y-5 border-t border-white/15 pt-8">
              <div className="flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-[#7DD3FC] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs text-slate-300">Ubicación</p>
                  <p className="text-base font-medium text-white">{PROFILE_INFO.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Phone className="w-5 h-5 text-[#7DD3FC] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs text-slate-300">Teléfono directo</p>
                  <a
                    href={PROFILE_INFO.phoneHref}
                    className="text-base font-medium text-white hover:text-[#7DD3FC] transition-colors tabular-nums"
                  >
                    {PROFILE_INFO.phoneDisplay}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <Mail className="w-5 h-5 text-[#7DD3FC] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs text-slate-300">Correo electrónico</p>
                  <a
                    href={`mailto:${PROFILE_INFO.email}`}
                    className="text-base font-medium text-white hover:text-[#7DD3FC] transition-colors break-all"
                  >
                    {PROFILE_INFO.email}
                  </a>
                </div>
              </div>
            </address>

            <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap gap-3">
              <a
                href={PROFILE_INFO.pdfPath}
                download="Curriculum_Olga_Posada.pdf"
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-md border border-white/30 text-sm font-semibold text-white hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7DD3FC]"
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Descargar currículum en PDF</span>
              </a>

              <a
                href={`mailto:${PROFILE_INFO.contactRecipient}`}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-md bg-white/10 hover:bg-white/20 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7DD3FC]"
              >
                <Mail className="w-4 h-4 shrink-0 text-[#7DD3FC]" aria-hidden="true" />
                <span>{PROFILE_INFO.contactRecipient}</span>
              </a>
            </div>
          </div>

          {/* Right Column: Original Anti-Spam Contact Form */}
          <div className="lg:col-span-7 reveal-block">
            <div className="bg-white text-[#1E242B] rounded-xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200">
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-5 mb-6 border-b border-slate-200">
                <div>
                  <h3 className="text-xl font-bold text-[#0F2342]">Enviar propuesta o consulta</h3>
                  <p className="text-sm text-[#5A6573] mt-1">
                    Los mensajes se envían directamente a {PROFILE_INFO.contactRecipient}.
                  </p>
                </div>
                <span className="text-xs font-medium text-[#0369A1] inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Protección anti-spam</span>
                </span>
              </div>

              {successData ? (
                <div
                  role="status"
                  className="bg-[#F4F6F9] border border-slate-200 rounded-lg p-6 text-[#1E242B]"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#0369A1] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h4 className="text-lg font-bold text-[#0F2342]">Mensaje enviado correctamente</h4>
                      <p className="text-sm text-[#333C48] mt-1.5 leading-relaxed">
                        Tu consulta ha sido enviada con la referencia{' '}
                        <strong className="font-semibold tabular-nums">{successData.referenceId}</strong> a{' '}
                        <strong className="font-semibold">{successData.recipient}</strong>.
                      </p>
                      {successData.needsActivation && (
                        <p className="text-xs text-[#0369A1] mt-2.5 leading-relaxed font-medium">
                          Primer envío detectado: revisa la bandeja de entrada de {successData.recipient} y pulsa en el
                          enlace de confirmación («Activate Form») una sola vez para activar la recepción automática.
                        </p>
                      )}
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSuccessData(null)}
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#0F2342] hover:bg-[#163159] rounded-md transition-colors"
                        >
                          Enviar otro mensaje
                        </button>
                        <a
                          href={directMailtoHref}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#0F2342] bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
                        >
                          <Mail className="w-4 h-4 text-[#0369A1]" aria-hidden="true" />
                          <span>{PROFILE_INFO.contactRecipient}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Anti-bot honeypot field */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="companyWebsite">Sitio web de empresa</label>
                    <input
                      id="companyWebsite"
                      name="companyWebsite"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-semibold text-[#1E242B] mb-1.5">
                        Nombre o empresa <span className="text-[#0369A1]">*</span>
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Familia Etxebarria / Empresa"
                        className="w-full px-3.5 py-2.5 text-sm text-[#1E242B] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-semibold text-[#1E242B] mb-1.5">
                        Correo electrónico <span className="text-[#0369A1]">*</span>
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nombre@correo.com"
                        className="w-full px-3.5 py-2.5 text-sm text-[#1E242B] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-phone" className="block text-sm font-semibold text-[#1E242B] mb-1.5">
                        Teléfono <span className="text-xs font-normal text-[#5A6573]">(opcional)</span>
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="600 000 000"
                        className="w-full px-3.5 py-2.5 text-sm text-[#1E242B] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition-colors tabular-nums"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className="block text-sm font-semibold text-[#1E242B] mb-1.5">
                        Motivo de contacto <span className="text-[#0369A1]">*</span>
                      </label>
                      <select
                        id="contact-subject"
                        name="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm text-[#1E242B] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition-colors"
                      >
                        {SUBJECT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-semibold text-[#1E242B] mb-1.5">
                      Mensaje o detalles del puesto <span className="text-[#0369A1]">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Indica horario aproximado, localidad y detalles de la entrevista o puesto..."
                      className="w-full px-3.5 py-2.5 text-sm text-[#1E242B] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition-colors resize-y"
                    />
                  </div>

                  {/* Original Interactive Captcha Block */}
                  <div className="bg-[#F4F6F9] border border-slate-200 rounded-lg p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold text-[#0F2342]">
                        Verificación de seguridad anti-spam
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleToggleCaptchaMode}
                          className="text-xs font-medium text-[#0369A1] hover:underline focus-visible:outline-2 focus-visible:outline-[#0284C7]"
                        >
                          {captchaMode === 'visual' ? 'Usar suma sencilla' : 'Usar código visual'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void loadCaptcha(captchaMode)}
                          disabled={captchaLoading}
                          aria-label="Generar nuevo código de verificación"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#333C48] hover:text-[#0F2342] disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${captchaLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                          <span>Cambiar</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {captcha?.mode === 'visual' ? (
                        <div
                          className="shrink-0 bg-white border border-slate-300 rounded-md overflow-hidden select-none flex items-center justify-center"
                          aria-label="Código visual de verificación"
                        >
                          <svg
                            width="190"
                            height="52"
                            viewBox="0 0 190 52"
                            role="img"
                            aria-label="Imagen de verificación de 5 caracteres"
                          >
                            <rect width="190" height="52" fill="#FFFFFF" />
                            {captcha.noiseLines.map((line, idx) => (
                              <line
                                key={idx}
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                stroke="#CBD5E1"
                                strokeWidth="1.4"
                              />
                            ))}
                            {captcha.glyphs.map((glyph, idx) => (
                              <text
                                key={idx}
                                x={glyph.x}
                                y={glyph.y}
                                fill="#0F2342"
                                fontSize="22"
                                fontWeight="700"
                                fontFamily="Plus Jakarta Sans, sans-serif"
                                transform={`rotate(${glyph.rotate} ${glyph.x} ${glyph.y})`}
                              >
                                {glyph.char}
                              </text>
                            ))}
                          </svg>
                        </div>
                      ) : (
                        <div className="shrink-0 px-4 py-3 bg-white border border-slate-300 rounded-md text-sm font-bold text-[#0F2342] tabular-nums">
                          {captcha?.prompt || 'Cargando reto...'}
                        </div>
                      )}

                      <div className="flex-1">
                        <label htmlFor="captcha-answer" className="sr-only">
                          {captcha?.prompt || 'Respuesta de verificación'}
                        </label>
                        <input
                          id="captcha-answer"
                          name="captchaAnswer"
                          type="text"
                          required
                          autoComplete="off"
                          value={captchaAnswer}
                          onChange={(e) => setCaptchaAnswer(e.target.value)}
                          placeholder={
                            captchaMode === 'visual' ? 'Escribe los 5 caracteres' : 'Escribe el resultado numérico'
                          }
                          className="w-full px-3.5 py-2.5 text-sm text-[#1E242B] bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition-colors uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div
                      role="alert"
                      className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3 flex flex-col gap-2"
                    >
                      <span>{errorMsg}</span>
                      <a
                        href={directMailtoHref}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2342] underline self-start"
                      >
                        <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Enviar correo directo a {PROFILE_INFO.contactRecipient}</span>
                      </a>
                    </div>
                  )}

                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <a
                      href={directMailtoHref}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0369A1] hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Respaldo directo: {PROFILE_INFO.contactRecipient}</span>
                    </a>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0F2342] hover:bg-[#163159] disabled:opacity-60 rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7]"
                    >
                      <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{submitting ? 'Enviando mensaje...' : 'Enviar mensaje'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

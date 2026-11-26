import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Download, FileText, Globe, HeartHandshake, Laptop } from 'lucide-react';
import { ContactSection } from './components/ContactSection';
import { Navbar } from './components/Navbar';
import {
  COMPETENCIES,
  INTERNATIONAL_EXPERIENCE,
  PROFILE_INFO,
  SPAIN_EXPERIENCE,
} from './data/cvData';

gsap.registerPlugin(ScrollTrigger);

type ExperienceFilter = 'todas' | 'espana' | 'internacional';

export default function App() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [experienceFilter, setExperienceFilter] = useState<ExperienceFilter>('todas');

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !rootRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      // Hero staggered entrance (gentle, fast, immediately accessible)
      gsap.from('.hero-stagger', {
        y: 20,
        opacity: 0,
        duration: 0.75,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      // Scroll-triggered section blocks
      gsap.utils.toArray<HTMLElement>('.reveal-block').forEach((element) => {
        gsap.from(element, {
          y: 28,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: element,
            start: 'top 86%',
            once: true,
          },
        });
      });

      // Continuous subtle floating motion on architectural accent shapes
      gsap.to('.float-object-slow', {
        y: -14,
        rotation: 2,
        duration: 3.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.float-object-reverse', {
        y: 12,
        x: -8,
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Scroll-scrubbed parallax movement on visual frames and geometric accents
      gsap.utils.toArray<HTMLElement>('.parallax-frame').forEach((frame) => {
        const shift = Number(frame.dataset.shift || -24);
        gsap.to(frame, {
          y: shift,
          ease: 'none',
          scrollTrigger: {
            trigger: frame,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const showSpain = experienceFilter === 'todas' || experienceFilter === 'espana';
  const showInternational = experienceFilter === 'todas' || experienceFilter === 'internacional';

  return (
    <div ref={rootRef} className="min-h-screen flex flex-col bg-white text-[#1E242B]">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-[#0F2342] focus:text-white focus:rounded-md"
      >
        Ir al contenido principal
      </a>

      <Navbar />

      <main id="contenido-principal" className="flex-1">
        {/* SECTION 1: HERO */}
        <section
          id="inicio"
          aria-labelledby="hero-heading"
          className="relative overflow-hidden bg-white pt-10 pb-14 lg:pt-16 lg:pb-20"
        >
          {/* Subtle animated architectural objects */}
          <div
            aria-hidden="true"
            className="float-object-slow pointer-events-none hidden lg:block absolute top-14 right-[6%] w-64 h-64 rounded-full border border-[#0284C7]/15"
          />
          <div
            aria-hidden="true"
            className="float-object-reverse pointer-events-none hidden lg:block absolute bottom-20 left-[3%] w-32 h-32 border border-[#0F2342]/10 rounded-lg rotate-12"
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Hero Typographic Left Column */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <p className="hero-stagger text-xs sm:text-sm font-medium text-[#5A6573] flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-4">
                  <span>{PROFILE_INFO.location}</span>
                  <span aria-hidden="true">·</span>
                  <span>{PROFILE_INFO.workPermit}</span>
                  <span aria-hidden="true">·</span>
                  <span className="italic text-[#0369A1]">{PROFILE_INFO.availability}</span>
                </p>

                <h1
                  id="hero-heading"
                  className="hero-stagger text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight text-[#0F2342] leading-[1.1] text-balance"
                >
                  Profesionalidad, orden y <em className="italic font-semibold text-[#0369A1]">trato humano</em> en cada
                  responsabilidad.
                </h1>

                <p className="hero-stagger mt-6 text-base sm:text-lg text-[#333C48] leading-relaxed max-w-2xl">
                  Soy <strong className="font-semibold text-[#0F2342]">Olga Posada</strong>. Aporto experiencia
                  contrastada en <em className="italic">atención al cliente, caja y reposición</em> en Rentería,
                  así como en el <em className="italic">cuidado integral del hogar y atención infantil</em> en Donostia,
                  respaldada por formación en secretariado contable sistematizado.
                </p>

                <div className="hero-stagger mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href="#contacto"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0F2342] hover:bg-[#163159] rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7]"
                  >
                    <span>Solicitar entrevista</span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </a>

                  <a
                    href={PROFILE_INFO.pdfPath}
                    download="Curriculum_Olga_Posada.pdf"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#0F2342] bg-[#F4F6F9] hover:bg-slate-200/80 border border-slate-200 rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7]"
                  >
                    <Download className="w-4 h-4 shrink-0 text-[#0369A1]" aria-hidden="true" />
                    <span>Descargar CV (PDF)</span>
                  </a>
                </div>
              </div>

              {/* Hero Visual Right Column */}
              <div className="lg:col-span-5 relative flex">
                <figure className="parallax-frame relative w-full rounded-xl overflow-hidden bg-[#F4F6F9] border border-slate-200 shadow-sm min-h-[280px] lg:min-h-[420px]" data-shift="-18">
                  <img
                    src="/src/assets/images/hero_workspace_care_1795683506520.jpg"
                    alt="Espacio residencial moderno, luminoso y ordenado en Donostia que refleja el cuidado profesional del hogar"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover lg:absolute lg:inset-0"
                  />
                  <div className="hidden sm:block absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0F2342]/80 via-[#0F2342]/35 to-transparent pointer-events-none" />
                  <figcaption className="hidden sm:block absolute bottom-4 left-5 right-5 text-white text-xs leading-snug">
                    <span className="font-semibold">Donostia y Rentería</span>
                    <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
                    <span className="italic text-slate-100">Hogar, cuidado infantil y atención comercial</span>
                  </figcaption>
                </figure>
              </div>
            </div>

            {/* Key Facts Strip below Hero Split */}
            <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#0F2342] tabular-nums">20+ años</p>
                <p className="text-xs sm:text-sm text-[#5A6573] mt-1">Trayectoria laboral continua</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#0F2342]">Donostia / Rentería</p>
                <p className="text-xs sm:text-sm text-[#5A6573] mt-1">Experiencia reciente en Gipuzkoa</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#0F2342]">Español</p>
                <p className="text-xs sm:text-sm text-[#5A6573] mt-1">Lengua materna · Trato directo</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#0369A1]">Total</p>
                <p className="text-xs sm:text-sm text-[#5A6573] mt-1">Disponibilidad e incorporación</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: PERFIL PROFESIONAL (NAVY BAND FOR CONTRAST & RHYTHM) */}
        <section
          id="perfil"
          aria-labelledby="heading-perfil"
          className="relative overflow-hidden bg-[#0F2342] text-white py-20 lg:py-24"
        >
          {/* Floating decorative navy-steel lines */}
          <div
            aria-hidden="true"
            className="float-object-slow pointer-events-none hidden md:block absolute -top-12 right-12 w-48 h-48 rounded-full border border-white/10"
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <div className="lg:col-span-7 reveal-block">
                <p className="text-xs font-semibold tracking-wider uppercase text-[#7DD3FC] mb-3">
                  Presentación y compromiso
                </p>
                <h2 id="heading-perfil" className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
                  Perfil profesional
                </h2>

                <blockquote className="mt-6 text-xl sm:text-2xl font-medium text-slate-100 leading-snug italic">
                  “La confianza se construye cada día mediante la puntualidad, el orden riguroso y una atención amable y
                  juiciosa.”
                </blockquote>

                <div className="mt-6 space-y-4 text-slate-200 text-base leading-relaxed">
                  <p>
                    A lo largo de mi carrera entre España, Colombia y Venezuela he desarrollado una sólida capacidad de
                    adaptación en entornos tan diversos como el <strong className="text-white">cuidado familiar y doméstico</strong>,
                    el <strong className="text-white">comercio minorista</strong>, la <strong className="text-white">gestión de almacén</strong> y
                    la <strong className="text-white">administración de oficina</strong>.
                  </p>
                  <p className="text-slate-300 text-sm sm:text-base">
                    Cuento con <span className="text-white font-medium">permiso de trabajo en vigor</span> y{' '}
                    <span className="text-white font-medium">disponibilidad total</span>. Asimismo, tengo reconocida una{' '}
                    <em className="italic text-slate-100">discapacidad del 60% por afección pulmonar</em>, aspecto que
                    explico con total transparencia durante una entrevista personal para detallar mi ritmo y capacidad de
                    desempeño diario.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 reveal-block">
                <figure className="parallax-frame rounded-xl overflow-hidden border border-white/15 bg-[#163159]" data-shift="-22">
                  <img
                    src="/src/assets/images/admin_organization_desk_1795683507523.jpg"
                    alt="Mesa de trabajo organizada con libreta contable y carpeta azul marino representando rigor administrativo"
                    referrerPolicy="no-referrer"
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <figcaption className="p-5 border-t border-white/10">
                    <p className="text-sm font-semibold text-white">Organización administrativa y operativa</p>
                    <p className="text-xs text-slate-300 mt-1 italic">
                      Base técnica en Secretariado Contable Sistematizado aplicada a cada puesto.
                    </p>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: EXPERIENCIA LABORAL */}
        <section
          id="experiencia"
          aria-labelledby="heading-experiencia"
          className="bg-white py-20 lg:py-24"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200 reveal-block">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-[#0369A1] mb-2">
                  Trayectoria acreditada
                </p>
                <h2 id="heading-experiencia" className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F2342]">
                  Experiencia laboral
                </h2>
              </div>

              {/* Interactive Segmented Filter Control */}
              <div
                role="group"
                aria-label="Filtrar experiencia por etapa"
                className="inline-flex items-center gap-1 p-1 bg-[#F4F6F9] border border-slate-200 rounded-lg self-start"
              >
                <button
                  type="button"
                  onClick={() => setExperienceFilter('todas')}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    experienceFilter === 'todas'
                      ? 'bg-[#0F2342] text-white shadow-sm'
                      : 'text-[#333C48] hover:text-[#0F2342]'
                  }`}
                >
                  Toda la trayectoria
                </button>
                <button
                  type="button"
                  onClick={() => setExperienceFilter('espana')}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    experienceFilter === 'espana'
                      ? 'bg-[#0F2342] text-white shadow-sm'
                      : 'text-[#333C48] hover:text-[#0F2342]'
                  }`}
                >
                  España
                </button>
                <button
                  type="button"
                  onClick={() => setExperienceFilter('internacional')}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    experienceFilter === 'internacional'
                      ? 'bg-[#0F2342] text-white shadow-sm'
                      : 'text-[#333C48] hover:text-[#0F2342]'
                  }`}
                >
                  Colombia y Venezuela
                </button>
              </div>
            </div>

            {/* Experiencia en España */}
            {showSpain && (
              <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                <div className="lg:col-span-7 space-y-8">
                  <div className="reveal-block">
                    <h3 className="text-lg font-bold text-[#0F2342] mb-6">
                      Experiencia laboral en España <span className="italic font-normal text-[#5A6573]">(2022 – 2026)</span>
                    </h3>

                    <div className="space-y-8">
                      {SPAIN_EXPERIENCE.map((job) => (
                        <article
                          key={job.id}
                          className="bg-[#F4F6F9] border border-slate-200 rounded-xl p-6 sm:p-7"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-slate-200">
                            <h4 className="text-xl font-bold text-[#0F2342]">
                              <span className="text-[#0369A1] tabular-nums mr-2">{job.index}.</span>
                              {job.role}
                            </h4>
                            <span className="text-sm font-semibold text-[#0369A1] tabular-nums">{job.period}</span>
                          </div>

                          <p className="mt-3 text-sm text-[#5A6573] italic">
                            {job.organization} · {job.location}
                          </p>

                          <ul className="mt-4 space-y-2.5 text-sm sm:text-base text-[#333C48] leading-relaxed">
                            {job.highlights.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2.5">
                                <span className="text-[#0284C7] font-bold mt-0.5" aria-hidden="true">
                                  –
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Adjacent Corporate Retail Photography */}
                <div className="lg:col-span-5 reveal-block">
                  <figure className="parallax-frame rounded-xl overflow-hidden border border-slate-200 bg-[#F4F6F9]" data-shift="-16">
                    <img
                      src="/src/assets/images/retail_customer_service_1795683507340.jpg"
                      alt="Pasillo de supermercado europeo moderno con productos perfectamente ordenados y frenteados"
                      referrerPolicy="no-referrer"
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <figcaption className="p-6 bg-white border-t border-slate-200">
                      <p className="text-base font-bold text-[#0F2342]">Atención comercial y reposición</p>
                      <p className="text-sm text-[#5A6573] mt-1.5 leading-relaxed">
                        Experiencia directa en supermercado <span className="italic">EROSKI (C.C. Niessen)</span>{' '}
                        combinando trato cordial en caja con el frenteado y orden continuo del lineal.
                      </p>
                    </figcaption>
                  </figure>
                </div>
              </div>
            )}

            {/* Experiencia en Colombia y Venezuela */}
            {showInternational && (
              <div className="mt-14 pt-12 border-t border-slate-200 reveal-block">
                <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
                  <h3 className="text-lg font-bold text-[#0F2342]">
                    Experiencia laboral en Colombia y Venezuela{' '}
                    <span className="italic font-normal text-[#5A6573]">(2005 – 2021)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5A6573]">
                    Polivalencia en comercio, industria alimentaria, agricultura, taquilla y secretariado
                  </p>
                </div>

                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  {INTERNATIONAL_EXPERIENCE.map((item, idx) => (
                    <div
                      key={`${item.role}-${idx}`}
                      className="py-4 sm:py-5 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-baseline hover:bg-[#F4F6F9]/70 px-3 -mx-3 rounded-md transition-colors"
                    >
                      <div className="md:col-span-3 text-sm font-semibold text-[#0369A1] tabular-nums">
                        {item.period}
                      </div>
                      <div className="md:col-span-4 text-base font-bold text-[#0F2342]">{item.role}</div>
                      <div className="md:col-span-5 text-sm text-[#5A6573] italic">{item.context}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: COMPETENCIAS Y VALORES */}
        <section
          id="competencias"
          aria-labelledby="heading-competencias"
          className="relative overflow-hidden bg-[#F4F6F9] py-20 lg:py-24 border-y border-slate-200"
        >
          <div
            aria-hidden="true"
            className="float-object-reverse pointer-events-none hidden lg:block absolute top-10 left-[5%] w-40 h-40 rounded-full border border-[#0F2342]/10"
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-2xl mb-12 reveal-block">
              <p className="text-xs font-semibold tracking-wider uppercase text-[#0369A1] mb-2">
                Habilidades clave
              </p>
              <h2 id="heading-competencias" className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F2342] text-balance">
                Competencias y valores de trabajo
              </h2>
              <p className="mt-3 text-base text-[#333C48]">
                Aptitudes consolidadas a través de la experiencia directa con familias, clientes y equipos de trabajo.
              </p>
            </div>

            {/* Asymmetric Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {COMPETENCIES.map((comp) => (
                <article
                  key={comp.index}
                  className={`reveal-block bg-white border border-slate-200 rounded-xl p-7 transition-transform duration-200 hover:-translate-y-0.5 ${
                    comp.featured ? 'md:col-span-2' : 'md:col-span-1'
                  }`}
                >
                  <p className="text-xs font-bold text-[#0369A1] tabular-nums mb-3">{comp.index}.</p>
                  <h3 className="text-xl font-bold text-[#0F2342]">{comp.title}</h3>
                  <p className="mt-3 text-sm sm:text-base text-[#333C48] leading-relaxed">{comp.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: FORMACIÓN, IDIOMAS Y OTROS DATOS */}
        <section
          id="formacion"
          aria-labelledby="heading-formacion"
          className="bg-white py-20 lg:py-24"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12 reveal-block">
              <p className="text-xs font-semibold tracking-wider uppercase text-[#0369A1] mb-2">
                Cualificación y disponibilidad
              </p>
              <h2 id="heading-formacion" className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F2342] text-balance">
                Formación académica e idiomas
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {PROFILE_INFO.educationList.map((edu) => (
                <article
                  key={edu.title}
                  className="reveal-block bg-[#F4F6F9] border border-slate-200 rounded-xl p-7 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      {edu.isCourse ? (
                        <Laptop className="w-5 h-5 text-[#0F2342]" aria-hidden="true" />
                      ) : (
                        <FileText className="w-5 h-5 text-[#0F2342]" aria-hidden="true" />
                      )}
                      <span className="text-sm font-bold text-[#0369A1] tabular-nums">{edu.badge}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0F2342]">{edu.title}</h3>
                    <p className="text-sm text-[#5A6573] italic mt-1">{edu.institution}</p>
                    <p className="mt-4 text-sm text-[#333C48] leading-relaxed">{edu.summary}</p>
                  </div>
                </article>
              ))}

              {/* Idiomas */}
              <article className="reveal-block bg-[#F4F6F9] border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <Globe className="w-5 h-5 text-[#0F2342]" aria-hidden="true" />
                    <span className="text-xs font-semibold text-[#0369A1]">Comunicación</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0F2342]">Idiomas</h3>
                  <p className="text-base font-semibold text-[#1E242B] mt-3">{PROFILE_INFO.language}</p>
                  <p className="mt-3 text-sm text-[#333C48] leading-relaxed">
                    Expresión clara, respetuosa y orientada tanto al ámbito familiar y escolar como a la atención al
                    público en establecimientos comerciales.
                  </p>
                </div>
              </article>

              {/* Otros datos relevantes */}
              <article className="reveal-block bg-[#F4F6F9] border border-slate-200 rounded-xl p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <HeartHandshake className="w-5 h-5 text-[#0F2342]" aria-hidden="true" />
                    <span className="text-xs font-semibold text-[#0369A1]">Información adicional</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0F2342]">Otros datos de interés</h3>
                  <ul className="mt-3 space-y-2.5 text-sm text-[#333C48] leading-relaxed">
                    <li>
                      <strong className="font-semibold text-[#0F2342]">Disponibilidad total</strong> para jornada
                      completa, parcial o turnos.
                    </li>
                    <li>
                      <strong className="font-semibold text-[#0F2342]">Permiso de trabajo en vigor</strong> en España.
                    </li>
                    <li className="italic text-[#333C48]">{PROFILE_INFO.disabilityNote}</li>
                  </ul>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* SECTION 6: CONTACTO CON CAPTCHA */}
        <ContactSection />
      </main>

      {/* QUIET FOOTER */}
      <footer className="bg-[#09162B] text-slate-300 border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-white">Olga Posada</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>20100 Rentería, Gipuzkoa</span>
          </div>

          <nav aria-label="Enlaces de pie de página" className="flex flex-wrap items-center gap-5">
            <a href="#inicio" className="hover:text-white transition-colors">
              Inicio
            </a>
            <a href="#experiencia" className="hover:text-white transition-colors">
              Experiencia
            </a>
            <a href="#formacion" className="hover:text-white transition-colors">
              Formación
            </a>
            <a href="#contacto" className="hover:text-white transition-colors">
              Contacto
            </a>
          </nav>

          <p className="text-slate-400 tabular-nums">© 2026 Olga Posada</p>
        </div>
      </footer>
    </div>
  );
}

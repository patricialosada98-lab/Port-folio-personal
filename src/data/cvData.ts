export interface ExperienceItem {
  id: string;
  index: string;
  role: string;
  organization: string;
  location: string;
  period: string;
  region: 'espana' | 'internacional';
  highlights: string[];
}

export interface InternationalRole {
  period: string;
  role: string;
  context: string;
}

export interface CompetencyItem {
  index: string;
  title: string;
  description: string;
  featured?: boolean;
}

export const PROFILE_INFO = {
  fullName: 'Olga Posada',
  workPermit: 'Permiso de trabajo en vigor',
  availability: 'Disponibilidad total',
  location: '20100 Rentería, Gipuzkoa',
  phoneDisplay: '645 146 791',
  phoneHref: 'tel:+34645146791',
  email: 'patricialosada98@gmail.com',
  contactRecipient: 'patricialosada98@gmail.com',
  pdfPath: '/assets/aistudio/Olga_Posada__sept_2026__59138fa7.pdf',
  language: 'Español — Lengua materna',
  educationList: [
    {
      badge: '45 h',
      title: 'Curso de Alfabetización Digital',
      institution: 'Formación complementaria en competencias digitales',
      summary:
        'Manejo práctico de herramientas digitales, gestión de correo electrónico, ofimática básica, navegación segura y trámites en línea para el entorno laboral actual.',
      isCourse: true,
    },
    {
      badge: '2005',
      title: 'Secretariado Contable Sistematizado',
      institution: 'Instituto Inprosistema del Norte · Colombia',
      summary:
        'Formación técnica orientada a la gestión administrativa, organización documental, control contable y atención profesional.',
      isCourse: false,
    },
  ],
  disabilityNote:
    'Discapacidad reconocida del 60% (afección pulmonar). En entrevista personal podré explicar con claridad cómo desempeño mis funciones cotidianas con total responsabilidad y eficacia.',
};

export const SPAIN_EXPERIENCE: ExperienceItem[] = [
  {
    id: 'hogar-donostia',
    index: '01',
    role: 'Empleada doméstica y niñera',
    organization: 'Domicilios particulares',
    location: 'Donostia',
    period: '2022 – Actualidad',
    region: 'espana',
    highlights: [
      'Limpieza general integral del hogar: cristales, suelos, mobiliario, lavado y planchado de ropa.',
      'Elaboración diaria de desayunos y meriendas infantiles adaptadas.',
      'Cuidado continuo a niña desde 1 año de edad: alimentación, higiene, rutinas diarias, paseos, traslado y recogida de actividades y colegio.',
    ],
  },
  {
    id: 'eroski-niessen',
    index: '02',
    role: 'Cajera / Reponedora',
    organization: 'EROSKI · Centro Comercial Niessen',
    location: 'Rentería',
    period: '2026',
    region: 'espana',
    highlights: [
      'Atención cercana y asesoramiento directo al cliente en tienda.',
      'Cobro ágil y preciso en caja de diferentes productos.',
      'Orden y limpieza rigurosa del puesto de trabajo.',
      'Reposición y frenteado cuidado de productos en estanterías.',
    ],
  },
];

export const INTERNATIONAL_EXPERIENCE: InternationalRole[] = [
  {
    period: '2021',
    role: 'Empleada de Hogar',
    context: 'Colombia · Mantenimiento integral doméstico y cuidado familiar',
  },
  {
    period: '2019',
    role: 'Empaquetadora en Fábrica de alimentación',
    context: 'Colombia · Control de línea, higiene alimentaria y envasado',
  },
  {
    period: '2018 – 2019',
    role: 'Trabajadora en Invernadero',
    context: 'Colombia · Cultivo, cuidado diario y clasificación de producto',
  },
  {
    period: '2016 – 2018 / 2010 – 2015',
    role: 'Dependienta y gestión de almacén',
    context: 'Colombia · Atención comercial, inventario y reposición',
  },
  {
    period: '2010 – 2015',
    role: 'Taquillera y acomodadora en Cine',
    context: 'Colombia · Venta en taquilla, control de acceso y atención al público',
  },
  {
    period: '2008 – 2010',
    role: 'Secretaria',
    context: 'SAJAVEN · Venezuela · Gestión administrativa, archivo y recepción',
  },
];

export const COMPETENCIES: CompetencyItem[] = [
  {
    index: '01',
    title: 'Organizada en mis tareas',
    description:
      'Planificación metódica de horarios escolares, rutinas domésticas, orden en almacén y mantenimiento continuo de cada espacio.',
    featured: true,
  },
  {
    index: '02',
    title: 'Amable y juiciosa',
    description:
      'Trato respetuoso, sereno y discreto tanto en la intimidad de domicilios familiares como en la atención directa al cliente en comercio.',
  },
  {
    index: '03',
    title: 'Resolución de problemas',
    description:
      'Capacidad práctica para responder con calma y criterio ante imprevistos diarios en el cuidado infantil, la caja o la gestión de tienda.',
  },
  {
    index: '04',
    title: 'Trabajo individual y en equipo',
    description:
      'Autonomía completa para asumir responsabilidades de forma independiente y disposición colaborativa dentro de equipos de tienda o producción.',
    featured: true,
  },
];

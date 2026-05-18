/**
 * i18n dictionary for the Collecta web. Add new strings here as you migrate
 * each component to use the `useT()` hook. Keys are dotted paths
 * (e.g. `header.platform`) — group by component or section.
 *
 * Adding a new language? Add it to `Locale` and provide a full translation
 * map under the new key in `messages` below.
 */

export type Locale = 'es' | 'en';

export const DEFAULT_LOCALE: Locale = 'es';

export const LOCALE_LABELS: Record<Locale, string> = {
  es: 'ES',
  en: 'EN',
};

type Dict = Record<string, string>;

export const messages: Record<Locale, Dict> = {
  es: {
    // ─── Header / nav ────────────────────────────────────────────────────────
    'nav.ecosistema': 'Ecosistema',
    'nav.clientes': 'Clientes',
    'nav.productores': 'Productores',
    'nav.impacto': 'Impacto',
    'nav.contacto': 'Contacto',
    'nav.platform': 'Plataforma',
    'nav.platform.mobile': 'Acceder a la Plataforma',
    'nav.language.aria': 'Cambiar idioma',
    'nav.menu.openAria': 'Abrir menú',
    'nav.menu.closeAria': 'Cerrar menú',

    // ─── Footer ──────────────────────────────────────────────────────────────
    'footer.tagline': 'Para toda la humanidad',
    'footer.col.ecosistema': 'Ecosistema',
    'footer.col.audiencias': 'Audiencias',
    'footer.col.empresa': 'Empresa',
    'footer.col.legal': 'Legal',
    'footer.copyright': '© {year} Collecta. Todos los derechos reservados.',
    'footer.location': 'Puebla, México',
    'footer.link.modelo': 'Modelo',
    'footer.link.tecnologia': 'Tecnología',
    'footer.link.trazabilidad': 'Trazabilidad',
    'footer.link.clientes': 'Clientes',
    'footer.link.productores': 'Productores',
    'footer.link.aliados': 'Aliados',
    'footer.link.impacto': 'Impacto',
    'footer.link.contacto': 'Contacto',
    'footer.link.plataforma': 'Plataforma',
    'footer.link.privacidad': 'Aviso de privacidad',
    'footer.link.terminos': 'Términos de uso',

    // ─── Hero ────────────────────────────────────────────────────────────────
    'hero.title.line1': 'Rediseñando',
    'hero.title.line2': 'la cadena alimentaria',
    'hero.subtitle':
      'Un ecosistema integrado de producción, tecnología y comercialización que impulsa la transformación de la agroindustria en América Latina.',
    'hero.cta.primary': 'Conocer Collecta',
    'hero.cta.secondary': 'Hablemos de tu cadena',
    'hero.status': 'Sistema · activo',
    'hero.location': 'LATAM · 19.43°N 99.13°W',

    // ─── QuienesSomos ────────────────────────────────────────────────────────
    'quienes.kicker': 'Quiénes somos',
    'quienes.title': 'Una empresa mexicana, una visión global',
    'quienes.p1':
      'Collecta es una empresa mexicana que produce y comercializa hortalizas con una operación integrada de principio a fin. Habilitamos la producción desde el origen, trabajamos de cerca con agricultores y cuidamos cada etapa: planeación, producción en campo, cosecha y empaque.',
    'quienes.p2':
      'Todo con trazabilidad e inocuidad, para entregar abasto confiable y calidad consistente a clientes exigentes que comparten nuestra visión de transformación.',

    // ─── CompanyStats ────────────────────────────────────────────────────────
    'stats.title.operacion': 'Operación en números',
    'stats.hectareas.label': 'Hectáreas',
    'stats.hectareas.description': 'En operación integrada',
    'stats.productores.label': 'Productores',
    'stats.productores.description': 'En la red de coproducción',
    'stats.cultivos.label': 'Cultivos',
    'stats.cultivos.description': 'Hortalizas diversificadas',
    'stats.trazabilidad.label': 'Trazabilidad',
    'stats.trazabilidad.description': 'Productos auditables',
  },

  en: {
    // ─── Header / nav ────────────────────────────────────────────────────────
    'nav.ecosistema': 'Ecosystem',
    'nav.clientes': 'Clients',
    'nav.productores': 'Producers',
    'nav.impacto': 'Impact',
    'nav.contacto': 'Contact',
    'nav.platform': 'Platform',
    'nav.platform.mobile': 'Access the Platform',
    'nav.language.aria': 'Change language',
    'nav.menu.openAria': 'Open menu',
    'nav.menu.closeAria': 'Close menu',

    // ─── Footer ──────────────────────────────────────────────────────────────
    'footer.tagline': 'For all humanity',
    'footer.col.ecosistema': 'Ecosystem',
    'footer.col.audiencias': 'Audiences',
    'footer.col.empresa': 'Company',
    'footer.col.legal': 'Legal',
    'footer.copyright': '© {year} Collecta. All rights reserved.',
    'footer.location': 'Puebla, Mexico',
    'footer.link.modelo': 'Model',
    'footer.link.tecnologia': 'Technology',
    'footer.link.trazabilidad': 'Traceability',
    'footer.link.clientes': 'Clients',
    'footer.link.productores': 'Producers',
    'footer.link.aliados': 'Partners',
    'footer.link.impacto': 'Impact',
    'footer.link.contacto': 'Contact',
    'footer.link.plataforma': 'Platform',
    'footer.link.privacidad': 'Privacy notice',
    'footer.link.terminos': 'Terms of use',

    // ─── Hero ────────────────────────────────────────────────────────────────
    'hero.title.line1': 'Redesigning',
    'hero.title.line2': 'the food supply chain',
    'hero.subtitle':
      'An integrated ecosystem of production, technology, and commerce driving the transformation of agribusiness in Latin America.',
    'hero.cta.primary': 'Discover Collecta',
    'hero.cta.secondary': 'Let’s talk supply',
    'hero.status': 'System · live',
    'hero.location': 'LATAM · 19.43°N 99.13°W',

    // ─── QuienesSomos ────────────────────────────────────────────────────────
    'quienes.kicker': 'About us',
    'quienes.title': 'A Mexican company with a global vision',
    'quienes.p1':
      'Collecta is a Mexican company that grows and markets vegetables with an integrated end-to-end operation. We enable production from the origin, work closely with farmers, and take care of every stage: planning, field production, harvest and packing.',
    'quienes.p2':
      'All with traceability and food safety, to deliver reliable supply and consistent quality to demanding clients who share our vision of transformation.',

    // ─── CompanyStats ────────────────────────────────────────────────────────
    'stats.title.operacion': 'Operations in numbers',
    'stats.hectareas.label': 'Hectares',
    'stats.hectareas.description': 'In integrated operation',
    'stats.productores.label': 'Producers',
    'stats.productores.description': 'In the co-production network',
    'stats.cultivos.label': 'Crops',
    'stats.cultivos.description': 'Diversified vegetables',
    'stats.trazabilidad.label': 'Traceability',
    'stats.trazabilidad.description': 'Auditable products',
  },
};

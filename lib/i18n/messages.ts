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

    // ─── Ecosistema ──────────────────────────────────────────────────────────
    'eco.h2': 'Producimos desde el campo mexicano.',
    'eco.subtitle':
      'Trabajamos con pequeños y medianos agricultores para producir hortalizas de alta calidad y nos encargamos de llevar esa producción al mercado con una operación integrada:',
    'eco.flow.panelHeader': 'Flujo operativo completo — COS monitorea cada etapa',
    'eco.flow.campo.label': 'CAMPO',
    'eco.flow.campo.sub': 'Insumos',
    'eco.flow.supervision.label': 'SUPERVISIÓN',
    'eco.flow.supervision.sub': 'Precisión',
    'eco.flow.cosecha.label': 'COSECHA',
    'eco.flow.cosecha.sub': 'Calidad',
    'eco.flow.empaque.label': 'EMPAQUE',
    'eco.flow.empaque.sub': 'Inocuidad',
    'eco.flow.trazabilidad.label': 'TRAZABILIDAD',
    'eco.flow.trazabilidad.sub': 'Verificable',
    'eco.flow.logistica.label': 'LOGÍSTICA',
    'eco.flow.logistica.sub': 'Frío',
    'eco.flow.cliente.label': 'CLIENTE',
    'eco.flow.cliente.sub': 'B2B',
    'eco.clientes.kicker': 'Clientes',
    'eco.clientes.title': 'Más que proveedores, socios en su abastecimiento',
    'eco.clientes.subtitle':
      'Para quienes priorizan calidad, trazabilidad y cumplimiento.',
    'eco.beneficios.title':
      'Beneficios tangibles de nuestro modelo y zona de cobertura actualmente',
    'eco.benefit.datos.title': 'Datos operativos',
    'eco.benefit.datos.description':
      'Información verificable para auditorías, FSVP y seguimiento operativo desde nuestra plataforma.',
    'eco.benefit.trazabilidad.title': 'Trazabilidad Total',
    'eco.benefit.trazabilidad.description':
      'Auditable de extremo a extremo. Control absoluto sobre riesgos alimentarios e inocuidad.',
    'eco.benefit.calidad.title': 'Calidad Consistente',
    'eco.benefit.calidad.description':
      'Mayor porcentaje de calidad, menos rechazos, comunicación en tiempo real.',
    'eco.benefit.modelo.title': 'Modelo Vertical',
    'eco.benefit.modelo.description':
      'Un solo operador desde la siembra hasta la venta. Sin intermediarios, sin fragmentación.',
    'eco.supply.title': 'Proceso operativo de abastecimiento',
    'eco.supply.planeacion.title': 'Planeación comercial',
    'eco.supply.planeacion.description':
      'Definimos productos, volúmenes, calibres, especificaciones y ventanas de entrega para estructurar el abasto.',
    'eco.supply.ejecucion.title': 'Ejecución en origen',
    'eco.supply.ejecucion.description':
      'Seleccionamos parcelas, asignamos producción e integramos supervisión técnica y tecnología en campo.',
    'eco.supply.empaque.title': 'Empaque y entrega',
    'eco.supply.empaque.description':
      'Coordinamos empaque, cadena de frío y envío al punto de entrega acordado.',

    // ─── Productores ────────────────────────────────────────────────────────
    'prod.kicker': 'Para Pequeños y Medianos Productores',
    'prod.title': 'Crecer sin endeudarse',
    'prod.subtitle':
      'En Collecta buscamos trabajar con agricultores para construir una relación seria, clara y de largo plazo. Nos interesa sumar productores que quieran fortalecer su trabajo en campo y ampliar su capacidad de crecimiento.',
    'prod.beneficios.title': 'Beneficios para el productor',
    'prod.beneficio.apoyo.title': 'Apoyo para producir',
    'prod.beneficio.apoyo.short': 'Apoyo para producir',
    'prod.beneficio.apoyo.description':
      'Brindamos recursos al agricultor para fortalecer y aumentar su producción en campo.',
    'prod.beneficio.tec.title': 'Acompañamiento e integración de tecnología en campo',
    'prod.beneficio.tec.short': 'Tecnología en campo',
    'prod.beneficio.tec.description':
      'Respaldamos el trabajo en campo con seguimiento y herramientas para reducir fallas durante la producción.',
    'prod.beneficio.mercado.title': 'Venta de la producción en mercados de alto valor',
    'prod.beneficio.mercado.short': 'Mercados de alto valor',
    'prod.beneficio.mercado.description':
      'Colocamos la producción en mercados de exportación para cuidar el valor de cada cosecha.',
    'prod.socio.title': 'Lo que ganas siendo socio de Collecta',
    'prod.socio.subtitle':
      'Beneficios concretos que transforman la operación y la economía de tu tierra.',
    'prod.socio.insumos.title': 'Insumos sin deuda',
    'prod.socio.insumos.description':
      'Acceso continuo a insumos agrícolas sin cargos financieros ni endeudamiento.',
    'prod.socio.crecimiento.title': 'Crecimiento sostenido',
    'prod.socio.crecimiento.description':
      'Aumento progresivo de superficie de siembra ciclo tras ciclo.',
    'prod.socio.mercados.title': 'Mercados competitivos',
    'prod.socio.mercados.description':
      'Tu producción accede a canales de alto valor y clientes exigentes.',
    'prod.socio.pagos.title': 'Pagos transparentes',
    'prod.socio.pagos.description':
      'Liquidaciones claras, oportunas y verificables en cada cosecha.',
    'prod.socio.operacion.title': 'Operación integrada',
    'prod.socio.operacion.description':
      'Procesos productivos y financieros bajo una sola gestión ordenada.',

    // ─── Clientes (page section, "Por qué los clientes nos eligen") ──────────
    'clientes.heading': 'Por qué los clientes nos eligen',
    'clientes.lead':
      'No somos un broker. No somos un intermediario. Somos un operador integrado que asume la responsabilidad completa de la cadena, desde el primer surco hasta la entrega final.',
    'clientes.feature.programacion.title': 'Programación de entregas',
    'clientes.feature.programacion.description':
      'Planeación financiera y estratégica con visibilidad total.',
    'clientes.feature.comunicacion.title': 'Comunicación en tiempo real',
    'clientes.feature.comunicacion.description':
      'Acceso inmediato a datos, reportes y estado de pedidos.',
    'clientes.feature.riesgos.title': 'Control de riesgos',
    'clientes.feature.riesgos.description':
      'Documentación completa, certificaciones y trazabilidad auditable.',
    'clientes.feature.continuidad.title': 'Continuidad de abasto',
    'clientes.feature.continuidad.description':
      'Diversificación geográfica y agronómica para minimizar interrupciones.',
    'clientes.cta.title': 'Accede a tu Dashboard',
    'clientes.cta.body':
      'Como cliente Collecta, tienes acceso a la plataforma con visibilidad completa de tus pedidos, trazabilidad en vivo y comunicación directa con el equipo operativo.',
    'clientes.cta.primary': 'Ingresar a la plataforma →',
    'clientes.cta.secondary': 'Hablemos de tu cadena',
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

    // ─── Ecosistema ──────────────────────────────────────────────────────────
    'eco.h2': 'We grow from the Mexican fields.',
    'eco.subtitle':
      'We work with small and medium farmers to grow high-quality vegetables and take care of getting that production to market through an integrated operation:',
    'eco.flow.panelHeader': 'End-to-end operational flow — COS monitors every stage',
    'eco.flow.campo.label': 'FIELD',
    'eco.flow.campo.sub': 'Inputs',
    'eco.flow.supervision.label': 'OVERSIGHT',
    'eco.flow.supervision.sub': 'Precision',
    'eco.flow.cosecha.label': 'HARVEST',
    'eco.flow.cosecha.sub': 'Quality',
    'eco.flow.empaque.label': 'PACKING',
    'eco.flow.empaque.sub': 'Food safety',
    'eco.flow.trazabilidad.label': 'TRACEABILITY',
    'eco.flow.trazabilidad.sub': 'Verifiable',
    'eco.flow.logistica.label': 'LOGISTICS',
    'eco.flow.logistica.sub': 'Cold chain',
    'eco.flow.cliente.label': 'CLIENT',
    'eco.flow.cliente.sub': 'B2B',
    'eco.clientes.kicker': 'Clients',
    'eco.clientes.title': 'More than suppliers — supply partners',
    'eco.clientes.subtitle':
      'For those who prioritize quality, traceability and compliance.',
    'eco.beneficios.title':
      'Tangible benefits of our model and current coverage area',
    'eco.benefit.datos.title': 'Operational data',
    'eco.benefit.datos.description':
      'Verifiable information for audits, FSVP and operational tracking from our platform.',
    'eco.benefit.trazabilidad.title': 'Full traceability',
    'eco.benefit.trazabilidad.description':
      'Auditable end to end. Full control over food safety and integrity risks.',
    'eco.benefit.calidad.title': 'Consistent quality',
    'eco.benefit.calidad.description':
      'Higher quality rates, fewer rejections, real-time communication.',
    'eco.benefit.modelo.title': 'Vertical model',
    'eco.benefit.modelo.description':
      'A single operator from sowing to sale. No middlemen, no fragmentation.',
    'eco.supply.title': 'Supply operational process',
    'eco.supply.planeacion.title': 'Commercial planning',
    'eco.supply.planeacion.description':
      'We define products, volumes, sizes, specs and delivery windows to structure the supply.',
    'eco.supply.ejecucion.title': 'On-origin execution',
    'eco.supply.ejecucion.description':
      'We select plots, allocate production and integrate technical oversight and field technology.',
    'eco.supply.empaque.title': 'Packing and delivery',
    'eco.supply.empaque.description':
      'We coordinate packing, cold chain and shipping to the agreed delivery point.',

    // ─── Productores ────────────────────────────────────────────────────────
    'prod.kicker': 'For Small and Mid-Sized Producers',
    'prod.title': 'Grow without taking on debt',
    'prod.subtitle':
      'At Collecta we partner with farmers to build serious, transparent and long-term relationships. We want to add producers who want to strengthen their fieldwork and expand their capacity to grow.',
    'prod.beneficios.title': 'Benefits for the producer',
    'prod.beneficio.apoyo.title': 'Support to produce',
    'prod.beneficio.apoyo.short': 'Support to produce',
    'prod.beneficio.apoyo.description':
      'We provide farmers with resources to strengthen and increase their field production.',
    'prod.beneficio.tec.title': 'Support and integration of in-field technology',
    'prod.beneficio.tec.short': 'In-field technology',
    'prod.beneficio.tec.description':
      'We back fieldwork with tracking and tools to reduce production failures.',
    'prod.beneficio.mercado.title': 'Selling production in high-value markets',
    'prod.beneficio.mercado.short': 'High-value markets',
    'prod.beneficio.mercado.description':
      'We place production in export markets to preserve the value of every harvest.',
    'prod.socio.title': 'What you gain as a Collecta partner',
    'prod.socio.subtitle':
      'Concrete benefits that transform the operation and economics of your land.',
    'prod.socio.insumos.title': 'Inputs without debt',
    'prod.socio.insumos.description':
      'Continuous access to agricultural inputs without finance charges or debt.',
    'prod.socio.crecimiento.title': 'Sustained growth',
    'prod.socio.crecimiento.description':
      'Progressive increase of planted area cycle after cycle.',
    'prod.socio.mercados.title': 'Competitive markets',
    'prod.socio.mercados.description':
      'Your production reaches high-value channels and demanding clients.',
    'prod.socio.pagos.title': 'Transparent payments',
    'prod.socio.pagos.description':
      'Clear, timely and verifiable settlements on every harvest.',
    'prod.socio.operacion.title': 'Integrated operation',
    'prod.socio.operacion.description':
      'Productive and financial processes under a single ordered management.',

    // ─── Clientes (page section, "Why clients choose us") ────────────────────
    'clientes.heading': 'Why clients choose us',
    'clientes.lead':
      'We are not a broker. We are not a middleman. We are an integrated operator that takes full responsibility for the supply chain, from the first furrow to the final delivery.',
    'clientes.feature.programacion.title': 'Delivery scheduling',
    'clientes.feature.programacion.description':
      'Financial and strategic planning with full visibility.',
    'clientes.feature.comunicacion.title': 'Real-time communication',
    'clientes.feature.comunicacion.description':
      'Immediate access to data, reports and order status.',
    'clientes.feature.riesgos.title': 'Risk control',
    'clientes.feature.riesgos.description':
      'Complete documentation, certifications and auditable traceability.',
    'clientes.feature.continuidad.title': 'Supply continuity',
    'clientes.feature.continuidad.description':
      'Geographic and agronomic diversification to minimize disruptions.',
    'clientes.cta.title': 'Access your Dashboard',
    'clientes.cta.body':
      'As a Collecta client, you have access to the platform with full visibility of your orders, live traceability and direct communication with the operations team.',
    'clientes.cta.primary': 'Enter the platform →',
    'clientes.cta.secondary': 'Let’s talk about your supply chain',
  },
};

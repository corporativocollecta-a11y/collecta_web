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

    // ─── Misión y Visión ────────────────────────────────────────────────────
    'mv.kicker': 'Nuestra razón de ser',
    'mv.mision.title': 'Misión',
    'mv.mision.body':
      'Fortalecer a los productores agrícolas que sostienen el sistema alimentario del mundo.',
    'mv.vision.title': 'Visión',
    'mv.vision.body':
      'Transformar estructuralmente el sistema agroalimentario en una operación trazable, tecnológica y sostenible, generando valor para productores, mercados y comunidades.',

    // ─── Ecosistema ──────────────────────────────────────────────────────────
    'eco.h2': 'Producimos desde el campo mexicano.',
    'eco.subtitle':
      'Trabajamos con pequeños y medianos agricultores para producir hortalizas de alta calidad y nos encargamos de llevar esa producción al mercado con una operación integrada:',
    'eco.flow.panelHeader': 'Flujo operativo completo — COS monitorea cada etapa',
    'eco.flow.campo.label': 'CAMPO',
    'eco.flow.campo.sub': 'Insumos',
    'eco.flow.tecnologia.label': 'TECNOLOGÍA',
    'eco.flow.tecnologia.sub': 'Precisión',
    'eco.flow.supervision.label': 'SUPERVISIÓN',
    'eco.flow.supervision.sub': 'Control',
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

    // ─── Impacto ────────────────────────────────────────────────────────────
    'impacto.kicker': 'Impacto Medible y Escalable',
    'impacto.title': 'Transformación con propósito',
    'impacto.subtitle':
      'No medimos solo producción. Medimos el cambio sistémico que generamos en la cadena agroalimentaria, la economía rural y la sostenibilidad del campo mexicano.',
    'impacto.por_que.kicker': 'Por qué ahora',
    'impacto.por_que.title': 'México necesita transformación',
    'impacto.por_que.r1': 'Envejecimiento de agricultores responsables del campo',
    'impacto.por_que.r2': 'Baja tasa de acceso a crédito y seguro agrícola',
    'impacto.por_que.r3': 'Adopción tecnológica limitada en el sector',
    'impacto.por_que.r4': 'Desperdicio alimentario y estrés hídrico crecientes',
    'impacto.por_que.r5': 'Soberanía alimentaria como prioridad nacional',
    'impacto.por_que.r6': 'Inversión creciente en transformación agroindustrial',
    'impacto.areas.kicker': 'Áreas de Impacto',
    'impacto.areas.title': 'Donde generamos cambio real',
    'impacto.wheel.modelo': 'Nuestro modelo',
    'impacto.wheel.acciones': '5 acciones',
    'impacto.action.1.title': 'Invertimos en el desarrollo productivo del campo',
    'impacto.action.1.description':
      'Esto fortalece a productores con alto potencial que aún operan con recursos insuficientes para escalar su producción y mejorar sus condiciones de vida.',
    'impacto.action.2.title': 'Llevamos tecnología de precisión con propósito',
    'impacto.action.2.description':
      'Cerramos la brecha tecnológica que limita la capacidad del productor para trabajar con mejores herramientas, tomar mejores decisiones y fortalecer su producción.',
    'impacto.action.3.title': 'Reducimos la huella ambiental',
    'impacto.action.3.description':
      'Reducimos el desperdicio de alimentos, promovemos un uso más preciso del agua y una reducción del uso innecesario de agroquímicos.',
    'impacto.action.4.title': 'Acercamos al productor a prácticas más sostenibles',
    'impacto.action.4.description':
      'Ayudamos a reducir el impacto ambiental de la producción y a construir una base agrícola más sostenible a largo plazo.',
    'impacto.action.5.title': 'Ordenamos una cadena históricamente fragmentada',
    'impacto.action.5.description':
      'Permitimos una cadena trazable y articulada, con mayor valor para la producción y mejores condiciones para llevar alimentos de alta calidad al mercado.',
    'impacto.ods.kicker': 'Alineación Global',
    'impacto.ods.title': 'Objetivos de Desarrollo Sostenible',
    'impacto.ods.subtitle':
      'Nuestro modelo contribuye directamente a 6 de los 17 ODS de Naciones Unidas.',

    // ─── Contacto ───────────────────────────────────────────────────────────
    'contacto.kicker': 'Únete al ecosistema',
    'contacto.title': 'Hablemos de tu cadena',
    'contacto.subtitle':
      'Si quieres formar parte del ecosistema Collecta, ya sea como cliente, productor o aliado, escríbenos.',
    'contacto.info.email': 'Email',
    'contacto.info.location': 'Ubicación',
    'contacto.info.location.value': 'Puebla, México',
    'contacto.info.platform': 'Plataforma',
    'contacto.tab.cliente': 'Soy Cliente',
    'contacto.tab.cliente.sub': 'Comprador corporativo',
    'contacto.tab.productor': 'Soy Productor',
    'contacto.tab.productor.sub': 'Agricultor / Predio',

    // ─── Forms (FormCliente / FormProductor) ────────────────────────────────
    'form.name.label': 'Nombre',
    'form.name.placeholder': 'Tu nombre',
    'form.email.label': 'Correo electrónico',
    'form.email.placeholder': 'tu@empresa.com',
    'form.phone.label': 'Teléfono',
    'form.phone.placeholder': '+52 222 000 0000',
    'form.empresa.label': 'Empresa',
    'form.empresa.placeholder': 'Nombre de tu empresa',
    'form.estado.label': 'Estado / región',
    'form.estado.placeholder': 'Puebla',
    'form.cultivo.label': 'Cultivo principal',
    'form.cultivo.placeholder': 'Selecciona un cultivo',
    'form.cultivo.brocoli': 'Brócoli',
    'form.cultivo.coliflor': 'Coliflor',
    'form.cultivo.lechuga': 'Lechuga',
    'form.cultivo.col': 'Col',
    'form.cultivo.otro': 'Otro',
    'form.superficie.label': 'Superficie (ha)',
    'form.superficie.placeholder': '10',
    'form.volumen.label': 'Volumen estimado (cajas/semana)',
    'form.volumen.placeholder': '500',
    'form.mensaje.label': 'Mensaje',
    'form.mensaje.placeholder': 'Cuéntanos sobre tu operación…',
    'form.submit': 'Enviar solicitud',
    'form.submitting': 'Enviando…',
    'form.success': '¡Mensaje enviado! Te contactaremos pronto.',
    'form.error':
      'No se pudo enviar el mensaje. Intenta de nuevo o escríbenos a contacto@collectaproduce.com',
    'form.consent':
      'Al enviar este formulario, aceptas nuestro aviso de privacidad y que te contactemos para dar seguimiento a tu solicitud.',

    // FormCliente specific
    'fc.empresa.label': 'Nombre de la empresa',
    'fc.empresa.placeholder': 'Ej. Walmart, Chedraui…',
    'fc.contacto.label': 'Nombre completo del contacto',
    'fc.contacto.placeholder': 'Tu nombre',
    'fc.cargo.label': 'Cargo',
    'fc.cargo.placeholder': 'Selecciona tu cargo',
    'fc.cargo.compras': 'Compras',
    'fc.cargo.calidad': 'Calidad',
    'fc.cargo.supply': 'Supply Chain',
    'fc.cargo.otro': 'Otro',
    'fc.email.label': 'Email corporativo',
    'fc.email.placeholder': 'tu@empresa.com',
    'fc.telefono.label': 'Teléfono con WhatsApp',
    'fc.ubicacion.label': 'Ciudad / Estado / País',
    'fc.ubicacion.placeholder': 'Ej. Monterrey, Nuevo León, México',
    'fc.productos.label': 'Productos de interés',
    'fc.productos.placeholder': 'Ej. Tomate, pepino, pimiento…',
    'fc.productos.hint': 'Indica los cultivos que tu empresa busca abastecer',
    'fc.volumen.label': 'Volumen máximo deseado',
    'fc.volumen.placeholder': 'Ej. 10 embarques al mes',
    'fc.volumen.hint': 'Embarques estimados por mes',
    'fc.mensaje.label': 'Mensaje (opcional)',
    'fc.mensaje.placeholder': 'Cuéntanos cualquier detalle adicional sobre tu necesidad…',
    'fc.consent.label.before': 'Manifiesto mi interés de participar e integrarme al ',
    'fc.consent.label.brand': 'Ecosistema Collecta',
    'fc.submit': 'Enviar solicitud',
    'fc.submitting': 'Enviando…',
    'fc.privacy.before': 'Al enviar este formulario, aceptas nuestro ',
    'fc.privacy.link': 'aviso de privacidad',
    'fc.error.required': 'Requerido',
    'fc.error.cargo': 'Selecciona un cargo',
    'fc.error.email': 'Email no válido',
    'fc.error.tel': 'Teléfono no válido',
    'fc.error.consent': 'Debes aceptar para continuar',
    'fc.error.network': 'Error de conexión. Verifica tu internet e intenta de nuevo.',
    'fc.success.title': '¡Mensaje recibido!',
    'fc.success.body':
      'Gracias por tu interés en Collecta. Nuestro equipo se pondrá en contacto contigo a la brevedad para explorar cómo podemos colaborar.',

    // FormProductor specific
    'fp.nombre.label': 'Nombre completo',
    'fp.nombre.placeholder': 'Tu nombre completo',
    'fp.email.label': 'Email',
    'fp.email.placeholder': 'tu@email.com',
    'fp.email.hint': 'Opcional',
    'fp.edad.label': 'Edad',
    'fp.edad.placeholder': 'Ej. 45',
    'fp.celular.label': 'Celular (con WhatsApp)',
    'fp.predio.label': 'Ubicación del predio',
    'fp.predio.placeholder': 'Estado, municipio, población',
    'fp.predio.hint': 'Ej. Sinaloa, Culiacán, Costa Rica',
    'fp.hectareas.label': 'Hectáreas totales disponibles',
    'fp.hectareas.placeholder': 'Ej. 25',
    'fp.hectareas.hint': 'Superficie en hectáreas',
    'fp.experiencia.label': 'Años de experiencia',
    'fp.experiencia.placeholder': 'Ej. 15',
    'fp.experiencia.hint': 'Años trabajando el campo',
    'fp.pozo.label': '¿Cuentas con pozo de agua y/o sistema de riego?',
    'fp.pozo.si': 'Sí',
    'fp.pozo.no': 'No',
    'fp.productos.label': 'Productos con mayor experiencia',
    'fp.productos.placeholder': 'Ej. Tomate, pepino, chile…',
    'fp.productos.hint': 'Cultivos que dominas mejor',
    'fp.error.celular': 'Celular no válido',
    'fp.error.hectareas': 'Debe ser mayor a 0',
    'fp.error.experiencia': 'Debe ser un número válido',
    'fp.error.pozo': 'Selecciona una opción',
    'fp.error.edad': 'Edad debe estar entre 18 y 100',
    'fp.success.title': '¡Gracias por tu interés!',
    'fp.success.body':
      'Hemos recibido tu información. Un miembro de nuestro equipo técnico se comunicará contigo para conocer tu predio y explorar la coproducción.',

    // ─── Plataforma (login landing) ─────────────────────────────────────────
    'plataforma.title.line1': 'Trazabilidad',
    'plataforma.title.line2': 'desde el campo',
    'plataforma.title.line3': 'hasta tu mesa',
    'plataforma.subtitle':
      'Gestiona agricultores, proyectos, empaque y logística con tecnología avanzada.',
    'plataforma.stats.agricultores': 'Agricultores',
    'plataforma.stats.cajas': 'Cajas trazadas',
    'plataforma.stats.paises': 'Países destino',
    'plataforma.mobile.tagline': 'Sistema Operativo Agroalimentario',
    'plataforma.heading': 'Inicia sesión',
    'plataforma.sub': 'Accede a tu plataforma de trazabilidad',
    'plataforma.field.email': 'Correo electrónico',
    'plataforma.field.email.placeholder': 'nombre@collecta.mx',
    'plataforma.field.password': 'Contraseña',
    'plataforma.submit': 'Iniciar sesión',
    'plataforma.show.password': 'Mostrar contraseña',
    'plataforma.hide.password': 'Ocultar contraseña',
    'plataforma.footer.location': 'Puebla, México',
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
    'footer.tagline': 'For all mankind',
    'footer.col.ecosistema': 'Ecosystem',
    'footer.col.audiencias': 'For You',
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
    'hero.cta.secondary': 'Let’s talk about your supply chain',
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
    'stats.title.operacion': 'Operations by the numbers',
    'stats.hectareas.label': 'Hectares',
    'stats.hectareas.description': 'In integrated operation',
    'stats.productores.label': 'Producers',
    'stats.productores.description': 'In our co-production network',
    'stats.cultivos.label': 'Crops',
    'stats.cultivos.description': 'Diversified vegetable crops',
    'stats.trazabilidad.label': 'Traceability',
    'stats.trazabilidad.description': 'Auditable products',

    // ─── Misión y Visión ────────────────────────────────────────────────────
    'mv.kicker': 'Our purpose',
    'mv.mision.title': 'Mission',
    'mv.mision.body':
      'To empower the agricultural producers who sustain the world’s food system.',
    'mv.vision.title': 'Vision',
    'mv.vision.body':
      'To fundamentally transform the agri-food system into a traceable, technology-driven and sustainable operation that creates value for producers, markets and communities.',

    // ─── Ecosistema ──────────────────────────────────────────────────────────
    'eco.h2': 'Grown in the Mexican fields.',
    'eco.subtitle':
      'We work with small and mid-sized farmers to grow high-quality vegetables and bring that production to market through an integrated operation:',
    'eco.flow.panelHeader': 'End-to-end operational flow — COS monitors every stage',
    'eco.flow.campo.label': 'FIELD',
    'eco.flow.campo.sub': 'Inputs',
    'eco.flow.tecnologia.label': 'TECHNOLOGY',
    'eco.flow.tecnologia.sub': 'Precision',
    'eco.flow.supervision.label': 'OVERSIGHT',
    'eco.flow.supervision.sub': 'Control',
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
      'Tangible benefits of our model and where we operate today',
    'eco.benefit.datos.title': 'Operational data',
    'eco.benefit.datos.description':
      'Verifiable information for audits, FSVP and operational tracking from our platform.',
    'eco.benefit.trazabilidad.title': 'Full traceability',
    'eco.benefit.trazabilidad.description':
      'Auditable end to end. Full control over food safety risks.',
    'eco.benefit.calidad.title': 'Consistent quality',
    'eco.benefit.calidad.description':
      'Higher quality rates, fewer rejections, and real-time communication.',
    'eco.benefit.modelo.title': 'Vertical model',
    'eco.benefit.modelo.description':
      'A single operator from sowing to sale. No middlemen, no fragmentation.',
    'eco.supply.title': 'Our supply process',
    'eco.supply.planeacion.title': 'Commercial planning',
    'eco.supply.planeacion.description':
      'We define products, volumes, sizes, specs and delivery windows to structure supply.',
    'eco.supply.ejecucion.title': 'Execution at origin',
    'eco.supply.ejecucion.description':
      'We select plots, allocate production, and integrate technical oversight and field technology.',
    'eco.supply.empaque.title': 'Packing and delivery',
    'eco.supply.empaque.description':
      'We coordinate packing, cold chain and shipping to the agreed delivery point.',

    // ─── Productores ────────────────────────────────────────────────────────
    'prod.kicker': 'For Small and Mid-Sized Producers',
    'prod.title': 'Grow without taking on debt',
    'prod.subtitle':
      'At Collecta we partner with farmers to build serious, transparent and long-term relationships. We’re looking for producers who want to strengthen their fieldwork and expand their capacity to grow.',
    'prod.beneficios.title': 'Benefits for the producer',
    'prod.beneficio.apoyo.title': 'Support to produce',
    'prod.beneficio.apoyo.short': 'Support to produce',
    'prod.beneficio.apoyo.description':
      'We provide farmers with resources to strengthen and increase their field production.',
    'prod.beneficio.tec.title': 'Field support and technology integration',
    'prod.beneficio.tec.short': 'Field technology',
    'prod.beneficio.tec.description':
      'We back fieldwork with monitoring and tools to reduce production losses.',
    'prod.beneficio.mercado.title': 'Selling into high-value markets',
    'prod.beneficio.mercado.short': 'High-value markets',
    'prod.beneficio.mercado.description':
      'We place your production into export markets to preserve the value of every harvest.',
    'prod.socio.title': 'What you gain as a Collecta partner',
    'prod.socio.subtitle':
      'Concrete benefits that transform the operations and economics of your farm.',
    'prod.socio.insumos.title': 'Inputs without debt',
    'prod.socio.insumos.description':
      'Continuous access to agricultural inputs without finance charges or debt.',
    'prod.socio.crecimiento.title': 'Sustained growth',
    'prod.socio.crecimiento.description':
      'Progressive increase of planted area, cycle after cycle.',
    'prod.socio.mercados.title': 'Competitive markets',
    'prod.socio.mercados.description':
      'Your production reaches high-value channels and demanding clients.',
    'prod.socio.pagos.title': 'Transparent payments',
    'prod.socio.pagos.description':
      'Clear, timely and verifiable settlements on every harvest.',
    'prod.socio.operacion.title': 'Integrated operation',
    'prod.socio.operacion.description':
      'Production and finance unified under a single, structured management.',

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
    'clientes.cta.primary': 'Access the platform →',
    'clientes.cta.secondary': 'Let’s talk about your supply chain',

    // ─── Impacto ────────────────────────────────────────────────────────────
    'impacto.kicker': 'Measurable and Scalable Impact',
    'impacto.title': 'Transformation with purpose',
    'impacto.subtitle':
      'We don’t measure production alone. We measure the systemic change we generate in the agri-food chain, the rural economy, and the sustainability of the Mexican countryside.',
    'impacto.por_que.kicker': 'Why now',
    'impacto.por_que.title': 'Mexico needs transformation',
    'impacto.por_que.r1': 'Aging population of farmers managing the fields',
    'impacto.por_que.r2': 'Low access to agricultural credit and insurance',
    'impacto.por_que.r3': 'Limited tech adoption across the sector',
    'impacto.por_que.r4': 'Rising food waste and water stress',
    'impacto.por_que.r5': 'Food sovereignty as a national priority',
    'impacto.por_que.r6': 'Growing investment in agribusiness transformation',
    'impacto.areas.kicker': 'Impact Areas',
    'impacto.areas.title': 'Where we generate real change',
    'impacto.wheel.modelo': 'Our model',
    'impacto.wheel.acciones': '5 actions',
    'impacto.action.1.title': 'We invest in productive development in the field',
    'impacto.action.1.description':
      'This strengthens high-potential producers who still operate with insufficient resources to scale production and improve their living conditions.',
    'impacto.action.2.title': 'We bring purpose-driven precision technology',
    'impacto.action.2.description':
      'We close the technological gap that limits the producer’s capacity to work with better tools, make better decisions and strengthen their production.',
    'impacto.action.3.title': 'We reduce environmental footprint',
    'impacto.action.3.description':
      'We reduce food waste, promote more precise water use and a reduction of unnecessary agrochemical use.',
    'impacto.action.4.title': 'We help producers adopt more sustainable practices',
    'impacto.action.4.description':
      'We help reduce the environmental impact of production and build a more sustainable agricultural base for the long term.',
    'impacto.action.5.title': 'We bring order to a historically fragmented chain',
    'impacto.action.5.description':
      'We enable a traceable, coordinated chain with greater value for production and better conditions to bring high-quality food to market.',
    'impacto.ods.kicker': 'Global Alignment',
    'impacto.ods.title': 'Sustainable Development Goals',
    'impacto.ods.subtitle':
      'Our model directly contributes to 6 of the United Nations’ 17 SDGs.',

    // ─── Contacto ───────────────────────────────────────────────────────────
    'contacto.kicker': 'Join the ecosystem',
    'contacto.title': 'Let’s talk about your supply chain',
    'contacto.subtitle':
      'If you want to be part of the Collecta ecosystem — whether as a client, producer or partner — reach out.',
    'contacto.info.email': 'Email',
    'contacto.info.location': 'Location',
    'contacto.info.location.value': 'Puebla, Mexico',
    'contacto.info.platform': 'Platform',
    'contacto.tab.cliente': 'I’m a Client',
    'contacto.tab.cliente.sub': 'Corporate buyer',
    'contacto.tab.productor': 'I’m a Producer',
    'contacto.tab.productor.sub': 'Farmer / Land',

    // ─── Forms (FormCliente / FormProductor) ────────────────────────────────
    'form.name.label': 'Name',
    'form.name.placeholder': 'Your name',
    'form.email.label': 'Email',
    'form.email.placeholder': 'you@company.com',
    'form.phone.label': 'Phone',
    'form.phone.placeholder': '+52 222 000 0000',
    'form.empresa.label': 'Company',
    'form.empresa.placeholder': 'Your company name',
    'form.estado.label': 'State / region',
    'form.estado.placeholder': 'Puebla',
    'form.cultivo.label': 'Main crop',
    'form.cultivo.placeholder': 'Select a crop',
    'form.cultivo.brocoli': 'Broccoli',
    'form.cultivo.coliflor': 'Cauliflower',
    'form.cultivo.lechuga': 'Lettuce',
    'form.cultivo.col': 'Cabbage',
    'form.cultivo.otro': 'Other',
    'form.superficie.label': 'Acreage (ha)',
    'form.superficie.placeholder': '10',
    'form.volumen.label': 'Estimated volume (boxes/week)',
    'form.volumen.placeholder': '500',
    'form.mensaje.label': 'Message',
    'form.mensaje.placeholder': 'Tell us about your operation…',
    'form.submit': 'Submit request',
    'form.submitting': 'Sending…',
    'form.success': 'Message sent! We’ll be in touch soon.',
    'form.error':
      'Could not send the message. Please try again or write to contacto@collectaproduce.com',
    'form.consent':
      'By submitting this form, you accept our privacy notice and that we contact you to follow up on your request.',

    // FormCliente specific
    'fc.empresa.label': 'Company name',
    'fc.empresa.placeholder': 'e.g. Walmart, Chedraui…',
    'fc.contacto.label': 'Full contact name',
    'fc.contacto.placeholder': 'Your name',
    'fc.cargo.label': 'Role',
    'fc.cargo.placeholder': 'Select your role',
    'fc.cargo.compras': 'Procurement',
    'fc.cargo.calidad': 'Quality',
    'fc.cargo.supply': 'Supply Chain',
    'fc.cargo.otro': 'Other',
    'fc.email.label': 'Corporate email',
    'fc.email.placeholder': 'you@company.com',
    'fc.telefono.label': 'Phone with WhatsApp',
    'fc.ubicacion.label': 'City / State / Country',
    'fc.ubicacion.placeholder': 'e.g. Monterrey, Nuevo León, Mexico',
    'fc.productos.label': 'Products of interest',
    'fc.productos.placeholder': 'e.g. Tomato, cucumber, pepper…',
    'fc.productos.hint': 'Indicate the crops your company seeks to source',
    'fc.volumen.label': 'Maximum desired volume',
    'fc.volumen.placeholder': 'e.g. 10 shipments per month',
    'fc.volumen.hint': 'Estimated shipments per month',
    'fc.mensaje.label': 'Message (optional)',
    'fc.mensaje.placeholder': 'Tell us any additional detail about your need…',
    'fc.consent.label.before': 'I express my interest in participating and joining the ',
    'fc.consent.label.brand': 'Collecta Ecosystem',
    'fc.submit': 'Submit request',
    'fc.submitting': 'Sending…',
    'fc.privacy.before': 'By submitting this form, you accept our ',
    'fc.privacy.link': 'privacy notice',
    'fc.error.required': 'Required',
    'fc.error.cargo': 'Select a role',
    'fc.error.email': 'Invalid email',
    'fc.error.tel': 'Invalid phone',
    'fc.error.consent': 'You must accept to continue',
    'fc.error.network': 'Connection error. Check your network and try again.',
    'fc.success.title': 'Message received!',
    'fc.success.body':
      'Thanks for your interest in Collecta. Our team will be in touch shortly to explore how we can collaborate.',

    // FormProductor specific
    'fp.nombre.label': 'Full name',
    'fp.nombre.placeholder': 'Your full name',
    'fp.email.label': 'Email',
    'fp.email.placeholder': 'you@email.com',
    'fp.email.hint': 'Optional',
    'fp.edad.label': 'Age',
    'fp.edad.placeholder': 'e.g. 45',
    'fp.celular.label': 'Mobile (with WhatsApp)',
    'fp.predio.label': 'Farm location',
    'fp.predio.placeholder': 'State, municipality, town',
    'fp.predio.hint': 'e.g. Sinaloa, Culiacán, Costa Rica',
    'fp.hectareas.label': 'Total available hectares',
    'fp.hectareas.placeholder': 'e.g. 25',
    'fp.hectareas.hint': 'Area in hectares',
    'fp.experiencia.label': 'Years of experience',
    'fp.experiencia.placeholder': 'e.g. 15',
    'fp.experiencia.hint': 'Years working the field',
    'fp.pozo.label': 'Do you have a water well and/or irrigation system?',
    'fp.pozo.si': 'Yes',
    'fp.pozo.no': 'No',
    'fp.productos.label': 'Products you have most experience with',
    'fp.productos.placeholder': 'e.g. Tomato, cucumber, chili…',
    'fp.productos.hint': 'Crops you handle best',
    'fp.error.celular': 'Invalid mobile number',
    'fp.error.hectareas': 'Must be greater than 0',
    'fp.error.experiencia': 'Must be a valid number',
    'fp.error.pozo': 'Select an option',
    'fp.error.edad': 'Age must be between 18 and 100',
    'fp.success.title': 'Thank you for your interest!',
    'fp.success.body':
      'We have received your information. A member of our technical team will reach out to learn about your farm and explore co-production.',

    // ─── Plataforma (login landing) ─────────────────────────────────────────
    'plataforma.title.line1': 'Traceability',
    'plataforma.title.line2': 'from the field',
    'plataforma.title.line3': 'to your table',
    'plataforma.subtitle':
      'Manage farmers, projects, packing and logistics with advanced technology.',
    'plataforma.stats.agricultores': 'Farmers',
    'plataforma.stats.cajas': 'Traced boxes',
    'plataforma.stats.paises': 'Destination countries',
    'plataforma.mobile.tagline': 'Agri-food Operating System',
    'plataforma.heading': 'Sign in',
    'plataforma.sub': 'Access your traceability platform',
    'plataforma.field.email': 'Email',
    'plataforma.field.email.placeholder': 'name@collecta.mx',
    'plataforma.field.password': 'Password',
    'plataforma.submit': 'Sign in',
    'plataforma.show.password': 'Show password',
    'plataforma.hide.password': 'Hide password',
    'plataforma.footer.location': 'Puebla, Mexico',
  },
};

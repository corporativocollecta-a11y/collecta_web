'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SectionContainer } from '@/components/layout/SectionContainer';

export default function TerminosPage() {
  return (
    <>
      <Header />

      <main className="flex flex-col w-full">
        <SectionContainer background="white" padding="lg">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-brand-green">Términos y Condiciones</h1>

            <div className="mb-6 text-gray-600">
              <p><strong>Collecta Produce LLC</strong></p>
              <p><strong>Versión Final: Enero 2026</strong></p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">1. Identidad Corporativa</h2>
            <p>
              Sitio operado por Collecta Produce LLC (EIN: 30-1388667). Collecta puede operar a través de Distribuidor Interactivo Tameme S.A.P.I. de C.V. (RFC: DIT200601QZ7) en México, bajo su autoridad y control.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">2. Aceptación de Términos</h2>
            <p>
              Al usar collectaproduce.com, acepta estos Términos. Si no acepta, no continúe.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">3. Restricción de Edad</h2>
            <p>
              Exclusivamente para mayores de 18 años. Declara bajo protesta tener edad legal para contratar.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">4. Naturaleza del Sitio Web</h2>
            <p>
              Plataforma B2B para contacto comercial. No es tienda automatizada. Toda transacción requiere negociación directa y contrato separado.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">5. Carácter Informativo del Contenido</h2>
            <p>
              Toda información (precios, especificaciones, disponibilidad) es informativa y puede cambiar sin previo aviso. No constituye oferta vinculante.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">6. Admisión No Automática</h2>
            <p>
              <strong>Para Productores:</strong> Llenar formulario ≠ admisión. Collecta elige productores. Requiere aprobación escrita y contrato.
            </p>
            <p className="mt-2">
              <strong>Para Clientes:</strong> Collecta elige sus clientes evaluando capacidad, referencias y cumplimiento. No hay garantía de aceptación.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">7. Cumplimiento Normativo</h2>
            <p>
              Clientes se comprometen a cumplir TODAS las leyes en su jurisdicción: importación/exportación, aduanales, sanitarias, laborales, fiscales, ambientales.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">8. Confidencialidad</h2>
            <p>
              Información sobre productores, capacidades, volúmenes es CONFIDENCIAL. Prohibida redistribución. Violación = terminación + acciones legales.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">9. Seguridad de Cuenta</h2>
            <p>
              Usuario responsable de credenciales. Notifique inmediatamente acceso no autorizado. Collecta NO responsable por negligencia del usuario.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">10. Uso Aceptable</h2>
            <p>
              Use con fines comerciales legales. Prohibido: malware, scraping, botting. Collecta puede terminar acceso por violaciones.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">11. Propiedad Intelectual</h2>
            <p>
              Todo contenido es propiedad exclusiva de Collecta. Prohibida reproducción sin consentimiento escrito.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">12. Notificación DMCA</h2>
            <p>
              Para infracción de copyright, notifique a: <a href="mailto:legal@collectaproduce.com" className="text-brand-green hover:underline">legal@collectaproduce.com</a>
            </p>
            <p className="mt-2">
              Incluya: firma electrónica, identificación de obra original, ubicación del contenido, declaración de buena fe, declaración bajo pena de perjurio.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">13. Garantías y Riesgos Agroindustriales</h2>
            <p><strong>GARANTÍAS DE COLLECTA:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Aplicación de insumos seguros, certificados</li>
              <li>Supervisión técnica conforme inspecciones semanales documentadas</li>
              <li>Seguimiento detallado Y DOCUMENTADO de cada aplicación</li>
              <li>Actuación diligente conforme estándares agrícolas reconocidos</li>
              <li>Trazabilidad completa desde origen hasta entrega</li>
            </ul>

            <p className="mt-4">
              <strong>LO QUE NO GARANTIZA:</strong> Rendimientos específicos, calidad visual final, resultados comerciales.
            </p>

            <p className="mt-4">
              <strong>DEFINICIÓN - CASO FORTUITO Y FUERZA MAYOR:</strong> Eventos imprevisibles, inevitables, fuera de control razonable de Collecta, incluyendo: variabilidad climática extrema, plagas, enfermedades fitosanitarias, cambios edáficos, fluctuaciones de mercado, variabilidad organoléptica, eventos naturales catastróficos, actos de autoridad pública, o cualquier factor inherente al sector agroindustrial.
            </p>

            <p className="mt-4">
              <strong>DESLINDE:</strong> Collecta Produce LLC (EIN: 30-1388667) y Distribuidor Interactivo Tameme (RFC: DIT200601QZ7) quedan COMPLETAMENTE DESINDADAS Y EXIMIDAS de TODA responsabilidad derivada de caso fortuito, fuerza mayor, eventos climáticos, plagas, variabilidad biológica, cambios de mercado, o cualquier complicación de la actividad agroindustrial. CLIENTES Y PRODUCTORES ACEPTAN EXPLÍCITAMENTE ESTAS LIMITACIONES al firmar contrato o usar servicios.
            </p>

            <p className="mt-4">
              <strong>CADENA DE FRÍO:</strong> 0-7°C, humedad 90-95%. CLIENTE responsable POST-ENTREGA. Reclamos de calidad en 48h con documentación fotográfica.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">14. Información No Vinculante</h2>
            <p>
              Precios y especificaciones son informativos. Toda compra requiere confirmación de Collecta y contrato separado con términos negociados.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">15. Reclamos de Exactitud</h2>
            <p>
              Nos esforzamos por precisión pero no garantizamos exactitud. Cualquier error reportar a: <a href="mailto:contacto@collectaproduce.com" className="text-brand-green hover:underline">contacto@collectaproduce.com</a>
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">16. Indemnización</h2>
            <p>
              Indemniza a Collecta Produce LLC, Distribuidor Interactivo Tameme, y sus directivos/empleados, de cualquier reclamación derivada de: incumplimiento de estos términos, violación de leyes, litigio con otros usuarios, incumplimiento contractual, violación de derechos de terceros, o uso del Sitio.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">17. Limitación de Responsabilidad</h2>
            <p>
              Sitio se proporciona &quot;tal cual&quot;. Collecta NO es responsable por: interrupciones de servicio, pérdida de datos, daños indirectos, lucro cesante, errores técnicos, pérdida de reputación, daños punitivos. Usa el Sitio bajo tu propio riesgo.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">18. Incidentes de Seguridad (FIPA)</h2>
            <p>
              En caso de incidente de seguridad, Collecta notificará conforme FIPA (Florida) y leyes de privacidad estatales, dentro de 30 días del descubrimiento.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">19. Enlaces Externos</h2>
            <p>
              Sitio puede incluir enlaces a terceros. Collecta no respalda ni controla estos sitios.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">20. Jurisdicción y Ley Aplicable</h2>
            <p>
              <strong>México:</strong> Leyes mexicanas, Juzgados de Puebla, Puebla.
            </p>
            <p className="mt-2">
              <strong>EE.UU.:</strong> Leyes de Florida, Juzgados Federales Distrito de Miami, Florida.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">21. Resolución de Disputas</h2>
            <p>
              Antes de litigio, las partes intentarán resolver mediante negociación directa. Si falla, se permite litigio conforme ley aplicable.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">22. Cambios a Términos</h2>
            <p>
              Collecta puede modificar estos términos. Cambios entran en vigor 30 días después de publicación. Uso continuado = aceptación.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">23. Contacto</h2>
            <ul className="space-y-2">
              <li><strong>Email General:</strong> <a href="mailto:contacto@collectaproduce.com" className="text-brand-green hover:underline">contacto@collectaproduce.com</a></li>
              <li><strong>Email Legal (DMCA):</strong> <a href="mailto:legal@collectaproduce.com" className="text-brand-green hover:underline">legal@collectaproduce.com</a></li>
              <li><strong>Dirección:</strong> 1110 Brickell Ave, Suite 200, Miami, FL 33131</li>
            </ul>

            <div className="mt-10 pt-6 border-t border-light-border text-gray-500 text-sm">
              <p><strong>Última actualización: Enero 2026</strong></p>
            </div>
          </div>
        </SectionContainer>
      </main>

      <Footer />
    </>
  );
}

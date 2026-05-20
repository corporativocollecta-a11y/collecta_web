'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SectionContainer } from '@/components/layout/SectionContainer';

export default function PrivacidadPage() {
  return (
    <>
      <Header />

      <main className="flex flex-col w-full">
        <SectionContainer background="white" padding="lg">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-brand-green">Aviso de Privacidad</h1>

            <div className="mb-6 text-gray-600">
              <p><strong>Collecta Produce LLC</strong></p>
              <p><strong>Versión Final: Mayo 2026</strong></p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">1. Responsable del Tratamiento de Datos</h2>
            <p>
              Collecta Produce LLC (EIN: 30-1388667) es responsable del tratamiento de sus datos personales en el sitio web collectaproduce.com. Collecta puede operar a través de Distribuidor Interactivo Tameme S.A.P.I. de C.V. (RFC: DIT200601QZ7) en México, bajo su autoridad.
            </p>
            <p className="mt-4"><strong>Domicilios:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Collecta Produce LLC: 1110 Brickell Ave, Suite 200, Miami, FL 33131, EE.UU.</li>
              <li>Distribuidor Interactivo Tameme: [DOMICILIO PENDIENTE]</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">2. Restricción de Edad</h2>
            <p>
              El Sitio Web es exclusivamente para mayores de 18 años. NO recopilamos información de menores de 13 años. Menores de 13-18 años solo pueden acceder con consentimiento parental.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">3. Datos Personales Recopilados</h2>
            <p>Cuando completa el formulario de contacto en collectaproduce.com, recopilamos:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Nombre de la empresa</li>
              <li>Nombre completo del contacto</li>
              <li>Cargo (Compras / Calidad / Supply Chain / Otro)</li>
              <li>Email corporativo</li>
              <li>Teléfono con WhatsApp</li>
              <li>País</li>
              <li>Ciudad/Estado/País</li>
              <li>Productos de interés (cultivos)</li>
              <li>Volumen máximo deseado (embarques/mes)</li>
              <li>Mensaje (opcional)</li>
            </ul>

            <p className="mt-4"><strong>Datos Técnicos Automáticos:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Dirección IP</li>
              <li>Navegador y sistema operativo</li>
              <li>Páginas visitadas</li>
              <li>Cookies de sesión (ver Política de Cookies)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">4. Fundamento Legal</h2>
            <p>
              Tratamiento fundamentado en: (a) ejecución de relación comercial, (b) cumplimiento legal LFPDPPP (México) y leyes de privacidad (EE.UU.), (c) interés legítimo en relaciones comerciales.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">5. Finalidades del Tratamiento</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Evaluar participación en Ecosistema Collecta</li>
              <li>Establecer relaciones comerciales</li>
              <li>Enviar información de productos y servicios</li>
              <li>Gestionar pedidos y facturación</li>
              <li>Cumplir obligaciones fiscales</li>
              <li>Resolver consultas y atención al cliente</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">6. Transferencia de Datos</h2>
            <p>
              Sus datos pueden transferirse entre Collecta Produce LLC y Distribuidor Interactivo Tameme para ejecución comercial. USTED ACEPTA EXPLÍCITAMENTE esta transferencia al enviar el formulario. Ambas entidades aplicarán igual protección.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">7. Consentimiento Explícito</h2>
            <p>
              AL ENVIAR EL FORMULARIO, USTED OTORGA CONSENTIMIENTO EXPLÍCITO mediante el checkbox: &quot;Consiento la recopilación y tratamiento de mis datos personales conforme a este Aviso de Privacidad y los Términos y Condiciones de Collecta.&quot;
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">8. Derechos ARCO</h2>
            <p>Conforme LFPDPPP, tiene derechos ARCO:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li><strong>Acceso (A):</strong> Conocer sus datos</li>
              <li><strong>Rectificación (R):</strong> Corregir datos</li>
              <li><strong>Cancelación (C):</strong> Solicitar eliminación</li>
              <li><strong>Oposición (O):</strong> Oponerse al tratamiento</li>
              <li><strong>Revocación:</strong> Revocar consentimiento en cualquier momento</li>
            </ul>
            <p className="mt-4">Solicite a: contacto@collectaproduce.com (respuesta en 20 días hábiles máximo).</p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">9. Reclamos ante Autoridades</h2>
            <p>
              Si sus derechos ARCO son vulnerados, puede presentar queja ante Instituto Nacional de Transparencia (INAI) en México: <a href="https://www.gob.mx/inai" className="text-brand-green hover:underline">www.gob.mx/inai</a>
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">10. Compartir Información</h2>
            <p>
              NO compartimos datos con terceros sin consentimiento, excepto: por ley, entre Collecta LLC y Tameme, o en transferencia de activos. NO vendemos datos.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">11. Seguridad de Datos</h2>
            <p>
              Implementamos encriptación SSL/TLS, acceso limitado a personal autorizado, y auditorías de seguridad periódicas.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">12. Incidentes de Seguridad</h2>
            <p>
              En caso de incidente de seguridad, notificaremos a autoridades y a usted conforme FIPA (Florida) y leyes aplicables, dentro de 30 días del descubrimiento.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">13. Retención de Datos</h2>
            <p>
              Retenemos datos por 5 años (obligaciones fiscales México/EE.UU.). Puede solicitar eliminación antes si la relación termina: <a href="mailto:contacto@collectaproduce.com" className="text-brand-green hover:underline">contacto@collectaproduce.com</a>
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">14. Cambios a este Aviso</h2>
            <p>
              Nos reservamos actualizar este Aviso. Los cambios se publicarán en esta página con fecha de actualización.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-brand-green">15. Contacto</h2>
            <ul className="space-y-2">
              <li><strong>Email:</strong> <a href="mailto:contacto@collectaproduce.com" className="text-brand-green hover:underline">contacto@collectaproduce.com</a></li>
              <li><strong>Dirección:</strong> 1110 Brickell Ave, Suite 200, Miami, FL 33131</li>
            </ul>

            <div className="mt-10 pt-6 border-t border-light-border text-gray-500 text-sm">
              <p><strong>Última actualización: Mayo 2026</strong></p>
            </div>
          </div>
        </SectionContainer>
      </main>

      <Footer />
    </>
  );
}

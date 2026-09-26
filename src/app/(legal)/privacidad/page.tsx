import type { Metadata } from "next";
import { LegalShell } from "../legal-shell";

export const metadata: Metadata = {
  metadataBase: new URL("https://collectaproduce.com"),
  title: "Aviso de Privacidad | Collecta",
  description:
    "Aviso de privacidad de Collecta Produce LLC: qué datos recopilamos, para qué los usamos y cómo ejercer tus derechos ARCO.",
  alternates: { canonical: "/privacidad" },
};

/* Text copied verbatim from the previous collectaproduce.com/privacidad. */
export default function Page() {
  return (
    <LegalShell>
      <h1>Aviso de Privacidad</h1>
      <p><strong>Collecta Produce LLC</strong></p>
      <p><strong>Versión Final: Mayo 2026</strong></p>
      <h2>1. Responsable del Tratamiento de Datos</h2>
      <p>Collecta Produce LLC (EIN: 30-1388667) es responsable del tratamiento de sus datos personales en el sitio web collectaproduce.com. Collecta puede operar a través de Distribuidor Interactivo Tameme S.A.P.I. de C.V. (RFC: DIT200601QZ7) en México, bajo su autoridad.</p>
      <p><strong>Domicilios:</strong></p>
      <ul>
        <li>Collecta Produce LLC: 1110 Brickell Ave, Suite 200, Miami, FL 33131, EE.UU.</li>
        <li>Distribuidor Interactivo Tameme: [DOMICILIO PENDIENTE]</li>
      </ul>
      <h2>2. Restricción de Edad</h2>
      <p>El Sitio Web es exclusivamente para mayores de 18 años. NO recopilamos información de menores de 13 años. Menores de 13-18 años solo pueden acceder con consentimiento parental.</p>
      <h2>3. Datos Personales Recopilados</h2>
      <p>Cuando completa el formulario de contacto en collectaproduce.com, recopilamos:</p>
      <ul>
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
      <p><strong>Datos Técnicos Automáticos:</strong></p>
      <ul>
        <li>Dirección IP</li>
        <li>Navegador y sistema operativo</li>
        <li>Páginas visitadas</li>
        <li>Cookies de sesión (ver Política de Cookies)</li>
      </ul>
      <h2>4. Fundamento Legal</h2>
      <p>Tratamiento fundamentado en: (a) ejecución de relación comercial, (b) cumplimiento legal LFPDPPP (México) y leyes de privacidad (EE.UU.), (c) interés legítimo en relaciones comerciales.</p>
      <h2>5. Finalidades del Tratamiento</h2>
      <ul>
        <li>Evaluar participación en Ecosistema Collecta</li>
        <li>Establecer relaciones comerciales</li>
        <li>Enviar información de productos y servicios</li>
        <li>Gestionar pedidos y facturación</li>
        <li>Cumplir obligaciones fiscales</li>
        <li>Resolver consultas y atención al cliente</li>
      </ul>
      <h2>6. Transferencia de Datos</h2>
      <p>Sus datos pueden transferirse entre Collecta Produce LLC y Distribuidor Interactivo Tameme para ejecución comercial. USTED ACEPTA EXPLÍCITAMENTE esta transferencia al enviar el formulario. Ambas entidades aplicarán igual protección.</p>
      <h2>7. Consentimiento Explícito</h2>
      <p>AL ENVIAR EL FORMULARIO, USTED OTORGA CONSENTIMIENTO EXPLÍCITO mediante el checkbox: &quot;Consiento la recopilación y tratamiento de mis datos personales conforme a este Aviso de Privacidad y los Términos y Condiciones de Collecta.&quot;</p>
      <h2>8. Derechos ARCO</h2>
      <p>Conforme LFPDPPP, tiene derechos ARCO:</p>
      <ul>
        <li><strong>Acceso (A):</strong> Conocer sus datos</li>
        <li><strong>Rectificación (R):</strong> Corregir datos</li>
        <li><strong>Cancelación (C):</strong> Solicitar eliminación</li>
        <li><strong>Oposición (O):</strong> Oponerse al tratamiento</li>
        <li><strong>Revocación:</strong> Revocar consentimiento en cualquier momento</li>
      </ul>
      <p>Solicite a: contacto@collectaproduce.com (respuesta en 20 días hábiles máximo).</p>
      <h2>9. Reclamos ante Autoridades</h2>
      <p>Si sus derechos ARCO son vulnerados, puede presentar queja ante Instituto Nacional de Transparencia (INAI) en México: <a href="https://www.gob.mx/inai" target="_blank" rel="noopener noreferrer">www.gob.mx/inai</a></p>
      <h2>10. Compartir Información</h2>
      <p>NO compartimos datos con terceros sin consentimiento, excepto: por ley, entre Collecta LLC y Tameme, o en transferencia de activos. NO vendemos datos.</p>
      <h2>11. Seguridad de Datos</h2>
      <p>Implementamos encriptación SSL/TLS, acceso limitado a personal autorizado, y auditorías de seguridad periódicas.</p>
      <h2>12. Incidentes de Seguridad</h2>
      <p>En caso de incidente de seguridad, notificaremos a autoridades y a usted conforme FIPA (Florida) y leyes aplicables, dentro de 30 días del descubrimiento.</p>
      <h2>13. Retención de Datos</h2>
      <p>Retenemos datos por 5 años (obligaciones fiscales México/EE.UU.). Puede solicitar eliminación antes si la relación termina: <a href="mailto:contacto@collectaproduce.com">contacto@collectaproduce.com</a></p>
      <h2>14. Cambios a este Aviso</h2>
      <p>Nos reservamos actualizar este Aviso. Los cambios se publicarán en esta página con fecha de actualización.</p>
      <h2>15. Contacto</h2>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:contacto@collectaproduce.com">contacto@collectaproduce.com</a></li>
        <li><strong>Dirección:</strong> 1110 Brickell Ave, Suite 200, Miami, FL 33131</li>
      </ul>
      <p><strong>Última actualización: Mayo 2026</strong></p>
    </LegalShell>
  );
}

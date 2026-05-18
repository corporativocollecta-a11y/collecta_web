'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  InputField,
  SelectField,
  TextareaField,
  CheckboxField,
} from '@/components/ui/FormField';
import { PhoneInput } from '@/components/ui/PhoneInput';

interface FormClienteData {
  empresa: string;
  nombreContacto: string;
  cargo: string;
  email: string;
  countryCode: string;
  telefono: string;
  ubicacion: string;
  productos: string;
  volumen: string;
  mensaje: string;
  consentimiento: boolean;
}

const cargoOptions = [
  { value: 'Compras', label: 'Compras' },
  { value: 'Calidad', label: 'Calidad' },
  { value: 'Supply', label: 'Supply Chain' },
  { value: 'Otro', label: 'Otro' },
];

export function FormCliente() {
  const [data, setData] = useState<FormClienteData>({
    empresa: '',
    nombreContacto: '',
    cargo: '',
    email: '',
    countryCode: '+52',
    telefono: '',
    ubicacion: '',
    productos: '',
    volumen: '',
    mensaje: '',
    consentimiento: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormClienteData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormClienteData>(
    key: K,
    value: FormClienteData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormClienteData, string>> = {};

    if (!data.empresa.trim()) newErrors.empresa = 'Requerido';
    if (!data.nombreContacto.trim()) newErrors.nombreContacto = 'Requerido';
    if (!data.cargo) newErrors.cargo = 'Selecciona un cargo';
    if (!data.email.trim()) newErrors.email = 'Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      newErrors.email = 'Email no válido';
    if (!data.telefono.trim()) newErrors.telefono = 'Requerido';
    else if (data.telefono.replace(/\D/g, '').length < 7)
      newErrors.telefono = 'Teléfono no válido';
    if (!data.ubicacion.trim()) newErrors.ubicacion = 'Requerido';
    if (!data.productos.trim()) newErrors.productos = 'Requerido';
    if (!data.volumen.trim()) newErrors.volumen = 'Requerido';
    if (!data.consentimiento)
      newErrors.consentimiento = 'Debes aceptar para continuar';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'cliente', ...data }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('Submission failed:', err);
        setErrors({
          consentimiento:
            'No se pudo enviar el mensaje. Intenta de nuevo o escríbenos a contacto@collectaproduce.com',
        });
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Network error:', err);
      setErrors({
        consentimiento:
          'Error de conexión. Verifica tu internet e intenta de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center py-16"
      >
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl"
          style={{ backgroundColor: 'rgba(45, 155, 92, 0.15)', color: '#2D9B5C' }}
        >
          ✓
        </div>
        <h3
          className="text-2xl font-bold mb-3"
          style={{ color: '#2A2A2A' }}
        >
          ¡Mensaje recibido!
        </h3>
        <p className="text-base max-w-md mx-auto" style={{ color: '#4A4A4A' }}>
          Gracias por tu interés en Collecta. Nuestro equipo se pondrá en
          contacto contigo a la brevedad para explorar cómo podemos colaborar.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField
          name="empresa"
          label="Nombre de la empresa"
          value={data.empresa}
          onChange={(v) => update('empresa', v)}
          required
          error={errors.empresa}
          placeholder="Ej. Walmart, Chedraui..."
        />
        <InputField
          name="nombreContacto"
          label="Nombre completo del contacto"
          value={data.nombreContacto}
          onChange={(v) => update('nombreContacto', v)}
          required
          error={errors.nombreContacto}
          placeholder="Tu nombre"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SelectField
          name="cargo"
          label="Cargo"
          value={data.cargo}
          onChange={(v) => update('cargo', v)}
          required
          error={errors.cargo}
          placeholder="Selecciona tu cargo"
          options={cargoOptions}
        />
        <InputField
          name="email"
          type="email"
          label="Email corporativo"
          value={data.email}
          onChange={(v) => update('email', v)}
          required
          error={errors.email}
          placeholder="tu@empresa.com"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <PhoneInput
          countryCode={data.countryCode}
          phoneNumber={data.telefono}
          onCountryCodeChange={(v) => update('countryCode', v)}
          onPhoneNumberChange={(v) => update('telefono', v)}
          required
          error={errors.telefono}
          label="Teléfono con WhatsApp"
        />

        <InputField
          name="ubicacion"
          label="Ciudad / Estado / País"
          value={data.ubicacion}
          onChange={(v) => update('ubicacion', v)}
          required
          error={errors.ubicacion}
          placeholder="Ej. Monterrey, Nuevo León, México"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField
          name="productos"
          label="Productos de interés"
          value={data.productos}
          onChange={(v) => update('productos', v)}
          required
          error={errors.productos}
          placeholder="Ej. Tomate, pepino, pimiento..."
          hint="Indica los cultivos que tu empresa busca abastecer"
        />

        <InputField
          name="volumen"
          label="Volumen máximo deseado"
          value={data.volumen}
          onChange={(v) => update('volumen', v)}
          required
          error={errors.volumen}
          placeholder="Ej. 10 embarques al mes"
          hint="Embarques estimados por mes"
        />
      </div>

      <TextareaField
        name="mensaje"
        label="Mensaje (opcional)"
        value={data.mensaje}
        onChange={(v) => update('mensaje', v)}
        placeholder="Cuéntanos cualquier detalle adicional sobre tu necesidad..."
        rows={4}
      />

      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: 'rgba(0, 255, 128, 0.08)',
          borderColor: 'rgba(0, 255, 128, 0.32)',
        }}
      >
        <CheckboxField
          name="consentimiento"
          label={
            <span>
              Manifiesto mi interés de participar e integrarme al{' '}
              <strong>Ecosistema Collecta</strong>
            </span>
          }
          checked={data.consentimiento}
          onChange={(v) => update('consentimiento', v)}
          required
          error={errors.consentimiento}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 px-6 font-semibold rounded-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95"
        style={{
          backgroundColor: '#00FF80',
          color: '#0a1a0d',
        }}
      >
        {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
      </button>

      <p
        className="text-xs text-center"
        style={{ color: '#8B7D6B' }}
      >
        Al enviar este formulario, aceptas nuestro{' '}
        <a
          href="/privacidad"
          className="underline hover:opacity-70"
          style={{ color: '#00FF80' }}
        >
          aviso de privacidad
        </a>
        .
      </p>
    </form>
  );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  InputField,
  RadioField,
  CheckboxField,
} from '@/components/ui/FormField';
import { PhoneInput } from '@/components/ui/PhoneInput';

interface FormProductorData {
  nombreCompleto: string;
  email: string;
  countryCode: string;
  celular: string;
  ubicacionPredio: string;
  hectareas: string;
  pozoRiego: string;
  experiencia: string;
  productosExperiencia: string;
  edad: string;
  consentimiento: boolean;
}

const pozoRiegoOptions = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
];

export function FormProductor() {
  const [data, setData] = useState<FormProductorData>({
    nombreCompleto: '',
    email: '',
    countryCode: '+52',
    celular: '',
    ubicacionPredio: '',
    hectareas: '',
    pozoRiego: '',
    experiencia: '',
    productosExperiencia: '',
    edad: '',
    consentimiento: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormProductorData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormProductorData>(
    key: K,
    value: FormProductorData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormProductorData, string>> = {};

    if (!data.nombreCompleto.trim()) newErrors.nombreCompleto = 'Requerido';
    // Email is optional but if provided must be valid
    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      newErrors.email = 'Email no válido';
    if (!data.celular.trim()) newErrors.celular = 'Requerido';
    else if (data.celular.replace(/\D/g, '').length < 7)
      newErrors.celular = 'Celular no válido';
    if (!data.ubicacionPredio.trim()) newErrors.ubicacionPredio = 'Requerido';
    if (!data.hectareas.trim()) newErrors.hectareas = 'Requerido';
    else if (Number(data.hectareas) <= 0)
      newErrors.hectareas = 'Debe ser mayor a 0';
    if (!data.pozoRiego) newErrors.pozoRiego = 'Selecciona una opción';
    if (!data.experiencia.trim()) newErrors.experiencia = 'Requerido';
    else if (Number(data.experiencia) < 0)
      newErrors.experiencia = 'Debe ser un número válido';
    if (!data.productosExperiencia.trim())
      newErrors.productosExperiencia = 'Requerido';
    if (!data.edad.trim()) newErrors.edad = 'Requerido';
    else if (Number(data.edad) < 18 || Number(data.edad) > 100)
      newErrors.edad = 'Edad debe estar entre 18 y 100';
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
        body: JSON.stringify({ type: 'productor', ...data }),
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
          ¡Gracias por tu interés!
        </h3>
        <p className="text-base max-w-md mx-auto" style={{ color: '#4A4A4A' }}>
          Hemos recibido tu información. Un miembro de nuestro equipo técnico se
          comunicará contigo para conocer tu predio y explorar la coproducción.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <InputField
        name="nombreCompleto"
        label="Nombre completo"
        value={data.nombreCompleto}
        onChange={(v) => update('nombreCompleto', v)}
        required
        error={errors.nombreCompleto}
        placeholder="Tu nombre completo"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField
          name="email"
          type="email"
          label="Email"
          value={data.email}
          onChange={(v) => update('email', v)}
          error={errors.email}
          placeholder="tu@email.com"
          hint="Opcional"
        />
        <InputField
          name="edad"
          type="number"
          label="Edad"
          value={data.edad}
          onChange={(v) => update('edad', v)}
          required
          error={errors.edad}
          placeholder="Ej. 45"
          min={18}
          max={100}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <PhoneInput
          countryCode={data.countryCode}
          phoneNumber={data.celular}
          onCountryCodeChange={(v) => update('countryCode', v)}
          onPhoneNumberChange={(v) => update('celular', v)}
          required
          error={errors.celular}
          label="Celular (con WhatsApp)"
        />

        <InputField
          name="ubicacionPredio"
          label="Ubicación del predio"
          value={data.ubicacionPredio}
          onChange={(v) => update('ubicacionPredio', v)}
          required
          error={errors.ubicacionPredio}
          placeholder="Estado, municipio, población"
          hint="Ej. Sinaloa, Culiacán, Costa Rica"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField
          name="hectareas"
          type="number"
          label="Hectáreas totales disponibles"
          value={data.hectareas}
          onChange={(v) => update('hectareas', v)}
          required
          error={errors.hectareas}
          placeholder="Ej. 25"
          min={1}
          hint="Superficie en hectáreas"
        />
        <InputField
          name="experiencia"
          type="number"
          label="Años de experiencia"
          value={data.experiencia}
          onChange={(v) => update('experiencia', v)}
          required
          error={errors.experiencia}
          placeholder="Ej. 15"
          min={0}
          hint="Años trabajando el campo"
        />
      </div>

      <RadioField
        name="pozoRiego"
        label="¿Cuentas con pozo de agua y/o sistema de riego?"
        value={data.pozoRiego}
        onChange={(v) => update('pozoRiego', v)}
        required
        error={errors.pozoRiego}
        options={pozoRiegoOptions}
      />

      <InputField
        name="productosExperiencia"
        label="Productos con mayor experiencia"
        value={data.productosExperiencia}
        onChange={(v) => update('productosExperiencia', v)}
        required
        error={errors.productosExperiencia}
        placeholder="Ej. Tomate, pepino, chile..."
        hint="Cultivos que dominas mejor"
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

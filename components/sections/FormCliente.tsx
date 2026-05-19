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
import { useT } from '@/lib/i18n/LocaleProvider';

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

export function FormCliente() {
  const t = useT();
  const cargoOptions = [
    { value: 'Compras', label: t('fc.cargo.compras') },
    { value: 'Calidad', label: t('fc.cargo.calidad') },
    { value: 'Supply',  label: t('fc.cargo.supply') },
    { value: 'Otro',    label: t('fc.cargo.otro') },
  ];
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

    if (!data.empresa.trim()) newErrors.empresa = t('fc.error.required');
    if (!data.nombreContacto.trim()) newErrors.nombreContacto = t('fc.error.required');
    if (!data.cargo) newErrors.cargo = t('fc.error.cargo');
    if (!data.email.trim()) newErrors.email = t('fc.error.required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      newErrors.email = t('fc.error.email');
    if (!data.telefono.trim()) newErrors.telefono = t('fc.error.required');
    else if (data.telefono.replace(/\D/g, '').length < 7)
      newErrors.telefono = t('fc.error.tel');
    if (!data.ubicacion.trim()) newErrors.ubicacion = t('fc.error.required');
    if (!data.productos.trim()) newErrors.productos = t('fc.error.required');
    if (!data.volumen.trim()) newErrors.volumen = t('fc.error.required');
    if (!data.consentimiento)
      newErrors.consentimiento = t('fc.error.consent');

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
          consentimiento: t('form.error'),
        });
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Network error:', err);
      setErrors({
        consentimiento: t('fc.error.network'),
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
          {t('fc.success.title')}
        </h3>
        <p className="text-base max-w-md mx-auto" style={{ color: '#4A4A4A' }}>
          {t('fc.success.body')}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <InputField
          name="empresa"
          label={t('fc.empresa.label')}
          value={data.empresa}
          onChange={(v) => update('empresa', v)}
          required
          error={errors.empresa}
          placeholder={t('fc.empresa.placeholder')}
        />
        <InputField
          name="nombreContacto"
          label={t('fc.contacto.label')}
          value={data.nombreContacto}
          onChange={(v) => update('nombreContacto', v)}
          required
          error={errors.nombreContacto}
          placeholder={t('fc.contacto.placeholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <SelectField
          name="cargo"
          label={t('fc.cargo.label')}
          value={data.cargo}
          onChange={(v) => update('cargo', v)}
          required
          error={errors.cargo}
          placeholder={t('fc.cargo.placeholder')}
          options={cargoOptions}
        />
        <InputField
          name="email"
          type="email"
          label={t('fc.email.label')}
          value={data.email}
          onChange={(v) => update('email', v)}
          required
          error={errors.email}
          placeholder={t('fc.email.placeholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <PhoneInput
          countryCode={data.countryCode}
          phoneNumber={data.telefono}
          onCountryCodeChange={(v) => update('countryCode', v)}
          onPhoneNumberChange={(v) => update('telefono', v)}
          required
          error={errors.telefono}
          label={t('fc.telefono.label')}
        />

        <InputField
          name="ubicacion"
          label={t('fc.ubicacion.label')}
          value={data.ubicacion}
          onChange={(v) => update('ubicacion', v)}
          required
          error={errors.ubicacion}
          placeholder={t('fc.ubicacion.placeholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <InputField
          name="productos"
          label={t('fc.productos.label')}
          value={data.productos}
          onChange={(v) => update('productos', v)}
          required
          error={errors.productos}
          placeholder={t('fc.productos.placeholder')}
          hint={t('fc.productos.hint')}
        />

        <InputField
          name="volumen"
          label={t('fc.volumen.label')}
          value={data.volumen}
          onChange={(v) => update('volumen', v)}
          required
          error={errors.volumen}
          placeholder={t('fc.volumen.placeholder')}
          hint={t('fc.volumen.hint')}
        />
      </div>

      <TextareaField
        name="mensaje"
        label={t('fc.mensaje.label')}
        value={data.mensaje}
        onChange={(v) => update('mensaje', v)}
        placeholder={t('fc.mensaje.placeholder')}
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
              {t('fc.consent.label.before')}
              <strong>{t('fc.consent.label.brand')}</strong>
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
        {isSubmitting ? t('fc.submitting') : t('fc.submit')}
      </button>

      <p
        className="text-xs text-center"
        style={{ color: '#8B7D6B' }}
      >
        {t('fc.privacy.before')}
        <a
          href="/privacidad"
          className="underline hover:opacity-70"
          style={{ color: '#00FF80' }}
        >
          {t('fc.privacy.link')}
        </a>
        .
      </p>
    </form>
  );
}

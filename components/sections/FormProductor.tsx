'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  InputField,
  RadioField,
  CheckboxField,
} from '@/components/ui/FormField';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useT } from '@/lib/i18n/LocaleProvider';

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

export function FormProductor() {
  const t = useT();
  const pozoRiegoOptions = [
    { value: 'si', label: t('fp.pozo.si') },
    { value: 'no', label: t('fp.pozo.no') },
  ];
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

    if (!data.nombreCompleto.trim()) newErrors.nombreCompleto = t('fc.error.required');
    // Email is optional but if provided must be valid
    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      newErrors.email = t('fc.error.email');
    if (!data.celular.trim()) newErrors.celular = t('fc.error.required');
    else if (data.celular.replace(/\D/g, '').length < 7)
      newErrors.celular = t('fp.error.celular');
    if (!data.ubicacionPredio.trim()) newErrors.ubicacionPredio = t('fc.error.required');
    if (!data.hectareas.trim()) newErrors.hectareas = t('fc.error.required');
    else if (Number(data.hectareas) <= 0)
      newErrors.hectareas = t('fp.error.hectareas');
    if (!data.pozoRiego) newErrors.pozoRiego = t('fp.error.pozo');
    if (!data.experiencia.trim()) newErrors.experiencia = t('fc.error.required');
    else if (Number(data.experiencia) < 0)
      newErrors.experiencia = t('fp.error.experiencia');
    if (!data.productosExperiencia.trim())
      newErrors.productosExperiencia = t('fc.error.required');
    if (!data.edad.trim()) newErrors.edad = t('fc.error.required');
    else if (Number(data.edad) < 18 || Number(data.edad) > 100)
      newErrors.edad = t('fp.error.edad');
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
        body: JSON.stringify({ type: 'productor', ...data }),
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
          {t('fp.success.title')}
        </h3>
        <p className="text-base max-w-md mx-auto" style={{ color: '#4A4A4A' }}>
          {t('fp.success.body')}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <InputField
        name="nombreCompleto"
        label={t('fp.nombre.label')}
        value={data.nombreCompleto}
        onChange={(v) => update('nombreCompleto', v)}
        required
        error={errors.nombreCompleto}
        placeholder={t('fp.nombre.placeholder')}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <InputField
          name="email"
          type="email"
          label={t('fp.email.label')}
          value={data.email}
          onChange={(v) => update('email', v)}
          error={errors.email}
          placeholder={t('fp.email.placeholder')}
          hint={t('fp.email.hint')}
        />
        <InputField
          name="edad"
          type="number"
          label={t('fp.edad.label')}
          value={data.edad}
          onChange={(v) => update('edad', v)}
          required
          error={errors.edad}
          placeholder={t('fp.edad.placeholder')}
          min={18}
          max={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <PhoneInput
          countryCode={data.countryCode}
          phoneNumber={data.celular}
          onCountryCodeChange={(v) => update('countryCode', v)}
          onPhoneNumberChange={(v) => update('celular', v)}
          required
          error={errors.celular}
          label={t('fp.celular.label')}
        />

        <InputField
          name="ubicacionPredio"
          label={t('fp.predio.label')}
          value={data.ubicacionPredio}
          onChange={(v) => update('ubicacionPredio', v)}
          required
          error={errors.ubicacionPredio}
          placeholder={t('fp.predio.placeholder')}
          hint={t('fp.predio.hint')}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <InputField
          name="hectareas"
          type="number"
          label={t('fp.hectareas.label')}
          value={data.hectareas}
          onChange={(v) => update('hectareas', v)}
          required
          error={errors.hectareas}
          placeholder={t('fp.hectareas.placeholder')}
          min={1}
          hint={t('fp.hectareas.hint')}
        />
        <InputField
          name="experiencia"
          type="number"
          label={t('fp.experiencia.label')}
          value={data.experiencia}
          onChange={(v) => update('experiencia', v)}
          required
          error={errors.experiencia}
          placeholder={t('fp.experiencia.placeholder')}
          min={0}
          hint={t('fp.experiencia.hint')}
        />
      </div>

      <RadioField
        name="pozoRiego"
        label={t('fp.pozo.label')}
        value={data.pozoRiego}
        onChange={(v) => update('pozoRiego', v)}
        required
        error={errors.pozoRiego}
        options={pozoRiegoOptions}
      />

      <InputField
        name="productosExperiencia"
        label={t('fp.productos.label')}
        value={data.productosExperiencia}
        onChange={(v) => update('productosExperiencia', v)}
        required
        error={errors.productosExperiencia}
        placeholder={t('fp.productos.placeholder')}
        hint={t('fp.productos.hint')}
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

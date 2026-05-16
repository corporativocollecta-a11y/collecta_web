'use client';

import React from 'react';

const COUNTRY_CODES = [
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'México' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'Estados Unidos / Canadá' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Perú' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panamá' },
  { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'España' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brasil' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'Reino Unido' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'Francia' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Alemania' },
];

interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (phone: string) => void;
  required?: boolean;
  error?: string;
  label?: string;
}

export function PhoneInput({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  required = false,
  error,
  label = 'Teléfono',
}: PhoneInputProps) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-2"
        style={{ color: '#2A2A2A' }}
      >
        {label} {required && <span style={{ color: '#D84242' }}>*</span>}
      </label>
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className="px-3 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all bg-white"
          style={{
            borderColor: error ? '#D84242' : '#E0DDD6',
            color: '#2A2A2A',
            minWidth: '110px',
          }}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code + c.country} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) =>
            onPhoneNumberChange(e.target.value.replace(/[^0-9\s-]/g, ''))
          }
          required={required}
          placeholder="55 1234 5678"
          className="flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
          style={{
            borderColor: error ? '#D84242' : '#E0DDD6',
            color: '#2A2A2A',
          }}
        />
      </div>
      {error && (
        <p className="text-xs mt-1" style={{ color: '#D84242' }}>
          {error}
        </p>
      )}
    </div>
  );
}

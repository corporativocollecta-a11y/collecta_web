'use client';

import React from 'react';

interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  name: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'tel' | 'number';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
}

export function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required,
  error,
  hint,
  placeholder,
  min,
  max,
}: InputFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium mb-2"
        style={{ color: '#2A2A2A' }}
      >
        {label} {required && <span style={{ color: '#D84242' }}>*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent transition-all"
        style={{
          borderColor: error ? '#D84242' : '#E0DDD6',
          color: '#2A2A2A',
          focusRingColor: '#00FF80',
        }}
      />
      {hint && !error && (
        <p className="text-xs mt-1" style={{ color: '#8B7D6B' }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs mt-1" style={{ color: '#D84242' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  required,
  error,
  hint,
  options,
  placeholder,
}: SelectFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium mb-2"
        style={{ color: '#2A2A2A' }}
      >
        {label} {required && <span style={{ color: '#D84242' }}>*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full h-11 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-white cursor-pointer appearance-none"
        style={{
          borderColor: error ? '#D84242' : '#E0DDD6',
          color: '#2A2A2A',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232A2A2A' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 1rem center',
          paddingRight: '2.5rem',
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p className="text-xs mt-1" style={{ color: '#8B7D6B' }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs mt-1" style={{ color: '#D84242' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}

export function TextareaField({
  label,
  name,
  value,
  onChange,
  required,
  error,
  hint,
  placeholder,
  rows = 4,
}: TextareaFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium mb-2"
        style={{ color: '#2A2A2A' }}
      >
        {label} {required && <span style={{ color: '#D84242' }}>*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
        style={{
          borderColor: error ? '#D84242' : '#E0DDD6',
          color: '#2A2A2A',
        }}
      />
      {hint && !error && (
        <p className="text-xs mt-1" style={{ color: '#8B7D6B' }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs mt-1" style={{ color: '#D84242' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface RadioFieldProps extends BaseFieldProps {
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function RadioField({
  label,
  name,
  value,
  onChange,
  required,
  error,
  hint,
  options,
}: RadioFieldProps) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-3"
        style={{ color: '#2A2A2A' }}
      >
        {label} {required && <span style={{ color: '#D84242' }}>*</span>}
      </label>
      <div className="flex gap-3 flex-wrap">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all"
            style={{
              borderColor:
                value === opt.value ? '#F59E0B' : '#E0DDD6',
              backgroundColor:
                value === opt.value ? 'rgba(245, 158, 11, 0.1)' : 'white',
              color: '#2A2A2A',
            }}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange(e.target.value)}
              required={required}
              className="accent-amber-700"
              style={{ accentColor: '#F59E0B' }}
            />
            <span className="text-sm font-medium">{opt.label}</span>
          </label>
        ))}
      </div>
      {hint && !error && (
        <p className="text-xs mt-1" style={{ color: '#8B7D6B' }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs mt-1" style={{ color: '#D84242' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface CheckboxFieldProps {
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  name: string;
}

export function CheckboxField({
  label,
  checked,
  onChange,
  required,
  error,
  name,
}: CheckboxFieldProps) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          className="mt-1 w-5 h-5 cursor-pointer flex-shrink-0"
          style={{ accentColor: '#F59E0B' }}
        />
        <span className="text-sm leading-relaxed" style={{ color: '#2A2A2A' }}>
          {label}{' '}
          {required && <span style={{ color: '#D84242' }}>*</span>}
        </span>
      </label>
      {error && (
        <p className="text-xs mt-1 ml-8" style={{ color: '#D84242' }}>
          {error}
        </p>
      )}
    </div>
  );
}

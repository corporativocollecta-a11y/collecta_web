'use client';

import { useEffect, useState } from 'react';

/**
 * /plataforma — landing visual del login de la plataforma de trazabilidad
 * Collecta. Ported desde apps/web/src/features/auth/LoginPage.tsx.
 *
 * Esta página NO ejecuta auth real: el submit del form redirige al subdominio
 * de la app (app.collectaproduce.com/login) donde vive el flow real con su
 * propio backend, store de auth y router protegido.
 */

const PLATFORM_LOGIN_URL = 'https://app.collectaproduce.com/login';

function useAnimatedCounter({
  end,
  duration = 2000,
  delay = 0,
  format,
}: {
  end: number;
  duration?: number;
  delay?: number;
  format?: (value: number) => string;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      const startTime = performance.now();
      let raf = 0;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(end * eased));
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        }
      };

      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [end, duration, delay]);

  return format ? format(value) : value.toString();
}

export default function PlataformaPage() {
  const [showPassword, setShowPassword] = useState(false);

  const agricultoresCount = useAnimatedCounter({
    end: 100,
    duration: 2000,
    delay: 300,
    format: (v) => `${v}+`,
  });
  const cajasCount = useAnimatedCounter({
    end: 50000,
    duration: 2500,
    delay: 400,
    format: (v) => `${(v / 1000).toFixed(0)}K+`,
  });
  const paisesCount = useAnimatedCounter({
    end: 8,
    duration: 1500,
    delay: 500,
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/plataforma/campo-atardecer.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay oscuro para legibilidad del formulario */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* ── Lado izquierdo — contenido visual ────────────────────────────────── */}
          <div className="hidden lg:flex flex-col justify-between h-full animate-fade-in min-h-[480px]">
            {/* Logo y titulo */}
            <div className="space-y-8">
              <div>
                <img
                  src="/plataforma/logo-plataforma.png"
                  alt="Collecta"
                  className="h-10 w-auto brightness-0 invert"
                />
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl xl:text-6xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                  Trazabilidad
                  <br />
                  <span className="text-cyan-300">desde el campo</span>
                  <br />
                  hasta tu mesa
                </h1>
                <p className="text-gray-100 text-lg leading-relaxed max-w-md drop-shadow-md">
                  Gestiona agricultores, proyectos, empaque y logística con tecnología avanzada.
                </p>
              </div>
            </div>

            {/* Contadores */}
            <div className="grid grid-cols-3 gap-4 mt-12">
              {[
                { label: 'Agricultores', value: agricultoresCount },
                { label: 'Cajas trazadas', value: cajasCount },
                { label: 'Países destino', value: paisesCount },
              ].map((s, idx) => (
                <div
                  key={s.label}
                  className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-cyan-400/30 hover:border-cyan-400/60 transition-all duration-300 transform hover:scale-105 cursor-default animate-fade-in shadow-lg"
                  style={{ animationDelay: `${0.6 + idx * 0.1}s` }}
                >
                  <p className="text-3xl font-bold text-cyan-300 font-mono mb-1">{s.value}</p>
                  <p className="text-gray-200 text-xs font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <p className="text-gray-300 text-sm drop-shadow-md mt-12">
              © {new Date().getFullYear()} Collecta · Puebla, México
            </p>
          </div>

          {/* ── Lado derecho — formulario ────────────────────────────────────────── */}
          <div className="flex flex-col items-center justify-center animate-slide-in-right relative">
            {/* Patrón de circuitos SVG */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="circuits" width="200" height="200" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="50" x2="200" y2="50" stroke="currentColor" strokeWidth="1" className="text-collecta-400" />
                    <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="1" className="text-collecta-400" />
                    <line x1="0" y1="150" x2="200" y2="150" stroke="currentColor" strokeWidth="1" className="text-collecta-400" />
                    <line x1="50" y1="0" x2="50" y2="200" stroke="currentColor" strokeWidth="1" className="text-collecta-400" />
                    <line x1="100" y1="0" x2="100" y2="200" stroke="currentColor" strokeWidth="1" className="text-collecta-400" />
                    <line x1="150" y1="0" x2="150" y2="200" stroke="currentColor" strokeWidth="1" className="text-collecta-400" />
                    <circle cx="50" cy="50" r="2" fill="currentColor" className="text-collecta-500" />
                    <circle cx="100" cy="100" r="2" fill="currentColor" className="text-collecta-500" />
                    <circle cx="150" cy="150" r="2" fill="currentColor" className="text-collecta-500" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#circuits)" />
              </svg>
            </div>

            {/* Fondo decorativo sutil */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div
                className="absolute top-10 right-10 w-64 h-64 bg-collecta-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
                style={{ animationDelay: '0.5s' }}
              />
              <div
                className="absolute bottom-10 left-10 w-48 h-48 bg-collecta-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
                style={{ animationDelay: '1.5s' }}
              />
            </div>

            {/* Logo mobile */}
            <div className="lg:hidden mb-12 text-center relative z-10">
              <img
                src="/plataforma/logo-plataforma.png"
                alt="Collecta"
                className="h-10 w-auto mx-auto mb-4 brightness-0 invert"
              />
              <p className="text-sm text-gray-200 font-medium">Sistema Operativo Agroalimentario</p>
            </div>

            <div className="w-full max-w-sm relative z-10">
              {/* Encabezado */}
              <div className="mb-12 text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-3xl font-bold text-white mb-2">Inicia sesión</h2>
                <p className="text-gray-200 text-sm">Accede a tu plataforma de trazabilidad</p>
              </div>

              {/* Formulario — submit redirige al subdominio real (sin enviar
                  credenciales por URL; el usuario las re-ingresa en el dominio
                  de la app donde existe el backend real de autenticación). */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  window.location.href = PLATFORM_LOGIN_URL;
                }}
                className="space-y-6"
              >
                {/* Correo */}
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <label htmlFor="correo" className="block text-sm font-medium text-gray-200 mb-2">
                    Correo electrónico
                  </label>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    autoComplete="email"
                    placeholder="nombre@collecta.mx"
                    className="w-full px-4 py-3 rounded-lg border transition-all duration-200 bg-black/40 backdrop-blur-md text-white placeholder-gray-400 border-gray-600 focus:border-collecta-400 focus:ring-2 focus:ring-collecta-400/20 focus:outline-none"
                  />
                </div>

                {/* Contraseña */}
                <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-lg border transition-all duration-200 bg-black/40 backdrop-blur-md text-white placeholder-gray-400 border-gray-600 focus:border-collecta-400 focus:ring-2 focus:ring-collecta-400/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3 mt-8 text-sm font-semibold rounded-lg bg-collecta-600 text-white hover:bg-collecta-700 transition-all duration-200 shadow-lg hover:shadow-collecta-600/50 transform hover:scale-[1.02] active:scale-95 animate-fade-in"
                  style={{ animationDelay: '0.4s' }}
                >
                  Iniciar sesión
                </button>
              </form>

              {/* Footer */}
              <p className="text-center text-xs text-gray-300 mt-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                © {new Date().getFullYear()} Collecta · Puebla, México
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

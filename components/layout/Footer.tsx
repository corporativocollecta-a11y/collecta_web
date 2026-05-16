import React from 'react';
import Image from 'next/image';

const footerLinks = {
  ecosistema: [
    { label: 'Modelo', href: '#ecosistema' },
    { label: 'Tecnología', href: '#ecosistema' },
    { label: 'Trazabilidad', href: '#ecosistema' },
  ],
  audiencias: [
    { label: 'Clientes', href: '#clientes' },
    { label: 'Productores', href: '#productores' },
    { label: 'Aliados', href: '#impacto' },
  ],
  empresa: [
    { label: 'Impacto', href: '#impacto' },
    { label: 'Contacto', href: '#contacto' },
    { label: 'Plataforma', href: 'https://app.collectagroup.com' },
  ],
  legales: [
    { label: 'Aviso de privacidad', href: '/privacidad' },
    { label: 'Términos de uso', href: '/terminos' },
  ],
};

export function Footer() {
  return (
    <footer
      className="py-16 px-4 sm:px-6 lg:px-8 border-t"
      style={{
        background: '#FFFFFF',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        color: '#2A2A2A',
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 mb-12 items-start">
          {/* Brand - takes more space, aligned to far left */}
          <div className="col-span-2 md:col-span-3 md:-ml-10">
            <div className="relative h-14 sm:h-16 w-52 sm:w-64 mb-4">
              <Image
                src="/assets/logo.png"
                alt="Collecta"
                fill
                sizes="(max-width: 640px) 208px, 256px"
                className="object-contain object-left"
              />
            </div>
            <p
              className="text-sm leading-relaxed text-center w-52 sm:w-64"
              style={{ color: '#4A4A4A' }}
            >
              Para toda la humanidad
            </p>
          </div>

          {/* Ecosistema */}
          <div className="md:col-span-2">
            <h4
              className="font-semibold mb-4"
              style={{ color: '#4ADE80' }}
            >
              Ecosistema
            </h4>
            <ul className="space-y-2">
              {footerLinks.ecosistema.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors hover:opacity-70"
                    style={{ color: '#4A4A4A' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Audiencias */}
          <div className="md:col-span-2">
            <h4
              className="font-semibold mb-4"
              style={{ color: '#4ADE80' }}
            >
              Para ti
            </h4>
            <ul className="space-y-2">
              {footerLinks.audiencias.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors hover:opacity-70"
                    style={{ color: '#4A4A4A' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div className="md:col-span-2">
            <h4
              className="font-semibold mb-4"
              style={{ color: '#4ADE80' }}
            >
              Empresa
            </h4>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors hover:opacity-70"
                    style={{ color: '#4A4A4A' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legales */}
          <div className="md:col-span-2">
            <h4
              className="font-semibold mb-4"
              style={{ color: '#4ADE80' }}
            >
              Legales
            </h4>
            <ul className="space-y-2">
              {footerLinks.legales.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors hover:opacity-70"
                    style={{ color: '#4A4A4A' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Hecho en México - aligned right of Legales */}
          <div className="col-span-2 md:col-span-1 flex md:justify-end items-start">
            <a
              href="https://hechoenmexico.economia.gob.mx/"
              target="_blank"
              rel="noopener noreferrer"
              className="block transition-transform duration-300 hover:scale-105"
              title="Hecho en México - Certificación Secretaría de Economía"
            >
              <img
                src="/assets/hecho-mx-logo.png"
                alt="Hecho en México - Secretaría de Economía"
                className="h-20 sm:h-24 w-auto"
              />
            </a>
          </div>
        </div>

        {/* Impulsado por WORTEV */}
        <div
          className="pt-8 mt-8 flex justify-center items-center border-t"
          style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}
        >
          <a
            href="https://wortev.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 transition-opacity duration-300 hover:opacity-70 group"
            title="Impulsado por WORTEV"
          >
            <div className="flex flex-col items-end leading-tight">
              <span
                className="italic text-xs"
                style={{ color: '#8B7D6B' }}
              >
                Impulsado
              </span>
              <span
                className="italic text-xs"
                style={{ color: '#8B7D6B' }}
              >
                por
              </span>
            </div>
            <img
              src="/assets/wortev-logo.svg"
              alt="WORTEV"
              className="h-7 sm:h-8 w-auto transition-transform duration-300 group-hover:scale-105"
              // The SVG ships as white (for dark backgrounds). The footer now
              // sits on solid white, so invert the logo to near-black so it's
              // visible against the page.
              style={{ filter: 'brightness(0) opacity(0.78)' }}
            />
          </a>
        </div>
      </div>
    </footer>
  );
}

'use client';

import React from 'react';
import Image from 'next/image';
import { useT } from '@/lib/i18n/LocaleProvider';

const footerLinks = {
  ecosistema: [
    { key: 'footer.link.modelo', href: '#ecosistema' },
    { key: 'footer.link.tecnologia', href: '#ecosistema' },
    { key: 'footer.link.trazabilidad', href: '#ecosistema' },
  ],
  audiencias: [
    { key: 'footer.link.clientes', href: '#clientes' },
    { key: 'footer.link.productores', href: '#productores' },
    { key: 'footer.link.aliados', href: '#impacto' },
  ],
  empresa: [
    { key: 'footer.link.impacto', href: '#impacto' },
    { key: 'footer.link.contacto', href: '#contacto' },
    { key: 'footer.link.plataforma', href: '/plataforma' },
  ],
  legales: [
    { key: 'footer.link.privacidad', href: '/privacidad' },
    { key: 'footer.link.terminos', href: '/terminos' },
  ],
} as const;

export function Footer() {
  const t = useT();

  return (
    <footer className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-t border-light-border bg-white text-dark-text">
      <div className="mx-auto max-w-7xl">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 mb-12 lg:mb-16 items-start">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="relative h-12 sm:h-14 w-48 sm:w-56 mb-4">
              <Image
                src="/assets/logo.png"
                alt="Collecta"
                fill
                sizes="(max-width: 640px) 192px, 224px"
                className="object-contain object-left"
              />
            </div>
            <blockquote className="text-sm leading-relaxed italic text-dark-text-secondary">
              <span style={{ color: '#00FF80' }}>&ldquo;</span>
              {t('footer.tagline')}
              <span style={{ color: '#00FF80' }}>&rdquo;</span>
            </blockquote>
          </div>

          {/* Ecosistema */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="font-semibold mb-4 text-brand-green uppercase text-xs tracking-wider">
              {t('footer.col.ecosistema')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.ecosistema.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-dark-text-secondary hover:text-brand-green transition-colors duration-300"
                  >
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Para ti */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="font-semibold mb-4 text-brand-green uppercase text-xs tracking-wider">
              {t('footer.col.audiencias')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.audiencias.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-dark-text-secondary hover:text-brand-green transition-colors duration-300"
                  >
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="font-semibold mb-4 text-brand-green uppercase text-xs tracking-wider">
              {t('footer.col.empresa')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-dark-text-secondary hover:text-brand-green transition-colors duration-300"
                  >
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legales */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="font-semibold mb-4 text-brand-green uppercase text-xs tracking-wider">
              {t('footer.col.legal')}
            </h4>
            <ul className="space-y-3">
              {footerLinks.legales.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-dark-text-secondary hover:text-brand-green transition-colors duration-300 underline"
                  >
                    {t(link.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Hecho en México */}
          <div className="sm:col-span-2 lg:col-span-1 flex sm:justify-center lg:justify-end items-start">
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

        {/* Bottom - WORTEV */}
        <div className="pt-8 sm:pt-10 lg:pt-12 mt-8 sm:mt-10 lg:mt-12 flex justify-center items-center border-t border-light-border">
          <a
            href="https://wortev.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 transition-opacity duration-300 hover:opacity-70 group"
            title="Impulsado por WORTEV"
          >
            <div className="flex flex-col items-end leading-tight">
              <span className="italic text-xs text-dark-text-muted">
                Impulsado
              </span>
              <span className="italic text-xs text-dark-text-muted">
                por
              </span>
            </div>
            <img
              src="/assets/wortev-logo.svg"
              alt="WORTEV"
              className="h-7 sm:h-8 w-auto transition-transform duration-300 group-hover:scale-105"
              style={{ filter: 'brightness(0) opacity(0.78)' }}
            />
          </a>
        </div>
      </div>
    </footer>
  );
}

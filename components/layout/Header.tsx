'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { linkClasses, buttonClasses } from '@/lib/component-utils';
import { useLocale } from '@/lib/i18n/LocaleProvider';

const navLinks = [
  { href: '#ecosistema', key: 'nav.ecosistema' },
  { href: '#clientes', key: 'nav.clientes' },
  { href: '#productores', key: 'nav.productores' },
  { href: '#impacto', key: 'nav.impacto' },
  { href: '#contacto', key: 'nav.contacto' },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, locale, toggle } = useLocale();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white',
        scrolled ? 'shadow-md' : ''
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center group">
            <div className="relative h-12 sm:h-14 w-48 sm:w-56 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/assets/logo.png"
                alt="Collecta"
                fill
                sizes="(max-width: 640px) 192px, 224px"
                className="object-contain object-left"
                priority
              />
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={clsx(linkClasses.nav, 'text-dark-text')}
              >
                {t(link.key)}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-green group-hover:w-full transition-all duration-300" />
              </a>
            ))}

            <a
              href="/plataforma"
              className="px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border-2 border-brand-blue-dark text-brand-blue-dark hover:border-brand-green hover:text-brand-green"
            >
              {t('nav.platform')}
            </a>

            <button
              type="button"
              onClick={toggle}
              aria-label={t('nav.language.aria')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-light-border text-dark-text hover:border-brand-green hover:text-brand-green"
            >
              {locale === 'es' ? (
                <>
                  <span className="font-semibold text-brand-green">ES</span>
                  <span className="opacity-50 mx-1">/</span>
                  <span>EN</span>
                </>
              ) : (
                <>
                  <span>ES</span>
                  <span className="opacity-50 mx-1">/</span>
                  <span className="font-semibold text-brand-green">EN</span>
                </>
              )}
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors text-dark-text hover:text-brand-green"
            aria-label={mobileMenuOpen ? t('nav.menu.closeAria') : t('nav.menu.openAria')}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t border-light-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-dark-text hover:text-brand-green hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  {t(link.key)}
                </a>
              ))}
              <a
                href="/plataforma"
                className="block mt-4 px-4 py-3 rounded-lg font-semibold text-center border-2 border-brand-blue-dark text-brand-blue-dark hover:border-brand-green hover:text-brand-green"
              >
                {t('nav.platform.mobile')}
              </a>
              <button
                type="button"
                onClick={() => {
                  toggle();
                  setMobileMenuOpen(false);
                }}
                aria-label={t('nav.language.aria')}
                className="block w-full mt-2 px-4 py-3 rounded-lg text-sm font-medium text-center border border-light-border text-dark-text hover:border-brand-green hover:text-brand-green"
              >
                {locale === 'es' ? (
                  <>
                    <span className="font-semibold text-brand-green">ES</span>
                    <span className="opacity-50 mx-1">/</span>
                    <span>EN</span>
                  </>
                ) : (
                  <>
                    <span>ES</span>
                    <span className="opacity-50 mx-1">/</span>
                    <span className="font-semibold text-brand-green">EN</span>
                  </>
                )}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

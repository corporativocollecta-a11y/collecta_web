'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const navLinks = [
  { href: '#ecosistema', label: 'Ecosistema' },
  { href: '#clientes', label: 'Clientes' },
  { href: '#productores', label: 'Productores' },
  { href: '#impacto', label: 'Impacto' },
  { href: '#contacto', label: 'Contacto' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        scrolled ? 'shadow-sm' : ''
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Logo */}
          <a href="#" className="flex items-center group">
            <div className="relative h-14 sm:h-16 w-52 sm:w-64 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/assets/logo.png"
                alt="Collecta"
                fill
                sizes="(max-width: 640px) 208px, 256px"
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
                className="text-sm tracking-wide transition-colors duration-300 relative group"
                style={{ color: '#323232', fontWeight: 550 }}
              >
                {link.label}
                <span
                  className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                  style={{ backgroundColor: '#4ADE80' }}
                />
              </a>
            ))}

            <a
              href="https://app.collectagroup.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300"
              style={{
                background: 'transparent',
                border: '1.5px solid #1E3D87',
                color: '#1E3D87',
              }}
            >
              Plataforma
            </a>

            {/* ES / EN language toggle (placeholder — no idioma activo aún) */}
            <button
              type="button"
              aria-label="Cambiar idioma"
              className="px-4 py-2 rounded-md text-sm tracking-wide transition-all duration-300 hover:text-[#4ADE80]"
              style={{
                background: 'transparent',
                color: '#323232',
                fontWeight: 550,
                border: '1px solid rgba(0, 0, 0, 0.18)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.55)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.18)';
              }}
            >
              ES / EN
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#2A2A2A' }}
            aria-label="Toggle menu"
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
            className="md:hidden bg-white border-t border-border-light overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-primary-dark hover:bg-neutral-light rounded-lg font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="https://app.collectagroup.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-4 px-4 py-3 rounded-lg font-semibold text-center"
                style={{
                  background: 'transparent',
                  border: '1.5px solid #1E3D87',
                  color: '#1E3D87',
                }}
              >
                Acceder a la Plataforma
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

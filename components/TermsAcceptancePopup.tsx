'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function TermsAcceptancePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('terms_accepted');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    if (isChecked) {
      localStorage.setItem('terms_accepted', 'true');
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-6 max-w-sm z-40 border border-light-border"
        >
          <div className="space-y-4">
            <p className="text-sm text-dark-text">
              Debes aceptar nuestros términos y condiciones para continuar.
            </p>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-2 border-light-border text-brand-green cursor-pointer accent-brand-green"
              />
              <span className="text-sm text-dark-text">
                Acepto los{' '}
                <a
                  href="/terminos"
                  className="text-brand-green hover:underline font-semibold"
                >
                  términos y condiciones
                </a>
                {' '}de Collecta
              </span>
            </label>

            <button
              onClick={handleAccept}
              disabled={!isChecked}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                isChecked
                  ? 'bg-brand-green text-white hover:bg-opacity-90 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Aceptar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

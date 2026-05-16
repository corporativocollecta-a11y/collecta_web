'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PHASES, PHASE_COUNT, FLOW_COLORS } from './types';
import { Phase1Siembra } from './phases/Phase1Siembra';
import { Phase2Empaque } from './phases/Phase2Empaque';
import { Phase3Logistica } from './phases/Phase3Logistica';
import { Phase4Cliente } from './phases/Phase4Cliente';

const PAUSE_AFTER_INTERACTION = 12000;

export function FlowVisualization() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSub, setCurrentSub] = useState(0);
  const startTimeRef = useRef(Date.now());

  const activePhase = PHASES[activeIndex];

  // Reset currentSub when activePhase changes
  useEffect(() => {
    setCurrentSub(0);
  }, [activeIndex]);

  // Per-phase autoplay duration + progress
  useEffect(() => {
    if (!isAutoplay) return;

    startTimeRef.current = Date.now();
    setProgress(0);

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / activePhase.durationMs) * 100, 100);
      setProgress(pct);
    }, 80);

    const advance = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % PHASE_COUNT);
    }, activePhase.durationMs);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(advance);
    };
  }, [activeIndex, isAutoplay, activePhase.durationMs]);

  // Autoplay is OFF by default. User navigates manually via dots / prev / next.

  const handlePhaseClick = (index: number) => {
    setActiveIndex(index);
    setIsAutoplay(false);
    setProgress(0);
  };

  const handlePrev = () => handlePhaseClick((activeIndex - 1 + PHASE_COUNT) % PHASE_COUNT);
  const handleNext = () => handlePhaseClick((activeIndex + 1) % PHASE_COUNT);

  const renderPhase = () => {
    switch (activePhase.id) {
      case 'siembra':
        return <Phase1Siembra active={true} onSubChange={setCurrentSub} />;
      case 'empaque':
        return <Phase2Empaque active={true} onSubChange={setCurrentSub} />;
      case 'logistica':
        return <Phase3Logistica active={true} onSubChange={setCurrentSub} />;
      case 'cliente':
        return <Phase4Cliente active={true} onSubChange={setCurrentSub} />;
      default:
        return null;
    }
  };

  // currentSub se mantiene como estado por si re-añadimos indicador de sub-fase más adelante
  void currentSub;

  // Fade en bordes izquierdo/derecho para sensación de continuidad/flujo
  const edgeFadeMask =
    'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)';

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="relative pt-2">
          {/* Scene canvas — full width con fade en bordes (sin marco rígido) */}
          <div
            className="relative w-full"
            style={{
              aspectRatio: '16 / 9',
              minHeight: '180px',
              maskImage: edgeFadeMask,
              WebkitMaskImage: edgeFadeMask,
            }}
          >
            <div className="absolute inset-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePhase.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full relative"
                >
                  {renderPhase()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Top progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none z-10">
              <div
                className="h-full"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, transparent 0%, ${FLOW_COLORS.gold} 50%, ${FLOW_COLORS.goldLight} 100%)`,
                  opacity: isAutoplay ? 1 : 0,
                  transition: 'opacity 0.4s, width 80ms linear',
                }}
              />
            </div>
          </div>

          {/* Caption — ancho restringido para legibilidad */}
          <div className="max-w-md mx-auto px-2 sm:px-4 pt-4 pb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePhase.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl"
              >
                <h3
                  className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2"
                  style={{ color: FLOW_COLORS.ink }}
                >
                  {activePhase.title}
                </h3>
                <p
                  className="text-sm sm:text-base leading-relaxed"
                  style={{ color: FLOW_COLORS.inkSoft }}
                >
                  {activePhase.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Phase navigator — ancho restringido */}
          <div className="max-w-md mx-auto px-2 sm:px-4 pt-2 pb-2">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrev}
                className="flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:scale-110"
                style={{
                  borderColor: FLOW_COLORS.gold,
                  color: FLOW_COLORS.goldDark,
                  background: 'rgba(255,255,255,0.7)',
                }}
                aria-label="Fase anterior"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="flex-1 flex items-center justify-center gap-4 sm:gap-10">
                {PHASES.map((phase, i) => {
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={phase.id}
                      onClick={() => handlePhaseClick(i)}
                      className="group flex flex-col items-center gap-2 transition-all"
                      aria-label={`Ir a fase: ${phase.label}`}
                    >
                      <div
                        className="rounded-full transition-all duration-500"
                        style={{
                          width: isActive ? '40px' : '10px',
                          height: '10px',
                          background: isActive
                            ? `linear-gradient(90deg, ${FLOW_COLORS.gold} 0%, ${FLOW_COLORS.goldDark} 100%)`
                            : 'rgba(184, 148, 80, 0.35)',
                          boxShadow: isActive ? `0 0 14px ${FLOW_COLORS.gold}` : 'none',
                        }}
                      />
                      <span
                        className="hidden sm:block text-xs font-semibold tracking-wide uppercase whitespace-nowrap transition-colors"
                        style={{ color: isActive ? FLOW_COLORS.goldDark : '#8B7D6B' }}
                      >
                        {phase.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNext}
                className="flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-all hover:scale-110"
                style={{
                  borderColor: FLOW_COLORS.gold,
                  color: FLOW_COLORS.goldDark,
                  background: 'rgba(255,255,255,0.7)',
                }}
                aria-label="Siguiente fase"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}

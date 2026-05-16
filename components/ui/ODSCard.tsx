'use client';

import React from 'react';

interface ODSCardProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
}

const ODS_TITLES: Record<number, string> = {
  2: 'Hambre Cero',
  8: 'Trabajo Decente y Crecimiento Económico',
  12: 'Producción y Consumo Responsables',
  13: 'Acción por el Clima',
  15: 'Vida de Ecosistemas Terrestres',
  17: 'Alianzas para Lograr los Objetivos',
};

export function ODSCard({ number, size = 'md' }: ODSCardProps) {
  const title = ODS_TITLES[number];
  if (!title) return null;

  return (
    <div className="group cursor-default">
      <div className="aspect-square rounded-md overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-sm">
        <img
          src={`/assets/ods/ods-${number.toString().padStart(2, '0')}.svg`}
          alt={`ODS ${number} - ${title}`}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    </div>
  );
}

// resources/js/components/ui/BadgeOrigen.tsx
import React from 'react';

import { Origen } from '@/types/leads';

interface BadgeOrigenProps {
  origen: Origen;
}

const BadgeOrigen: React.FC<BadgeOrigenProps> = ({ origen }) => {
  return (
    <span 
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
      style={{ 
        backgroundColor: `${origen.color}20`, 
        color: origen.color 
      }}
    >
      {origen.nombre}
    </span>
  );
};

export default BadgeOrigen;
// resources/js/hooks/useLeadModals.ts
import { useState, useCallback } from 'react';

import { Lead } from '@/types/leads';

interface ModalState {
  editar: boolean;
  nuevoComentario: boolean;
  convertirCliente: boolean;
  eliminar: boolean;
}

export const useLeadModals = () => {
  const [modals, setModals] = useState<ModalState>({
    editar: false,
    nuevoComentario: false,
    convertirCliente: false,
    eliminar: false
  });

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const abrirModal = useCallback((modal: keyof ModalState, lead?: Lead) => {
    if (lead) setSelectedLead(lead);
    setModals(prev => ({ ...prev, [modal]: true }));
  }, []);

  const cerrarModales = useCallback(() => {
    setModals({
      editar: false,
      nuevoComentario: false,
      convertirCliente: false,
      eliminar: false
    });
    setSelectedLead(null);
  }, []);

  return {
    modals,
    selectedLead,
    abrirModal,
    cerrarModales
  };
};
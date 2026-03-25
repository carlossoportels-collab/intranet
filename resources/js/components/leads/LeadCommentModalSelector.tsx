// resources/js/components/leads/LeadCommentModalSelector.tsx

import React from 'react';
import NuevoComentarioModal from '@/components/Modals/NuevoComentarioModal';
import ClienteComentarioModal from '@/components/Modals/ClienteComentarioModal';
import SeguimientoLeadModal from '@/components/Modals/SeguimientoPerdidosModal';

interface LeadCommentModalSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    lead: any;
    tiposComentario: any[];
    estadosLead: any[];
    comentariosExistentes: number;
    onSuccess: () => void;
    seguimiento?: any;
    tiposComentarioSeguimiento?: any[];
    estadosLeadSeguimiento?: any[];
}

export default function LeadCommentModalSelector({
    isOpen,
    onClose,
    lead,
    tiposComentario = [],
    estadosLead = [],
    comentariosExistentes = 0,
    onSuccess,
    seguimiento = null,
    tiposComentarioSeguimiento = [],
    estadosLeadSeguimiento = []
}: LeadCommentModalSelectorProps) {
    
    if (!isOpen) return null;
    
    const getModalType = () => {
        if (!lead) return 'default';
        const estadoTipo = lead.estado_lead?.tipo || lead.estado_tipo;
        
        // Cliente
        if (estadoTipo === 'final_positivo') {
            return 'cliente';
        }
        
        // Leads perdidos o en proceso de recontacto
        if (estadoTipo === 'final_negativo' || estadoTipo === 'recontacto') {
            return 'perdido';
        }
        
        // Por defecto
        return 'default';
    };
    
    const modalType = getModalType();
    
    
    // Modal para leads en recontacto o perdidos
    if (modalType === 'perdido') {
        // Asegurar que tenemos tipos de comentario para seguimiento
        const tiposParaModal = tiposComentarioSeguimiento.length > 0 
            ? tiposComentarioSeguimiento 
            : tiposComentario;
            
        
        return (
            <SeguimientoLeadModal
                isOpen={isOpen}
                onClose={onClose}
                lead={lead}
                seguimiento={seguimiento}
                tiposComentario={tiposParaModal}
                estadosLead={estadosLeadSeguimiento.length > 0 ? estadosLeadSeguimiento : estadosLead}
                onSuccess={onSuccess}
            />
        );
    }
    
    // Modal para clientes
    if (modalType === 'cliente') {
        return (
            <ClienteComentarioModal
                isOpen={isOpen}
                onClose={onClose}
                lead={lead}
                tiposComentario={tiposComentario}
                comentariosExistentes={comentariosExistentes}
                onSuccess={onSuccess}
            />
        );
    }
    
    return (
        <NuevoComentarioModal
            isOpen={isOpen}
            onClose={onClose}
            lead={lead}
            tiposComentario={tiposComentario}
            estadosLead={estadosLead}
            comentariosExistentes={comentariosExistentes}
            onSuccess={onSuccess}
        />
    );
}
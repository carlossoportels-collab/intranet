// resources/js/types/cambiosRazonSocial.ts

import { Origen, Rubro, Provincia, Localidad as LocalidadType } from './leads';
import { TipoResponsabilidad, TipoDocumento, Nacionalidad, CategoriaFiscal, Plataforma } from './empresa';

// Re-exportamos tipos que ya existen
export type { Origen, Rubro, Provincia, TipoResponsabilidad, TipoDocumento, Nacionalidad, CategoriaFiscal, Plataforma };

export interface Localidad extends LocalidadType {
    provincia_id: number;
    provincia: string;
    codigo_postal: string;
    nombre: string; 
}

export interface Empresa {
    id: number;
    codigo: string;
    nombre_fantasia: string;
    razon_social: string;
    cuit: string;
}

export interface LocalidadFiscal {
    id: number;
    nombre: string;
    provincia: string;
    codigo_postal: string;
}

export interface LeadContacto {
    id: number;
    nombre_completo: string;
    genero: string;
    telefono: string | null;
    email: string | null;
    localidad_id: number | null;
    localidad?: {
        id: number;
        nombre: string;
        provincia: string;
        provincia_id?: number | null;  // ← Agrega esto
    } | null;
    rubro_id: number | null;
    rubro?: string | null;
    origen_id: number | null;
    origen?: string | null;
}

export interface Contacto {
    id: number;
    empresa_id: number;
    es_contacto_principal: boolean;
    tipo_responsabilidad_id: number | null;
    tipo_documento_id: number | null;
    nro_documento: string | null;
    nacionalidad_id: number | null;
    fecha_nacimiento: string | null;
    direccion_personal: string | null;
    codigo_postal_personal: string | null;
    lead: LeadContacto | null;
}

export interface Responsable {
    id: number;
    empresa_id: number;
    nombre_completo: string;  // ← Campo unificado
    cargo: string | null;
    telefono: string | null;
    email: string | null;
    tipo_responsabilidad_id: number | null;
    tipo_responsabilidad?: TipoResponsabilidad;
    es_activo: boolean;
    created: string;
    created_by: number;
}

export interface EmpresaCompleta {
    id: number;
    codigo: string;
    nombre_fantasia: string;
    razon_social: string;
    cuit: string;
    direccion_fiscal: string | null;
    codigo_postal_fiscal: string | null;
    localidad_fiscal: LocalidadFiscal | null;
    localidad_fiscal_id?: number | null;        // Nuevo
    localidad_fiscal_nombre?: string | null;    // Nuevo
    localidad_fiscal_provincia?: string | null; // Nuevo
    localidad_fiscal_provincia_id?: number | null;
    localidad_fiscal_codigo_postal?: string | null; // Nuevo
    telefono_fiscal: string | null;
    email_fiscal: string | null;
    rubro_id: number | null;
    rubro: string | null;
    cat_fiscal_id: number | null;
    categoria_fiscal: CategoriaFiscal | null;
    plataforma_id?: number | null;               // Nuevo
    plataforma_nombre?: string | null;           // Nuevo
    nombre_flota?: string | null;                 // Nuevo
    contactos: Contacto[];
    responsables: Responsable[];
}



export interface HistorialCambio {
    id: number;
    empresa: {
        id: number;
        codigo: string;
        nombre: string;
    };
    razon_social_anterior: string;
    razon_social_nueva: string;
    cuit_anterior: string;
    cuit_nuevo: string;
    fecha_cambio: string;
    usuario: string;
    datos_adicionales?: any;
}

export interface HistorialData {
    data: HistorialCambio[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export interface CambioRazonSocialProps {
    empresas: Empresa[];
    historial: HistorialData;
    origenes: Origen[];
    rubros: Rubro[];
    provincias: Provincia[];
    tiposDocumento: TipoDocumento[];
    nacionalidades: Nacionalidad[];
    tiposResponsabilidad: TipoResponsabilidad[];
    categoriasFiscales: CategoriaFiscal[];
    plataformas: Plataforma[];
}
// resources/js/types/contratos.ts

export interface Provincia {
    id: number;
    nombre: string; 
    activo?: boolean;
}

export interface Localidad {
    id: number;
    nombre: string;
    provincia_id: number;
    provincia?: Provincia;
    codigo_postal?: string;
}

export interface Lead {
    id: number;
    nombre_completo: string;
    genero: string;
    telefono: string;
    email: string;
    domicilio?: string;
    localidad?: Localidad;
    rubro?: {
        id: number;
        nombre: string;
    };
    origen?: {
        id: number;
        nombre: string;
    };
}

export interface Empresa {
    id: number;
    nombre_fantasia: string;
    razon_social: string;
    cuit: string;
    direccion_fiscal?: string;
    codigo_postal_fiscal?: string;
    localidad_fiscal?: Localidad;
    telefono_fiscal?: string;
    email_fiscal?: string;
    rubro?: {
        id: number;
        nombre: string;
    };
    categoria_fiscal?: {
        id: number;
        nombre: string;
    };
    plataforma?: {
        id: number;
        nombre: string;
    };
    nombre_flota?: string;
}

export interface Contacto {
    id: number;
    tipo_responsabilidad?: {
        id: number;
        nombre: string;
    };
    tipo_documento?: {
        id: number;
        nombre: string;
        abreviatura: string;
    };
    nro_documento?: string;
    nacionalidad?: {
        id: number;
        pais: string;
    };
    fecha_nacimiento?: string;
    direccion_personal?: string;
    codigo_postal_personal?: string;
}


export interface ContratoNuevo {
    id: number;
    tipo: 'nuevo';
    numero_contrato: string;
    fecha_emision: string;
    fecha_original: string;
    estado: string;
    cliente_nombre: string;
    empresa_razon_social: string;
    total_mensual: number;
    total_inversion: number;
    cantidad_vehiculos: number;
    vendedor: string;
    tiene_pdf: boolean;
    pdf_url: string | null;
    metadata: {
        presupuesto_referencia?: string;
        promocion?: string;
        contacto_email?: string;
        contacto_telefono?: string;
    };
}

export interface ContratoLegacy {
    id: number;
    tipo: 'legacy';
    numero_contrato: string;
    nombre_completo: string;
    razon_social: string;
    fecha: string;
    fecha_original: string;
    tiene_pdf: boolean;
    pdf_url: string | null;
    metadata: {
        lead_id: number;
    };
}

export type ContratoUnificado = ContratoNuevo | ContratoLegacy;
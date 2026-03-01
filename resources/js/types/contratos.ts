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
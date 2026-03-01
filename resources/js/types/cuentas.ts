// resources/js/types/cuentas.ts

export interface AbonoVehiculo {
    id: number;
    abono_codigo: string;
    abono_nombre: string;
    abono_precio: number;
    created_at: string | null;
}

export interface Vehiculo {
    id: number;
    codigo_alfa: string;
    nombre_mix: string;
    ab_alta: string | null;
    avl_anio: number | null;
    avl_color: string;
    avl_identificador: string;
    avl_marca: string;
    avl_modelo: string;
    avl_patente: string;
    categoria: string;
    empresa_id: number;
    abonos: AbonoVehiculo[];
}

export interface LocalidadFiscal {
    localidad: string;
    provincia: string;
    codigo_postal: string;
}

export interface Lead {
    id: number;
    nombre_completo: string;
    email: string;
    telefono: string;
}

export interface Contacto {
    id: number;
    empresa_id: number;
    es_contacto_principal: boolean;
    es_activo: boolean;
    lead?: Lead;
}

export interface Empresa {
    id: number;
    prefijo_id: number;
    numeroalfa: number;
    codigo_alfa_empresa: string;
    nombre_fantasia: string;
    razon_social: string;
    cuit: string;
    direccion_fiscal: string;
    codigo_postal_fiscal: string;
    localidad_fiscal_id: number;
    localidad_fiscal: LocalidadFiscal | null;
    telefono_fiscal: string;
    email_fiscal: string;
    es_activo: boolean;
    created: string;
    contactos: Contacto[];
    vehiculos: Vehiculo[];
}

export interface EstadisticasCuentas {
    total: number;
    activas: number;
    nuevas: number;
}

export interface UsuarioPermisos {
    ve_todas_cuentas: boolean;
    prefijos: number[];
}

export interface DetallesCuentasProps {
    empresas: Empresa[];
    estadisticas: EstadisticasCuentas;
    usuario: UsuarioPermisos;
}
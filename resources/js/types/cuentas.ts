// resources/js/types/cuentas.ts

export interface Abono {
    id: number;
    abono_codigo: string | null;
    abono_nombre: string;
    abono_precio: number;
    abono_descuento?: number | null;
    abono_descmotivo?: string | null;
    created_at: string | null;
}

export interface Vehiculo {
    id: number;
    codigo_alfa: string;
    nombre_mix: string | null;
    ab_alta: string | null;
    avl_anio: number | null;
    avl_color: string | null;
    avl_identificador: string | null;
    avl_marca: string | null;
    avl_modelo: string | null;
    avl_patente: string | null;
    categoria: string | null;
    empresa_id: number;
    abonos: Abono[];
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

export interface PrefijoFiltro {
    id: string | number;
    codigo: string;
    descripcion: string;
    comercial_nombre?: string;
    display_text: string;
}

export interface UsuarioPermisos {
    ve_todas_cuentas: boolean;
    prefijos: number[];
    rol_id: number;
    puede_ver_montos: boolean;
    prefijo_usuario?: PrefijoFiltro | null;
}

export interface AbonoDetallePorNombre {
    nombre: string;
    cantidad: number;
    total_sin_descuento: number;
    total_con_descuento: number;
}

export interface EstadisticaAbonoPorTipo {
    tipo_id: number;
    tipo_nombre: string;
    cantidad: number;
    total_sin_descuento: number;
    total_con_descuento: number;
    abonos: AbonoDetallePorNombre[];
}

export interface EstadisticasAbonos {
    tipos_principales: EstadisticaAbonoPorTipo[];
    total_abonos: number;
    total_monto: number;
}

export interface Comercial {
    id: number;
    nombre: string;
    prefijo_id: number;
    prefijo_codigo: string;
    email: string | null;
    compania_id: number;
}

export interface DetallesCuentasProps {
    empresas: Empresa[];
    estadisticas: {
        total: number;
        abonos: number;
        nuevas: number;
    };
    estadisticas_abonos: EstadisticasAbonos;
    comerciales: Comercial[];
    usuario: UsuarioPermisos;
    prefijosFiltro?: PrefijoFiltro[];
    filters?: {
        comercial_id?: number | null;
    };
}
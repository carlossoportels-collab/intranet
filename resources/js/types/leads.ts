// resources/js/types/leads.ts

export interface Origen {
    id: number;
    nombre: string;
    color: string;
    icono?: string;
}

export interface EstadoLead {
  id: number;
  nombre: string;
  color_hex: string;
  tipo: string;
  activo: boolean;
  created?: string;
  modified?: string;
}

export interface Localidad {
    id: number;
    nombre: string;
    provincia: string;
    codigo_postal: string;
    provincia_id?: number;
    nombre_completo?: string;
}

export interface Rubro {
    id: number;
    nombre: string;
}

export interface Provincia {
    id: number;
    nombre: string;
}

export interface Personal {
    id: number;
    nombre: string;
    apellido: string;
    email?: string;
    telefono?: string;
    nombre_completo?: string;
}

export interface Comercial {
    id: number;
    prefijo_id: number;
    nombre: string;
    email: string;
    telefono?: string; 
    personal?: Personal; 
    personal_id?: number;
}

export interface ConteoConFecha {
    total: number;
    ultimo: string | null;
    ultimo_formateado: string | null;
}

// 🔥 INTERFACES PARA EMPRESA Y CONTACTOS
export interface Empresa {
    id: number;
    alta_emp?: string;
    prefijo_id?: number;
    numeroalfa?: number;
    nombre_fantasia?: string;
    razon_social?: string;
    cuit?: string;
    direccion_fiscal?: string;
    codigo_postal_fiscal?: string;
    localidad_fiscal_id?: number;
    telefono_fiscal?: string;
    email_fiscal?: string;
    rubro_id?: number;
    cat_fiscal_id?: number;
    plataforma_id?: number;
    nombre_flota?: string;
    es_activo?: boolean;
    created?: string;
    created_by?: number;
    modified?: string;
    modified_by?: number;
    deleted_at?: string;
    deleted_by?: number;
}

export interface EmpresaContacto {
    id: number;
    empresa_id: number;
    lead_id: number;
    es_contacto_principal: boolean;
    tipo_responsabilidad_id?: number;
    tipo_documento_id?: number;
    nro_documento?: string;
    nacionalidad_id?: number;
    fecha_nacimiento?: string;
    direccion_personal?: string;
    codigo_postal_personal?: string;
    es_activo: boolean;
    created?: string;
    created_by?: number;
    modified?: string;
    modified_by?: number;
    deleted_at?: string;
    deleted_by?: number;
    empresa?: Empresa;
}

// 🔥 INTERFACES PARA PRODUCTOS Y SERVICIOS
export interface TipoProducto {
    id: number;
    nombre: string;
    nombre_tipo_abono?: string;
}

export interface ProductoServicio {
    id: number;
    codigopro?: string;
    nombre: string;
    descripcion?: string;
    tipo_id: number;
    tipo?: TipoProducto;
    valor_unitario?: number;
    es_activo?: boolean;
}

// 🔥 INTERFACES PARA AGREGADOS DEL PRESUPUESTO
export interface PresupuestoAgregado {
    id: number;
    presupuesto_id: number;
    prd_servicio_id: number;
    cantidad: number;
    aplica_a_todos_vehiculos: boolean;
    valor: number;
    bonificacion: number;
    subtotal: number;
    created?: string;
    deleted_at?: string;
    deleted_by?: number;
    productoServicio?: ProductoServicio;
    producto_codigo?: string;
    producto_nombre?: string;
    tipo_nombre?: string;
}

// 🔥 INTERFACES PARA EL PRESUPUESTO COMPLETO
export interface PresupuestoCompleto {
    id: number;
    prefijo_id: number;
    lead_id: number;
    promocion_id?: number;
    cantidad_vehiculos: number;
    validez: string;
    tasa_id?: number;
    valor_tasa: number;
    tasa_bonificacion: number;
    subtotal_tasa: number;
    tasa_metodo_pago_id?: number;
    abono_id?: number;
    valor_abono: number;
    abono_bonificacion: number;
    subtotal_abono: number;
    abono_metodo_pago_id?: number;
    subtotal_productos_agregados: number;
    total_presupuesto: number;
    estado_id: number;
    activo: boolean;
    created: string;
    created_by?: number;
    modified?: string;
    modified_by?: number;
    deleted_at?: string;
    deleted_by?: number;
    // Relaciones
    lead?: Lead;
    prefijo?: PrefijoDTO;
    tasa?: ProductoServicio;
    abono?: ProductoServicio;
    promocion?: any;
    estado?: any;
    agregados?: PresupuestoAgregado[];
    // Campos calculados
    referencia?: string;
    comercial_email?: string;
    compania_nombre?: string;
    compania_id?: number;
    nombre_comercial?: string;
    tasa_codigo?: string;
    tasa_nombre?: string;
    abono_codigo?: string;
    abono_nombre?: string;
}

export interface Lead {
    id: number;
    prefijo_id?: number;
    nombre_completo: string;
    asignado_nombre?: string | null;
    genero: string;
    telefono?: string;
    email?: string;
    localidad_id?: number;
    rubro_id?: number;
    origen_id?: number;
    estado_lead_id: number;
    es_cliente: boolean;
    es_activo: boolean;
    created: string;
    created_by?: number;
    modified?: string;
    modified_by?: number;
    deleted_at?: string;
    deleted_by?: number;
    localidad?: {
        id: number;
        nombre: string;
        provincia_id: number;
        provincia?: {
            id: number;
            nombre: string;
        };
        codigo_postal?: string;
    };
    rubro?: {
        id: number;
        nombre: string;
    };
    origen?: {
        id: number;
        nombre: string;
    };
    estado_lead?: {
        id: number;
        nombre: string;
        color_hex: string;
        tipo: string; 
    };
    prefijo?: {  
        id: number;
        codigo: string;
        descripcion?: string;
    };
    notas?: NotaLead[]; 
    seguimientoPerdida?: SeguimientoPerdida;
    empresa_contacto?: EmpresaContacto;
    empresa?: Empresa;
    empresa_razon_social?: string;
    empresa_cuit?: string;
    empresa_nombre_flota?: string;
    telefono_empresa?: string;
}

export interface NotaLead {
    id: number;
    lead_id: number;
    usuario_id: number;
    observacion: string;
    tipo: 'informacion_cliente' | 'detalle_contacto' | 'observacion_inicial';
    created: string;
    deleted_at?: string;
    deleted_by?: number;
    usuario?: {
        id: number;
        nombre_usuario: string;
        personal?: {
            id: number;
            nombre: string;
            apellido: string;
            email?: string;
            telefono?: string;
        };
    };
}

export interface TipoComentario {
    id: number;
    nombre: string;
    descripcion: string;
    aplica_a: string;
    crea_recordatorio: boolean;
    dias_recordatorio_default: number;
    es_activo: boolean;
}

export interface UsuarioData {
    ve_todas_cuentas: boolean;
    rol_id: number;
    personal_id: number;
    nombre_completo?: string;
    cantidad_prefijos?: number;
    prefijos_asignados?: number[];
    comercial?: {
        es_comercial: boolean;
        prefijo_id?: number;
    } | null;
}

export interface Comentario {
    id: number;
    lead_id: number;
    usuario_id: number;
    tipo_comentario_id: number;
    comentario: string;
    created: string;
    deleted_at: string | null;
    tipo_comentario?: TipoComentario;
    usuario?: {
        id: number;
        nombre: string;
        email: string;
    };
}

export interface ComentarioLegacy {
    id: number;
    lead_id: number;
    comentario: string;
    created: string;
}

export interface SeguimientoPerdida {
    id: number;
    lead_id: number;
    motivo_id: number;
    posibilidades_futuras: string;
    fecha_posible_recontacto?: string;
    created: string;
    motivo?: {
        id: number;
        nombre: string;
    };
}

export interface LeadDTO {
    id: number;
    nombre_completo: string;
    email: string;
    telefono?: string;
    prefijo_id?: number;
    prefijo?: PrefijoDTO | null;
    es_cliente?: boolean;
    genero?: string;
    rubro_id?: number;
    origen_id?: number;
    estado_lead_id?: number;
    localidad_id?: number;
}

export interface PrefijoDTO {
    id: number;
    codigo: string;
    descripcion: string;
}
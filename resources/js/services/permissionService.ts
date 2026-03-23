// resources/js/services/permissionService.ts
import { usePage } from '@inertiajs/react';

interface UserPermissions {
    user: {
        id: number;
        name: string;
        email: string;
        rol_id: number;
        ve_todas_cuentas: boolean;
        personal_id: number | null;
    };
    permisos: string[];
    prefijosPermitidos: number[];
    puedeVerTodos: boolean;
}

class PermissionService {
    private getAuth(): UserPermissions | null {
        const { auth } = usePage().props as { auth?: UserPermissions };
        return auth || null;
    }

    hasPermission(permiso: string): boolean {
        const auth = this.getAuth();
        return auth?.permisos?.includes(permiso) ?? false;
    }

    hasAnyPermission(permisos: string[]): boolean {
        return permisos.some(p => this.hasPermission(p));
    }

    hasAllPermissions(permisos: string[]): boolean {
        return permisos.every(p => this.hasPermission(p));
    }

    canViewAll(): boolean {
        const auth = this.getAuth();
        return auth?.puedeVerTodos ?? false;
    }

    getPrefijosPermitidos(): number[] {
        const auth = this.getAuth();
        return auth?.prefijosPermitidos ?? [];
    }

    canAccessPrefijo(prefijoId: number): boolean {
        if (this.canViewAll()) return true;
        return this.getPrefijosPermitidos().includes(prefijoId);
    }

    // Método específico para determinar si es comercial
    isComercial(): boolean {
        const auth = this.getAuth();
        // Un usuario es comercial si NO ve todas las cuentas y tiene al menos un prefijo
        return !this.canViewAll() && (auth?.prefijosPermitidos?.length ?? 0) > 0;
    }

    // Obtener el prefijo único del comercial (si tiene solo uno)
    getPrefijoUnico(): number | null {
        const prefijos = this.getPrefijosPermitidos();
        if (prefijos.length === 1) {
            return prefijos[0];
        }
        return null;
    }

    getUser(): UserPermissions['user'] | null {
        const auth = this.getAuth();
        return auth?.user || null;
    }
}

export const permissionService = new PermissionService();

// Hook para usar en componentes React
export function usePermissions() {
    return permissionService;
}
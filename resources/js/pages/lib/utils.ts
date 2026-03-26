import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Agrega esta función
export function toUrl(path: string): string {
    // Convierte una ruta a URL completa si es necesario
    if (path.startsWith('http') || path.startsWith('/')) {
        return path;
    }
    return `/${path}`;
}
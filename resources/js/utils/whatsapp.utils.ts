// resources/js/utils/whatsapp.utils.ts

/**
 * Normaliza un número de teléfono argentino al formato internacional
 * 
 * Reglas:
 * - Los números móviles llevan 9 después del código de país (54)
 * - El formato internacional es: 549 + código de área (sin el 0) + número (8 dígitos)
 * 
 */
const normalizeArgentinePhone = (phone: string): string => {
    // Eliminar todos los caracteres no numéricos
    let clean = phone.replace(/\D/g, '');
    
    // Si el número ya tiene código de país 54 y está bien formado
    if (clean.startsWith('549') && (clean.length === 12 || clean.length === 13)) {
        // Formato correcto: 549 + código área (2-3 dígitos) + número (7-8 dígitos)
        return clean;
    }
    
    // Si empieza con 54 pero no tiene el 9 (número fijo)
    if (clean.startsWith('54') && clean.length >= 10 && clean.length <= 12) {
        return clean;
    }
    
    // Si tiene 11 dígitos y empieza con 9 (ej: 93446541745)
    if (clean.length === 11 && clean.startsWith('9')) {
        // Quitar el 9 inicial y agregar 54
        return '54' + clean;
    }
    
    // Si tiene 10 dígitos (formato estándar: código área + número)
    if (clean.length === 10) {
        // Detectar si es móvil (códigos de área de móviles en Argentina)
        const codigoArea = clean.substring(0, 3);
        const codigosMoviles = [
                // Buenos Aires
                '11',
                // Buenos Aires Provincia
                '221', '222', '223', '224', '225', '226', '227', '228', '229',
                '230', '231', '232', '233', '234', '235', '236', '237', '238', '239',
                // Catamarca
                '383',
                // Chaco
                '362', '364', '372', '373',
                // Chubut
                '280', '281', '282', '283', '284', '285', '286', '287', '288', '289',
                '290', '291', '292', '293', '294', '295', '296', '297', '298', '299',
                // Córdoba
                '351', '352', '353', '354', '356', '357', '358',
                // Corrientes
                '377', '378', '379',
                // Entre Ríos
                '341', '342', '343', '344', '345',
                // Formosa
                '370', '371',
                // Jujuy
                '388',
                // La Pampa
                '230', '232', '233', '234',
                // La Rioja
                '380', '382',
                // Mendoza
                '261', '262', '263',
                // Misiones
                '375', '376',
                // Neuquén
                '299',
                // Río Negro
                '292', '293', '294', '298',
                // Salta
                '387',
                // San Juan
                '264',
                // San Luis
                '265', '266',
                // Santa Cruz
                '296', '297',
                // Santa Fe
                '341', '342', '343', '346', '347', '348', '349',
                // Santiago del Estero
                '384', '385',
                // Tierra del Fuego
                '290',
                // Tucumán
                '381'
        ];
        
        // Si el código de área está en la lista de móviles o es '11' (BA)
        if (codigosMoviles.includes(codigoArea) || clean.startsWith('11')) {
            return '549' + clean;
        } else {
            // Es número fijo
            return '54' + clean;
        }
    }
    
    // Si tiene 9 dígitos (código área de 2 dígitos + número de 7 dígitos)
    if (clean.length === 9) {
        // Asumimos que es fijo
        return '54' + clean;
    }
    
    // Si tiene 8 dígitos (número sin código de área)
    if (clean.length === 8) {
        // Asumimos que es fijo de Buenos Aires
        return '5411' + clean;
    }
    
    // Si tiene 7 dígitos (número corto, improbable)
    return clean;
};

export const sendWhatsApp = (phone: string, message: string) => {
    // Limpiar el teléfono de caracteres no numéricos
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Normalizar número argentino
    cleanPhone = normalizeArgentinePhone(cleanPhone);
    
    const encodedMessage = encodeURIComponent(message);
    
    // Detectar si es dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // En móvil, usar esquema nativo que funciona con WhatsApp y WhatsApp Business
        const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
        window.location.href = whatsappUrl;
        
        // Fallback si no funciona (abrir en web)
        setTimeout(() => {
            window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
        }, 500);
    } else {
        // En escritorio, usar web
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    }
};


export const sendWhatsAppWithFile = async (
    phone: string, 
    message: string, 
    pdfBlob: Blob, 
    filename: string,
    pdfUrl?: string  // URL temporal del PDF (necesaria)
): Promise<{ success: boolean; error?: string }> => {
    // Normalizar el teléfono
    let cleanPhone = phone.replace(/\D/g, '');
    cleanPhone = normalizeArgentinePhone(cleanPhone);
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // EN MÓVIL: Usar enlace en lugar de adjuntar archivo
    if (isMobile && pdfUrl) {
        // Crear mensaje con el enlace del PDF
        const mensajeConEnlace = `${message}\n\n📄 Ver presupuesto: ${pdfUrl}`;
        const encodedMessage = encodeURIComponent(mensajeConEnlace);
        
        // Abrir WhatsApp directamente con el contacto
        window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
        
        return { success: true };
    }
    
    // EN ESCRITORIO: Intentar Web Share con archivo (funciona mejor en escritorio)
    if (!isMobile && navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: filename,
                    text: message,
                    files: [file]
                });
                return { success: true };
            } catch (shareError) {
                console.error('Error en Web Share:', shareError);
                // Si falla, continuar con fallback
            }
        }
    }
    
    // EN ESCRITORIO (fallback): Descargar PDF y abrir WhatsApp
    if (!isMobile) {
        try {
            // Descargar PDF
            const downloadUrl = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            // Abrir WhatsApp con texto
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
            
            return { success: true };
        } catch (error) {
            console.error('Error:', error);
            return { success: false, error: 'No se pudo procesar la solicitud' };
        }
    }
    
    // Último recurso: solo texto sin PDF
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
    
    return { success: true };
};

export const createPriceQueryMessage = (producto: { codigopro?: string; nombre: string }): string => {
    const codigo = producto.codigopro ? ` (${producto.codigopro})` : '';
    return `Hola Guille, necesito precio actualizado de ${producto.nombre}${codigo} para presupuestar. ¡Gracias!`;
};
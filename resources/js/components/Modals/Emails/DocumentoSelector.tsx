// resources/js/components/Modals/Emails/DocumentoSelector.tsx

import React, { useState, useEffect } from 'react';
import { File, Folder, FileText, FileImage, FileSpreadsheet, FileArchive, ChevronRight, X, ChevronLeft, Home } from 'lucide-react';

interface FileItem {
    name: string;
    path: string;
    lastModified: string | null;
    size: string | null;
    extension: string | null;
}

interface FilesData {
    directories: FileItem[];
    files: FileItem[];
}

interface DocumentoSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (archivos: FileItem[]) => void;
    companiaId: number;
    selectedFiles: FileItem[];
}

export default function DocumentoSelector({
    isOpen,
    onClose,
    onSelect,
    companiaId,
    selectedFiles = []
}: DocumentoSelectorProps) {
    const [currentRelativePath, setCurrentRelativePath] = useState<string>('');
    const [currentFullPath, setCurrentFullPath] = useState<string>('');
    const [folderContents, setFolderContents] = useState<Record<string, FilesData>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Determinar la carpeta base según la compañía
    const getBaseFolder = () => {
        switch (companiaId) {
            case 2: return 'smartsat';
            case 3: return '360';
            default: return 'localsat';
        }
    };

    // Obtener el nombre de la compañía
    const getCompanyName = () => {
        switch (companiaId) {
            case 2: return 'SmartSat';
            case 3: return '360';
            default: return 'LocalSat';
        }
    };

    // Inicializar al abrir el modal
    useEffect(() => {
        if (isOpen) {
            const baseFolder = getBaseFolder();
            // Para la API, enviamos ruta vacía (carpeta raíz del usuario)
            setCurrentRelativePath('');
            setCurrentFullPath(baseFolder);
            setSelected({});
            setError(null);
            
            // Cargar el contenido de la carpeta base (ruta vacía = raíz del usuario)
            loadFolderContents('');
            
            // Inicializar seleccionados con los archivos ya seleccionados
            const selectedMap: Record<string, boolean> = {};
            selectedFiles.forEach(f => {
                // Guardar la ruta completa que viene del backend
                selectedMap[f.path] = true;
            });
            setSelected(selectedMap);
        }
    }, [isOpen, companiaId]);

    const loadFolderContents = async (relativePath: string) => {
        // Usamos relativePath como clave para el caché
        const cacheKey = relativePath || 'root';
        
        // Si ya tenemos el contenido, no recargar
        if (folderContents[cacheKey]) {
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            // IMPORTANTE: Para la API, enviamos la ruta relativa (sin la carpeta base)
            // Si relativePath está vacío, la API devolverá la raíz del usuario
            const url = `/comercial/documentacion/browse?path=${encodeURIComponent(relativePath)}`;
            
            const response = await fetch(url, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            setFolderContents(prev => ({
                ...prev,
                [cacheKey]: data.files
            }));
            
        } catch (error) {
            setError('Error al cargar el contenido de la carpeta');
        } finally {
            setLoading(false);
        }
    };

    const navigateTo = (folderName: string) => {
        // Construir la nueva ruta relativa
        let newRelativePath = '';
        if (currentRelativePath === '') {
            newRelativePath = folderName;
        } else {
            newRelativePath = `${currentRelativePath}/${folderName}`;
        }
        
        setCurrentRelativePath(newRelativePath);
        setCurrentFullPath(`${getBaseFolder()}/${newRelativePath}`);
        loadFolderContents(newRelativePath);
    };

    const navigateBack = () => {
        if (!currentRelativePath) return;
        
        const parts = currentRelativePath.split('/');
        parts.pop();
        const newRelativePath = parts.join('/');
        
        setCurrentRelativePath(newRelativePath);
        setCurrentFullPath(newRelativePath ? `${getBaseFolder()}/${newRelativePath}` : getBaseFolder());
        loadFolderContents(newRelativePath);
    };

    const navigateHome = () => {
        setCurrentRelativePath('');
        setCurrentFullPath(getBaseFolder());
        loadFolderContents('');
    };

    const toggleFile = (file: FileItem) => {
        setSelected(prev => ({
            ...prev,
            [file.path]: !prev[file.path]
        }));
    };

    const getFileIcon = (extension: string | null) => {
        const ext = extension?.toLowerCase() || '';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
            return <FileImage size={18} className="text-blue-500" />;
        } else if (ext === 'pdf') {
            return <FileText size={18} className="text-red-600" />;
        } else if (['doc', 'docx'].includes(ext)) {
            return <FileText size={18} className="text-blue-800" />;
        } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
            return <FileSpreadsheet size={18} className="text-green-700" />;
        } else if (['zip', 'rar', '7z'].includes(ext)) {
            return <FileArchive size={18} className="text-yellow-700" />;
        } else {
            return <File size={18} className="text-gray-500" />;
        }
    };

    const handleConfirm = () => {
    const archivosSeleccionados = Object.keys(selected)
        .filter(key => selected[key])
        .map(path => {
            // Buscar el archivo en todos los contenidos cargados
            for (const content of Object.values(folderContents)) {
                const file = content.files.find(f => f.path === path);
                if (file) {
                    console.log('Archivo encontrado:', file);
                    return file;
                }
            }
            return null;
        })
        .filter(f => f !== null) as FileItem[];
    onSelect(archivosSeleccionados);
    onClose();
};

    // Obtener el contenido actual usando la ruta relativa como clave
    const cacheKey = currentRelativePath || 'root';
    const currentContent = folderContents[cacheKey];
    
    // Construir breadcrumbs para visualización
    const pathParts = currentRelativePath ? currentRelativePath.split('/') : [];
    const breadcrumbs = [
        { name: getCompanyName(), path: '' },
        ...pathParts.map((part, index) => ({
            name: part,
            path: pathParts.slice(0, index + 1).join('/')
        }))
    ];

    // Filtrar archivos por búsqueda
    const filteredFiles = currentContent?.files?.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const hasDirectories = currentContent?.directories && currentContent.directories.length > 0;
    const hasFiles = filteredFiles.length > 0;
    const selectedCount = Object.values(selected).filter(Boolean).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
            <div className="fixed inset-0 bg-black/60" onClick={onClose} />
            
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Folder size={20} className="text-blue-600" />
                            Adjuntar Documentación - {getCompanyName()}
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navegación y búsqueda */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                        {/* Breadcrumbs con botones de navegación */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                {currentRelativePath && (
                                    <button
                                        onClick={navigateBack}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Atrás"
                                    >
                                        <ChevronLeft size={18} className="text-gray-600" />
                                    </button>
                                )}
                                <button
                                    onClick={navigateHome}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Inicio"
                                >
                                    <Home size={18} className="text-gray-600" />
                                </button>
                                <div className="flex items-center gap-1 text-sm text-gray-600 ml-2">
                                    {breadcrumbs.map((crumb, index) => (
                                        <React.Fragment key={crumb.path}>
                                            {index > 0 && <ChevronRight size={14} className="text-gray-400" />}
                                            <button
                                                onClick={() => {
                                                    if (crumb.path === '') {
                                                        navigateHome();
                                                    } else {
                                                        setCurrentRelativePath(crumb.path);
                                                        setCurrentFullPath(`${getBaseFolder()}/${crumb.path}`);
                                                        loadFolderContents(crumb.path);
                                                    }
                                                }}
                                                className={`hover:text-blue-600 hover:underline ${
                                                    index === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : 'text-gray-500'
                                                }`}
                                            >
                                                {crumb.name}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <input
                            type="text"
                            placeholder="Buscar archivos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Lista de archivos */}
                    <div className="p-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">Cargando archivos...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <div className="text-red-500 mb-2">
                                    <File size={48} className="mx-auto" />
                                </div>
                                <p className="text-red-600 text-sm">{error}</p>
                                <button
                                    onClick={() => loadFolderContents(currentRelativePath)}
                                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                                >
                                    Reintentar
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {/* Subcarpetas */}
                                {hasDirectories && currentContent?.directories.map(dir => (
                                    <button
                                        key={dir.path}
                                        onClick={() => navigateTo(dir.name)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left transition-colors group"
                                    >
                                        <Folder size={20} className="text-yellow-600 group-hover:text-yellow-700" />
                                        <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                            {dir.name}
                                        </span>
                                        <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                                    </button>
                                ))}

                                {/* Archivos */}
                                {hasFiles && (
                                    <>
                                        {hasDirectories && (
                                            <div className="border-t border-gray-200 my-2" />
                                        )}
                                        {filteredFiles.map(file => (
                                            <div
                                                key={file.path}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={!!selected[file.path]}
                                                    onChange={() => toggleFile(file)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                {getFileIcon(file.extension)}
                                                <span className="flex-1 text-sm truncate text-gray-700" title={file.name}>
                                                    {file.name}
                                                </span>
                                                {file.size && (
                                                    <span className="text-xs text-gray-400 flex-shrink-0">{file.size}</span>
                                                )}
                                            </div>
                                        ))}
                                    </>
                                )}

                                {!hasDirectories && !hasFiles && (
                                    <div className="text-center py-12">
                                        <File size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500 text-sm">
                                            {searchTerm ? 'No se encontraron archivos' : 'Esta carpeta está vacía'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
                        <span className="text-sm text-gray-600">
                            {selectedCount} archivo(s) seleccionado(s)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={selectedCount === 0}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedCount > 0
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Adjuntar seleccionados
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
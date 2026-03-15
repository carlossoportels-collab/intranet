// resources/js/components/Modals/Emails/DocumentoSelector.tsx

import React, { useState, useEffect } from 'react';
import { File, Folder, FileText, FileImage, FileSpreadsheet, FileArchive, ChevronRight, Download, X } from 'lucide-react';

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
    const [currentPath, setCurrentPath] = useState<string>('');
    const [folderContents, setFolderContents] = useState<Record<string, FilesData>>({});
    const [loading, setLoading] = useState<string | null>(null);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');

    // Inicializar con la carpeta de la compañía
    useEffect(() => {
        if (isOpen) {
            const baseFolder = companiaId === 2 ? 'smartsat' : 
                              companiaId === 3 ? '360' : 'localsat';
            setCurrentPath(baseFolder);
            loadFolderContents(baseFolder);
            
            // Inicializar seleccionados
            const selectedMap: Record<string, boolean> = {};
            selectedFiles.forEach(f => {
                selectedMap[f.path] = true;
            });
            setSelected(selectedMap);
        }
    }, [isOpen, companiaId]);

    const loadFolderContents = async (path: string) => {
        if (folderContents[path]) return;
        
        setLoading(path);
        try {
            const response = await fetch(`/comercial/documentacion/browse?path=${encodeURIComponent(path)}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Error cargando carpeta');
            
            const data = await response.json();
            setFolderContents(prev => ({
                ...prev,
                [path]: data.files
            }));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(null);
        }
    };

    const navigateTo = (path: string) => {
        setCurrentPath(path);
        loadFolderContents(path);
    };

    const toggleFile = (file: FileItem) => {
        setSelected(prev => ({
            ...prev,
            [file.path]: !prev[file.path]
        }));
    };

    const getFileIcon = (extension: string | null) => {
        const ext = extension?.toLowerCase() || '';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) {
            return <FileImage size={16} className="text-blue-500" />;
        } else if (ext === 'pdf') {
            return <FileText size={16} className="text-red-600" />;
        } else if (['doc', 'docx'].includes(ext)) {
            return <FileText size={16} className="text-blue-800" />;
        } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
            return <FileSpreadsheet size={16} className="text-green-700" />;
        } else if (['zip', 'rar', '7z'].includes(ext)) {
            return <FileArchive size={16} className="text-yellow-700" />;
        } else {
            return <File size={16} className="text-gray-500" />;
        }
    };

    const handleConfirm = () => {
        const archivosSeleccionados = Object.keys(selected)
            .filter(key => selected[key])
            .map(path => {
                // Buscar el archivo en todos los contenidos cargados
                for (const content of Object.values(folderContents)) {
                    const file = content.files.find(f => f.path === path);
                    if (file) return file;
                }
                return null;
            })
            .filter(f => f !== null) as FileItem[];
        
        onSelect(archivosSeleccionados);
        onClose();
    };

    const currentContent = currentPath ? folderContents[currentPath] : null;
    const pathParts = currentPath.split('/');
    const breadcrumbs = pathParts.map((part, index) => {
        const path = pathParts.slice(0, index + 1).join('/');
        const displayName = index === 0 ? 
            (part === 'localsat' ? 'LocalSat' : 
             part === 'smartsat' ? 'SmartSat' : 
             part === '360' ? '360' : part) : part;
        
        return { name: displayName, path };
    });

    // Filtrar archivos por búsqueda
    const filteredFiles = currentContent?.files.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
            <div className="fixed inset-0 bg-black/60" onClick={onClose} />
            
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Adjuntar Documentación
                        </h3>
                        <button 
                            onClick={onClose} 
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Breadcrumbs y búsqueda */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 flex-wrap">
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.path}>
                                    {index > 0 && <ChevronRight size={14} className="text-gray-400" />}
                                    <button
                                        onClick={() => navigateTo(crumb.path)}
                                        className="hover:text-sat hover:underline"
                                    >
                                        {crumb.name}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                        
                        <input
                            type="text"
                            placeholder="Buscar archivos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-sat focus:border-sat"
                        />
                    </div>

                    {/* Lista de archivos */}
                    <div className="p-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
                        {loading === currentPath ? (
                            <div className="text-center py-8">
                                <div className="animate-spin h-8 w-8 border-4 border-sat border-t-transparent rounded-full mx-auto mb-2" />
                                <p className="text-gray-500">Cargando...</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {/* Subcarpetas */}
                                {currentContent?.directories.map(dir => (
                                    <button
                                        key={dir.path}
                                        onClick={() => navigateTo(dir.path)}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left"
                                    >
                                        <Folder size={18} className="text-sat" />
                                        <span className="flex-1 text-sm font-medium">{dir.name}</span>
                                        <ChevronRight size={16} className="text-gray-400" />
                                    </button>
                                ))}

                                {/* Archivos */}
                                {filteredFiles.map(file => (
                                    <div
                                        key={file.path}
                                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!selected[file.path]}
                                            onChange={() => toggleFile(file)}
                                            className="h-4 w-4 text-sat focus:ring-sat border-gray-300 rounded"
                                        />
                                        {getFileIcon(file.extension)}
                                        <span className="flex-1 text-sm truncate" title={file.name}>
                                            {file.name}
                                        </span>
                                        {file.size && (
                                            <span className="text-xs text-gray-500">{file.size}</span>
                                        )}
                                    </div>
                                ))}

                                {filteredFiles.length === 0 && currentContent?.directories.length === 0 && (
                                    <p className="text-center py-8 text-gray-500">
                                        No hay archivos en esta carpeta
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
                        <span className="text-sm text-gray-600">
                            {Object.values(selected).filter(Boolean).length} archivo(s) seleccionado(s)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 bg-sat text-white rounded-md text-sm font-medium hover:bg-sat-600"
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
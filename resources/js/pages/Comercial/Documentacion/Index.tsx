// resources/js/pages/comercial/documentacion/index.tsx

import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    Folder, File, FileText, FileImage, FileSpreadsheet, FileArchive, 
    Download, HardDrive, ChevronRight, ChevronLeft, Home, ChevronDown
} from 'lucide-react';

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

interface Props {
    files: FilesData;
    currentPath: string;
    companiaId: number | null;
    relativePath?: string;
    isAdmin?: boolean;
}

interface FolderInfo {
    id: string;
    name: string;
    path: string;
    companiaId: number;
    color: string;
    textColor: string;
}

export default function DocumentacionIndex({ files, currentPath, companiaId, relativePath = '', isAdmin = false }: Props) {
    const [hoveredFile, setHoveredFile] = useState<string | null>(null);
    const [selectedPath, setSelectedPath] = useState<string>('');
    const [folderContents, setFolderContents] = useState<Record<string, FilesData>>({});
    const [loadingPath, setLoadingPath] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
    const [currentBaseFolder, setCurrentBaseFolder] = useState<string>('');
    
    // Definir las carpetas disponibles según el rol
    const availableFolders: FolderInfo[] = isAdmin 
        ? [
            { id: 'localsat', name: 'LocalSat', path: 'localsat', companiaId: 1, color: 'bg-local-500', textColor: 'text-local-800' },
            { id: 'smartsat', name: 'SmartSat', path: 'smartsat', companiaId: 2, color: 'bg-[#444444]', textColor: 'text-gray-700' },
            { id: '360', name: '360', path: '360', companiaId: 3, color: 'bg-[#EA9B11]', textColor: 'text-amber-800' }
          ]
        : [
            { 
                id: currentPath, 
                name: currentPath === 'localsat' ? 'LocalSat' : 
                       currentPath === 'smartsat' ? 'SmartSat' : '360', 
                path: currentPath, 
                companiaId: companiaId || 1,
                color: currentPath === 'localsat' ? 'bg-local-500' :
                       currentPath === 'smartsat' ? 'bg-[#444444]' : 'bg-[#EA9B11]',
                textColor: currentPath === 'localsat' ? 'text-local-800' :
                          currentPath === 'smartsat' ? 'text-gray-700' : 'text-amber-800'
            }
          ];
    
    // Función para contar archivos en una carpeta (incluyendo subcarpetas)
    const countFilesInFolder = (folderPath: string): number => {
        const content = folderContents[folderPath];
        if (!content) return 0;
        
        let count = content.files.length;
        
        // Sumar archivos de subcarpetas si están cargadas
        content.directories.forEach(subdir => {
            const subdirPath = `${folderPath}/${subdir.name}`;
            const subdirContent = folderContents[subdirPath];
            if (subdirContent) {
                count += subdirContent.files.length;
            }
        });
        
        return count;
    };
    
    // Inicializar
    useEffect(() => {
        const initialize = async () => {
            if (isAdmin) {
                // Admin: empezar con localsat
                setCurrentBaseFolder('localsat');
                setExpandedFolders({ 'localsat': true });
                await loadFolderContents('localsat');
            } else {
                // Usuario normal: usar su carpeta
                const userFolder = availableFolders[0].path;
                setCurrentBaseFolder(userFolder);
                setExpandedFolders({ [userFolder]: true });
                
                // Guardar el contenido inicial
                setFolderContents(prev => ({
                    ...prev,
                    [userFolder]: files
                }));
                setSelectedPath(userFolder);
                
                // Cargar subcarpetas iniciales para tener los conteos
                if (files.directories.length > 0) {
                    files.directories.forEach(async (subdir) => {
                        const subdirPath = `${userFolder}/${subdir.name}`;
                        await loadFolderContents(subdirPath, false);
                    });
                }
            }
        };
        
        initialize();
    }, []);
    
    const loadFolderContents = async (path: string, updateSelection: boolean = true) => {
        // Si ya tenemos el contenido, solo seleccionar si es necesario
        if (folderContents[path]) {
            if (updateSelection) {
                setSelectedPath(path);
            }
            return;
        }
        
        setLoadingPath(path);
        
        try {
            let url = '';
            
            if (isAdmin) {
                // Para admin, el path ya incluye la carpeta base
                url = `/comercial/documentacion/browse?path=${encodeURIComponent(path)}`;
            } else {
                // Para usuario normal, necesitamos la ruta relativa a su carpeta
                const userFolder = availableFolders[0].path;
                const relativePath = path.replace(userFolder + '/', '');
                url = `/comercial/documentacion/browse?path=${encodeURIComponent(relativePath)}`;
            }
            
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
                [path]: data.files
            }));
            
            if (updateSelection) {
                setSelectedPath(path);
            }
            
            // Extraer la carpeta base de la ruta
            const baseFolder = path.split('/')[0];
            if (availableFolders.some(f => f.path === baseFolder)) {
                setCurrentBaseFolder(baseFolder);
            }
            
            // Cargar automáticamente las subcarpetas para tener los conteos
            if (data.files.directories.length > 0) {
                data.files.directories.forEach(async (subdir: FileItem) => {
                    const subdirPath = `${path}/${subdir.name}`;
                    if (!folderContents[subdirPath]) {
                        await loadFolderContents(subdirPath, false);
                    }
                });
            }
            
        } catch (error) {
            console.error('Error cargando carpeta:', error);
            alert('Error al cargar el contenido de la carpeta');
        } finally {
            setLoadingPath(null);
        }
    };
    
    const toggleFolderExpand = (folderPath: string) => {
        setExpandedFolders(prev => ({
            ...prev,
            [folderPath]: !prev[folderPath]
        }));
    };
    
    const handleFolderClick = async (folder: FolderInfo) => {
        // Expandir la carpeta
        setExpandedFolders(prev => ({
            ...prev,
            [folder.path]: true
        }));
        
        // Cargar contenido
        await loadFolderContents(folder.path, true);
    };
    
    const handleSubfolderClick = async (parentPath: string, subfolderName: string) => {
        const fullPath = `${parentPath}/${subfolderName}`;
        await loadFolderContents(fullPath, true);
    };
    
    const navigateBack = () => {
        if (!selectedPath) return;
        
        const parts = selectedPath.split('/');
        if (parts.length <= 1) return;
        
        // Quitar el último segmento
        parts.pop();
        const parentPath = parts.join('/');
        
        loadFolderContents(parentPath, true);
    };
    
    const navigateHome = () => {
        if (currentBaseFolder) {
            loadFolderContents(currentBaseFolder, true);
        }
    };
    
const downloadFile = (filePath: string) => {
    // filePath viene como "localsat/addenda/servicios/archivo.pdf"
    // Necesitamos extraer la parte relativa después de la carpeta base
    
    if (isAdmin) {
        // Para admin, el path ya está completo
        window.location.href = `/comercial/documentacion/download?file=${encodeURIComponent(filePath)}`;
    } else {
        // Para usuario normal, necesitamos la ruta relativa a su carpeta
        const userFolder = availableFolders[0].path; // ej: "localsat"
        const relativePath = filePath.replace(userFolder + '/', '');
        window.location.href = `/comercial/documentacion/download?file=${encodeURIComponent(relativePath)}`;
    }
};
    
    const getFileIcon = (extension: string | null) => {
        const ext = extension?.toLowerCase() || '';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(ext)) {
            return <FileImage size={20} className="text-blue-500" />;
        }
        else if (ext === 'pdf') {
            return <FileText size={20} className="text-red-600" />;
        }
        else if (['doc', 'docx'].includes(ext)) {
            return <FileText size={20} className="text-blue-800" />;
        }
        else if (['xls', 'xlsx', 'csv'].includes(ext)) {
            return <FileSpreadsheet size={20} className="text-green-700" />;
        }
        else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return <FileArchive size={20} className="text-yellow-700" />;
        }
        else {
            return <File size={20} className="text-gray-500" />;
        }
    };
    
    const getCompanyName = () => {
        if (isAdmin) return 'Administrador';
        switch (companiaId) {
            case 2: return 'SmartSat';
            case 3: return '360';
            default: return 'LocalSat';
        }
    };
    
    const truncateText = (text: string, maxLength: number = 35) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };
    
    const selectedData = selectedPath ? folderContents[selectedPath] : null;
    
    // Obtener las partes de la ruta para el breadcrumb
    const pathParts = selectedPath ? selectedPath.split('/') : [];
    const displayPath = pathParts.map((part, index) => {
        if (index === 0) {
            // Es la carpeta base
            const folder = availableFolders.find(f => f.path === part);
            return folder ? folder.name : part;
        }
        return part;
    }).join(' / ');
    
    return (
        <AppLayout title={`Documentación - ${getCompanyName()}`}>
            <Head title={`Documentación - ${getCompanyName()}`} />
            
            <div className="py-8 animate-fade-in-up">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-local-50 border border-local-100">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-sat flex items-center justify-center text-white font-semibold mr-3 shadow-md">
                                    <HardDrive size={20} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-local-800">
                                        Documentación
                                    </h1>
                                    <p className="text-xs text-local-600">
                                        {getCompanyName()} • {isAdmin ? 'Acceso a todas las carpetas' : '1 carpeta disponible'}
                                    </p>
                                </div>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-sat text-white shadow-sm">
                                {isAdmin ? 'Admin' : getCompanyName()}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Panel izquierdo - Lista de carpetas */}
                        <div className="lg:w-1/3 xl:w-1/4">
                            <div className="bg-white rounded-xl border border-local-100 shadow-sm overflow-hidden sticky top-20">
                                <div className="p-4 border-b border-local-100 bg-local-50">
                                    <h2 className="font-semibold flex items-center text-local-800">
                                        <Folder size={18} className="mr-2 text-sat" />
                                        {isAdmin ? 'Carpetas por compañía' : 'Carpetas disponibles'}
                                    </h2>
                                </div>
                                <div className="p-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
                                    {availableFolders.map((folder) => {
                                        const isExpanded = expandedFolders[folder.path];
                                        const folderData = folderContents[folder.path];
                                        const hasSubfolders = folderData?.directories && folderData.directories.length > 0;
                                        const isSelected = selectedPath === folder.path || selectedPath?.startsWith(folder.path + '/');
                                        const totalFiles = folderData ? countFilesInFolder(folder.path) : 0;
                                        
                                        return (
                                            <div key={folder.id} className="select-none mb-2">
                                                <div
                                                    onClick={() => handleFolderClick(folder)}
                                                    className={`
                                                        flex items-center p-3 rounded-lg cursor-pointer transition-all
                                                        ${isSelected 
                                                            ? 'bg-local-50 border-l-4 border-sat' 
                                                            : 'hover:bg-local-50/50 border-l-4 border-transparent'
                                                        }
                                                    `}
                                                >
                                                    <div className={`w-2 h-2 rounded-full mr-3 ${folder.color}`} />
                                                    <span className={`text-sm font-medium ${folder.textColor} truncate flex-1`}>
                                                        {folder.name}
                                                    </span>
                                                    {totalFiles > 0 && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-local-100 text-local-700 ml-2">
                                                            {totalFiles}
                                                        </span>
                                                    )}
                                                    {loadingPath === folder.path ? (
                                                        <div className="w-4 h-4 border-2 border-local-200 border-t-sat rounded-full animate-spin ml-2"></div>
                                                    ) : hasSubfolders && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleFolderExpand(folder.path);
                                                            }}
                                                            className="ml-1 p-1 hover:bg-local-100 rounded"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown size={16} className="text-local-500" />
                                                            ) : (
                                                                <ChevronRight size={16} className="text-local-500" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {/* Subcarpetas */}
                                                {isExpanded && folderData?.directories && folderData.directories.length > 0 && (
                                                    <div className="ml-8 mt-2 space-y-1 border-l-2 border-local-100 pl-2">
                                                        {folderData.directories.map((subdir) => {
                                                            const subdirFullPath = `${folder.path}/${subdir.name}`;
                                                            const isSubdirSelected = selectedPath === subdirFullPath;
                                                            const subdirData = folderContents[subdirFullPath];
                                                            const subdirFileCount = subdirData?.files.length || 0;
                                                            
                                                            return (
                                                                <div
                                                                    key={subdir.path}
                                                                    onClick={() => handleSubfolderClick(folder.path, subdir.name)}
                                                                    className={`
                                                                        flex items-center p-2 rounded-lg cursor-pointer text-sm group
                                                                        ${isSubdirSelected 
                                                                            ? 'bg-local-50 text-local-800' 
                                                                            : 'hover:bg-local-50/50 text-local-700'
                                                                        }
                                                                    `}
                                                                >
                                                                    <ChevronRight size={14} className="mr-2 text-local-400 group-hover:text-sat" />
                                                                    <Folder size={16} className="mr-2 text-local-500 group-hover:text-sat" />
                                                                    <span className="truncate flex-1">
                                                                        {subdir.name}
                                                                    </span>
                                                                    {subdirFileCount > 0 && (
                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-local-100 text-local-700 ml-2">
                                                                            {subdirFileCount}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        
                        {/* Panel derecho - Contenido */}
                        <div className="lg:w-2/3 xl:w-3/4">
                            <div className="bg-white rounded-xl border border-local-100 shadow-sm">
                                <div className="p-4 border-b border-local-100 bg-local-50">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-semibold flex items-center text-local-800">
                                            <File size={18} className="mr-2 text-sat" />
                                            {selectedPath ? (
                                                <>Contenido de: <span className="ml-1 font-normal text-local-700">{displayPath}</span></>
                                            ) : (
                                                'Selecciona una carpeta para ver su contenido'
                                            )}
                                        </h2>
                                        
                                        {/* Botones de navegación */}
                                        {selectedPath && pathParts.length > 1 && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={navigateBack}
                                                    className="p-1.5 rounded-lg hover:bg-local-100 text-local-600 transition-colors"
                                                    title="Atrás"
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                                <button
                                                    onClick={navigateHome}
                                                    className="p-1.5 rounded-lg hover:bg-local-100 text-local-600 transition-colors"
                                                    title="Inicio"
                                                >
                                                    <Home size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-6 min-h-[500px]">
                                    {selectedPath && selectedData ? (
                                        <>
                                            {selectedData.files.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {selectedData.files.map((file) => (
                                                        <div
                                                            key={file.path}
                                                            className="relative flex items-center p-4 border-2 border-local-100 rounded-xl hover:border-sat/30 transition-all duration-200 group bg-white"
                                                            onMouseEnter={() => setHoveredFile(file.path)}
                                                            onMouseLeave={() => setHoveredFile(null)}
                                                        >
                                                            {hoveredFile === file.path && (
                                                                <div className="absolute left-1/2 transform -translate-x-1/2 -top-12 bg-local-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-20 shadow-xl">
                                                                    {file.name}
                                                                    <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1 w-2 h-2 bg-local-800 rotate-45"></div>
                                                                </div>
                                                            )}
                                                            
                                                            <div className="mr-3 flex-shrink-0">
                                                                {getFileIcon(file.extension)}
                                                            </div>
                                                            
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-local-800 truncate">
                                                                    {truncateText(file.name, 35)}
                                                                </p>
                                                                <div className="flex items-center text-xs text-local-600 mt-1">
                                                                    <span className="px-2 py-0.5 rounded-full uppercase text-[10px] font-mono bg-local-100 text-local-700">
                                                                        {file.extension || '?'}
                                                                    </span>
                                                                    {file.size && (
                                                                        <>
                                                                            <span className="mx-1 text-local-300">•</span>
                                                                            <span>{file.size}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            <button
                                                                onClick={() => downloadFile(file.path)}
                                                                className="ml-2 p-2 text-local-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-110 hover:bg-sat hover:text-white"
                                                                title="Descargar"
                                                            >
                                                                <Download size={18} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12">
                                                    <File size={48} className="mx-auto text-local-300 mb-4" />
                                                    <p className="text-local-600">Esta carpeta no contiene archivos</p>
                                                    {selectedData.directories.length > 0 && (
                                                        <p className="text-local-400 text-sm mt-2">
                                                            Hay {selectedData.directories.length} subcarpeta{selectedData.directories.length !== 1 ? 's' : ''} disponibles en el panel izquierdo
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Folder size={48} className="mx-auto text-local-300 mb-4" />
                                            <p className="text-local-600">Selecciona una carpeta de la izquierda para ver su contenido</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer con estadísticas */}
                    <div className="mt-6">
                        <div className="bg-local-50 rounded-lg p-3 border border-local-100">
                            <div className="flex flex-wrap items-center justify-between text-xs text-local-600">
                                <div className="flex items-center space-x-4">
                                    <span className="flex items-center">
                                        <Folder size={14} className="mr-1 text-sat" />
                                        <span>{availableFolders.length} carpetas principales</span>
                                    </span>
                                    {selectedData && (
                                        <>
                                            <span className="flex items-center">
                                                <Folder size={14} className="mr-1 text-sat" />
                                                <span>{selectedData.directories.length} subcarpetas</span>
                                            </span>
                                            <span className="flex items-center">
                                                <File size={14} className="mr-1 text-sat" />
                                                <span>{selectedData.files.length} archivos</span>
                                            </span>
                                        </>
                                    )}
                                </div>
                                <span className="text-local-400">
                                    Pasa el mouse sobre un archivo para ver el nombre completo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
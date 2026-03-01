// resources/js/components/ui/BuscadorModerno.tsx
import React, { useState, useEffect, useRef } from 'react';

interface BuscadorModernoProps {
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
    placeholder?: string;
    className?: string;
    showResultsCount?: boolean;
    resultsCount?: number;
    totalCount?: number;
    suggestions?: string[];
}

const BuscadorModerno: React.FC<BuscadorModernoProps> = ({
    value,
    onChange,
    onClear,
    placeholder = 'Buscar...',
    className = '',
    showResultsCount = false,
    resultsCount = 0,
    totalCount = 0,
    suggestions = []
}) => {
    const [localValue, setLocalValue] = useState(value);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [localValue, onChange, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = () => {
        setLocalValue('');
        if (onClear) onClear();
        inputRef.current?.focus();
    };

    const handleSuggestionClick = (suggestion: string) => {
        setLocalValue(suggestion);
        onChange(suggestion);
        setShowSuggestions(false);
    };

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    className="pl-10 pr-24 py-3 border-2 border-gray-200 rounded-xl text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                />
                
                <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                    {localValue && (
                        <button
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Limpiar búsqueda"
                        >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    {showResultsCount && localValue && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                            {resultsCount} resultados
                        </span>
                    )}
                </div>
            </div>

            {/* Sugerencias (opcional) */}
            {showSuggestions && suggestions.length > 0 && localValue && (
                <div 
                    ref={suggestionsRef}
                    className="absolute z-10 mt-1 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                >
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {/* Resultados count contextual */}
            {showResultsCount && !localValue && totalCount > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                    Mostrando {totalCount} empresas disponibles
                </div>
            )}
        </div>
    );
};

export default BuscadorModerno;
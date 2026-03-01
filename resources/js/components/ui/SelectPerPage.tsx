// resources/js/components/ui/SelectPerPage.tsx
import React from 'react';

interface SelectPerPageProps {
    value: number;
    onChange: (value: number) => void;
    options?: number[];
    className?: string;
}

const SelectPerPage: React.FC<SelectPerPageProps> = ({
    value,
    onChange,
    options = [5, 10, 20, 30, 50],
    className = ''
}) => {
    return (
        <select 
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        >
            {options.map(opt => (
                <option key={opt} value={opt}>{opt}/página</option>
            ))}
        </select>
    );
};

export default SelectPerPage;
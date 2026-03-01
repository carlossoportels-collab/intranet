// resources/js/components/ui/StatsCard.tsx
import React from 'react';

interface StatsCardProps {
    title: string;
    value: number | string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
    icon?: React.ReactNode;
    className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
    title, 
    value, 
    color = 'blue',
    icon,
    className = '' 
}) => {
    const colorClasses = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        purple: 'text-purple-600',
        orange: 'text-orange-600',
        red: 'text-red-600',
        yellow: 'text-yellow-600'
    };

    return (
        <div className={`bg-white p-3 rounded-lg shadow-sm border border-gray-200 ${className}`}>
            <h3 className="font-medium text-gray-700 text-xs mb-1 flex items-center gap-1">
                {icon && <span className="text-gray-400">{icon}</span>}
                {title}
            </h3>
            <p className={`text-xl font-bold ${colorClasses[color]}`}>{value}</p>
        </div>
    );
};

export default StatsCard;
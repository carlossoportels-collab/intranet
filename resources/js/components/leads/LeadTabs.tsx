// resources/js/components/leads/LeadTabs.tsx
import { User, MessageSquare, Bell, TrendingUp } from 'lucide-react';
import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface LeadTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Tab[];
}

const LeadTabs: React.FC<LeadTabsProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="w-full">
      {/* Versión móvil - grid de 2 columnas */}
      <div className="sm:hidden">
        <div className="grid grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-medium
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }
              `}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`
                  ml-1 px-1.5 py-0.5 text-xs rounded-full
                  ${activeTab === tab.id
                    ? 'bg-white text-blue-600'
                    : 'bg-gray-300 text-gray-700'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Versión desktop - tabs horizontales */}
      <div className="hidden sm:block border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 py-2 px-3 border-b-2 text-sm font-medium whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`
                  ml-1 px-1.5 py-0.5 text-xs rounded-full
                  ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default LeadTabs;
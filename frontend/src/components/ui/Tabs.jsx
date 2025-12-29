import React, { useState } from 'react';

export const Tabs = ({ tabs, defaultTab = 0, className = '', onChange }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabClick = (index) => {
    setActiveTab(index);
    if (onChange) {
      onChange(index);
    }
  };

  return (
    <div className={className}>
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleTabClick(index)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${
                  activeTab === index
                    ? 'border-stevensMaroon text-stevensMaroon'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

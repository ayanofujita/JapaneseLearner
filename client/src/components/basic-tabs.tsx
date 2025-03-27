import React, { useState } from 'react';

type TabProps = {
  children: React.ReactNode;
  label: React.ReactNode;
  id: string;
};

type TabsProps = {
  children: React.ReactElement<TabProps>[];
  defaultTab?: string;
};

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

export const BasicTabs: React.FC<TabsProps> = ({ children, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || children[0]?.props.id);

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 border-b mb-4">
        {React.Children.map(children, (child) => {
          // Only accept Tab components
          if (!React.isValidElement(child) || child.type !== Tab) {
            return null;
          }

          const { label, id } = child.props;
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-t-md ${
                isActive 
                  ? 'bg-background text-foreground font-medium border-t border-l border-r' 
                  : 'bg-muted text-muted-foreground'
              }`}
              style={{ marginBottom: '-1px' }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="tab-content">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child) || child.type !== Tab) {
            return null;
          }

          const { id } = child.props;
          return (
            <div 
              key={id} 
              className={`${activeTab !== id ? 'hidden' : ''}`}
            >
              {child.props.children}
            </div>
          );
        })}
      </div>
    </div>
  );
};
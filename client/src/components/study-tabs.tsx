import { useState, useEffect } from 'react';
import { BookOpenCheck, FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StudyTabsProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

/**
 * A custom tabs component to replace the shadcn Tabs component
 * with a simpler implementation that avoids height issues
 */
export default function StudyTabs({ selectedTab, onTabChange }: StudyTabsProps) {
  // Ensure tabs are rerendered on window resize to handle any layout changes
  const [, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-wrap gap-2 mb-4 w-full">
      <button
        onClick={() => onTabChange('flashcards')}
        className={`flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium 
          ${selectedTab === 'flashcards' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'bg-muted text-muted-foreground'}`}
      >
        <BookOpenCheck className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
        <span className="truncate text-sm md:text-base">Flashcards</span>
      </button>
      
      <button
        onClick={() => onTabChange('quiz')}
        className={`flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium
          ${selectedTab === 'quiz' 
            ? 'bg-background text-foreground shadow-sm' 
            : 'bg-muted text-muted-foreground'}`}
      >
        <FlaskConical className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
        <span className="truncate text-sm md:text-base">Quiz</span>
      </button>
    </div>
  );
}

export function StudyTabContent({ 
  tab, 
  selectedTab, 
  children 
}: { 
  tab: string, 
  selectedTab: string,
  children: React.ReactNode 
}) {
  if (tab !== selectedTab) return null;
  
  return (
    <div className="w-full pt-4">
      {children}
    </div>
  );
}
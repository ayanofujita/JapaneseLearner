import React from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cn } from '@/lib/utils';
import { WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

export default function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();
  
  if (isOnline) return null;
  
  return (
    <div 
      className={cn(
        "fixed top-0 left-0 w-full z-50 bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center shadow-md",
        className
      )}
    >
      <WifiOff className="h-4 w-4 mr-2" />
      <span className="text-sm font-medium">You're offline. Some features may be unavailable.</span>
    </div>
  );
}
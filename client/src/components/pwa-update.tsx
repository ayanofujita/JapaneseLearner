import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function PWAUpdateNotification() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showReload, setShowReload] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      // Handle new service worker
      const handleNewServiceWorker = (registration: ServiceWorkerRegistration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              // When the service worker is installed and waiting
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowReload(true);
                
                toast({
                  title: 'Update Available',
                  description: 'A new version of the app is available. Reload to update?',
                  duration: 10000,
                });
              }
            });
          }
        });
      };

      // Check for existing registrations
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          handleNewServiceWorker(registration);
        }
      });
    }
  }, [toast]);

  const reloadPage = () => {
    if (waitingWorker) {
      // Tell the service worker to take control immediately
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // When the service worker takes control, reload the page
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  };

  if (!showReload) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-primary-foreground z-50 shadow-lg border-t">
      <div className="container flex items-center justify-between">
        <p className="text-sm">A new version of the app is available.</p>
        <Button size="sm" onClick={reloadPage}>
          Update Now
        </Button>
      </div>
    </div>
  );
}
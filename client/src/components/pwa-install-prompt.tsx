import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XIcon, DownloadIcon } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = 
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    setIsIOS(isIOSDevice);

    // Detect if the app can be installed
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome from automatically showing the prompt
      e.preventDefault();
      // Save the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    });

    // Clean up event listener
    return () => {
      window.removeEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
      });
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the browser install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    // Reset the deferred prompt variable
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 px-4 z-50">
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">Install App</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDismiss}
              className="h-6 w-6"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Study Japanese anytime, even offline!
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 pt-0">
          {isIOS ? (
            <p className="text-sm text-muted-foreground">
              Tap the share icon <span className="inline-block">⎘</span> and select "Add to Home Screen"
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Install this app on your device for a better experience
            </p>
          )}
        </CardContent>
        <CardFooter>
          {!isIOS && deferredPrompt && (
            <Button 
              variant="default" 
              className="w-full"
              onClick={handleInstall}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Install
            </Button>
          )}
          {isIOS && (
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={handleDismiss}
            >
              Got it
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
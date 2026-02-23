import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, Smartphone, Monitor, Wifi } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  const { isInstallable, installPWA, isInstalled } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const dismissedPrompt = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedPrompt) {
      setDismissed(true);
      return;
    }

    // Show prompt if PWA is installable and not already installed
    if (isInstallable && !isInstalled) {
      // Delay showing the prompt to avoid being too aggressive
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    try {
      await installPWA();
      setShowPrompt(false);
      onInstall?.();
    } catch (error) {
      console.error('Failed to install PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    onDismiss?.();
  };

  const handleLater = () => {
    setShowPrompt(false);
    // Don't set dismissed to true, so it can show again later
  };

  if (!showPrompt || dismissed || isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Download className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Install Book My Table</CardTitle>
          <CardDescription>
            Get quick access to restaurant bookings with our app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span>Access from your home screen</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Wifi className="w-5 h-5 text-green-600" />
              <span>Works offline with cached data</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Monitor className="w-5 h-5 text-purple-600" />
              <span>Faster loading and better performance</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleInstall}
              className="flex-1"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
            <Button
              onClick={handleLater}
              variant="outline"
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>

          <div className="text-center">
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto"
            >
              <X className="w-4 h-4" />
              Don't show again
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Banner version for less intrusive prompting
export function PWAInstallBanner() {
  const { isInstallable, installPWA, isInstalled } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedBanner = localStorage.getItem('pwa_banner_dismissed');
    if (dismissedBanner) {
      setDismissed(true);
      return;
    }

    if (isInstallable && !isInstalled) {
      setShowBanner(true);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    try {
      await installPWA();
      setShowBanner(false);
    } catch (error) {
      console.error('Failed to install PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!showBanner || dismissed || isInstalled) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white p-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5" />
          <div>
            <p className="font-medium">Install Book My Table</p>
            <p className="text-sm text-blue-100">
              Get quick access and better performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            Install
          </Button>
          <button
            onClick={handleDismiss}
            className="text-blue-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for PWA installation status
export function usePWAInstallStatus() {
  const { isInstallable, isInstalled, installPWA } = usePWA();
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const promptDismissed = localStorage.getItem('pwa_prompt_dismissed');
    const bannerDismissed = localStorage.getItem('pwa_banner_dismissed');
    
    setPromptDismissed(!!promptDismissed);
    setBannerDismissed(!!bannerDismissed);
  }, []);

  const canShowPrompt = isInstallable && !isInstalled && !promptDismissed;
  const canShowBanner = isInstallable && !isInstalled && !bannerDismissed;

  return {
    isInstallable,
    isInstalled,
    canShowPrompt,
    canShowBanner,
    installPWA,
  };
}

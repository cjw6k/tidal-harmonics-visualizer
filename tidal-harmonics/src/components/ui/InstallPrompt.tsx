import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Prompt
 *
 * Shows a prompt to install the app when running in a supported browser.
 * The prompt appears after the beforeinstallprompt event fires and can
 * be dismissed or used to trigger the native install dialog.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed before
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      // Prevent Chrome's mini-infobar
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setDismissed(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || dismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
      <div className="bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700 p-4">
        <div className="flex gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm">Install Tidal Harmonics</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Add to home screen for offline access and faster loading
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-slate-500 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-3 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}

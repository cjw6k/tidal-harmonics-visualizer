import { useState, useEffect } from 'react';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' && e.ctrlKey) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm
          text-slate-400 text-xs rounded-lg hover:bg-slate-700 transition-colors"
        title="Keyboard shortcuts (Ctrl+H)"
      >
        ⌨️ Shortcuts
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {KEYBOARD_SHORTCUTS.map((category) => (
            <div key={category.category}>
              <h3 className="text-sm font-medium text-slate-400 mb-2">{category.category}</h3>
              <div className="space-y-1">
                {category.shortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">{shortcut.action}</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-700 text-center text-xs text-slate-500">
          Press <kbd className="px-1 bg-slate-800 rounded">Ctrl+H</kbd> to toggle this help
        </div>
      </div>
    </div>
  );
}

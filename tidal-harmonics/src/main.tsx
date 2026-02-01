import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useTutorialStore } from '@/stores/tutorialStore'

// Expose tutorial store for E2E testing
declare global {
  interface Window {
    __TUTORIAL_STORE__?: typeof useTutorialStore;
  }
}

// Only expose in development/test
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  window.__TUTORIAL_STORE__ = useTutorialStore;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

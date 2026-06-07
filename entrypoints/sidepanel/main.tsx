import ReactDOM from 'react-dom/client';
// Bundled fonts (offline, no CDN): Spectral (serif) + Hanken Grotesk (sans).
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/500.css';
import '@fontsource/spectral/600.css';
import '@fontsource/spectral/400-italic.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './style.css';

declare global {
  interface Window {
    __baselineLoadTimeout?: number;
  }
}

window.clearTimeout(window.__baselineLoadTimeout);

// NOTE: no <React.StrictMode> — its dev double-mount restarts getUserMedia and the
// MediaPipe capture loop, which causes camera flicker. Production is unaffected.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

import ReactDOM from 'react-dom/client';
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

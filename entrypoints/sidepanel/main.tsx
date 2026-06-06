import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

// NOTE: no <React.StrictMode> — its dev double-mount restarts getUserMedia and the
// MediaPipe capture loop, which causes camera flicker. Production is unaffected.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

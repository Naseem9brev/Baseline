import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Catches render errors so the side panel is not a blank white screen. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Baseline] UI crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="serif-h" style={{ fontSize: 16 }}>
            Something went wrong
          </p>
          <p className="leading-relaxed" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
            Try reloading the extension. If you use <code className="rounded bg-[var(--paper-sunk)] px-1">npm run dev</code>,
            make sure only one dev server is running, then reload in chrome://extensions.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="btn btn-primary"
            style={{ width: 'auto', padding: '10px 18px' }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

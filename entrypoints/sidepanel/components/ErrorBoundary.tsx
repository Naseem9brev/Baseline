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
          <p className="text-sm font-semibold text-slate-800">Something went wrong</p>
          <p className="text-xs leading-relaxed text-slate-500">
            Try reloading the extension. If you use <code className="rounded bg-slate-100 px-1">npm run dev</code>,
            make sure only one dev server is running, then reload in chrome://extensions.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

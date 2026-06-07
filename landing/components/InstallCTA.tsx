import { REPO_URL, STORE_URL } from '@/lib/config';

// Shows an "Add to Chrome" button once the Web Store URL is configured,
// otherwise the manual load-unpacked steps. Server component (no client JS).
export default function InstallCTA() {
  if (STORE_URL) {
    return (
      <div className="btn-row">
        <a className="btn btn-primary" href={STORE_URL} target="_blank" rel="noopener noreferrer">
          Add to Chrome — it’s free
        </a>
        <a className="btn btn-ghost" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          View source
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="btn-row">
        <a className="btn btn-primary" href="#install">
          How to install
        </a>
        <a className="btn btn-ghost" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          View source
        </a>
      </div>
      <p className="muted" style={{ fontSize: 14, marginTop: 12 }}>
        Coming soon to the Chrome Web Store. For now it installs in a couple of steps below.
      </p>
    </div>
  );
}

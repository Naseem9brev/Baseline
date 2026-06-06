/** Shown when React never mounts (dev server down, CSP/port mismatch, etc.). */
window.__baselineLoadTimeout = window.setTimeout(function () {
  var root = document.getElementById('root');
  if (root && !root.childElementCount) {
    root.innerHTML =
      '<div style="padding:16px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#334155">' +
      '<p style="font-weight:600;margin:0 0 8px">Baseline didn\u2019t load</p>' +
      '<p style="margin:0 0 8px">Developing? Run <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">npm run dev</code> and keep that terminal open, then reload the extension in <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">chrome://extensions</code>.</p>' +
      '<p style="margin:0">Testing without a dev server? Run <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">npm run build</code> and load <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">.output/chrome-mv3</code> (not <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">chrome-mv3-dev</code>).</p>' +
      '</div>';
  }
}, 4000);

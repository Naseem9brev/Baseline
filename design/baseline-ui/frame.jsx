/* global React */
const { useState } = React;

/* ----------------------------- icons ----------------------------- */
const Ic = {
  home: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 11.5 12 5l8 6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 10.5V19h12v-8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 19v-4h3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  tests: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12h3l2 5 4-10 2 5h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  history: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="7.3" stroke="currentColor" strokeWidth="1.7"/><path d="M12 8v4.2l2.8 1.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  keyboard: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><rect x="3" y="6.5" width="18" height="11" rx="2.2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M8 14h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>),
  mic: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><rect x="9" y="3.5" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>),
  eye: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="1.6"/></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  arrow: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  spark: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
  shield: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3.5 5.5 6v5.5c0 4 2.8 7 6.5 8.5 3.7-1.5 6.5-4.5 6.5-8.5V6L12 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  doc: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20V4a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M13.5 3.5V8h4M9.5 13h5M9.5 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
  bell: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5h-14S6.5 14 6.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
  flame: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3.5c1 3-1.5 4-1.5 6.5 0 1 .8 1.8 1.5 1.8.9 0 1.4-.7 1.3-1.6 1.4 1 2.2 2.6 2.2 4.3a5.5 5.5 0 0 1-11 0c0-2.4 1.4-3.8 2.2-4.8C8 11.5 9.5 9 8.7 6.5 10.6 7 11.6 5.2 12 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>),
  back: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  x: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>),
  caret: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  leaf: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 19c0-7 5-12 14-13 .5 7-3 14-11 14a6 6 0 0 1-3-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 16c3-3 6-5 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
  sun: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>),
  quiet: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M16 9.8a3.2 3.2 0 0 1 0 4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M21 6 16.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
};

/* Baseline brand mark — a sprig rising from a baseline */
function Mark({ size = 30, r = 9 }) {
  return (
    <span className="mark" style={{ width: size, height: size, borderRadius: r }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path d="M4 18h16" stroke="#FBF3E6" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 18c0-4 0-7 0-9" stroke="#FBF3E6" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 11c-2.6.2-4.2-1.1-4.6-3.4 2.5-.3 4.1.8 4.6 3.4Z" fill="#FBF3E6"/>
        <path d="M12 9c1.9-1.6 3.9-1.7 5.7-.5-1.3 2-3.2 2.5-5.7.5Z" fill="#FBF3E6"/>
      </svg>
    </span>
  );
}

/* ------------------------- side-panel frame ------------------------- */
function Panel({ children, nav = null, tall = true }) {
  return (
    <div className={"panel" + (tall ? " tall" : "")}>
      <div className="sp-bar">
        <div className="sp-bar-l">
          <Mark size={20} r={6} />
          <span className="sp-name">Baseline</span>
          <span className="sp-caret"><Ic.caret width={15} height={15} /></span>
        </div>
        <span className="sp-x"><Ic.x width={15} height={15} /></span>
      </div>
      <div className="app">{children}{nav}</div>
    </div>
  );
}

function Nav({ active }) {
  const items = [
    { k: "home", label: "Home", Icon: Ic.home },
    { k: "tests", label: "Today", Icon: Ic.tests },
    { k: "history", label: "History", Icon: Ic.history },
  ];
  return (
    <div className="nav">
      {items.map(({ k, label, Icon }) => (
        <div key={k} className={"nav-item" + (k === active ? " on" : "")}>
          <Icon /><span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const map = { stable: ["st-stable", "Stable"], monitor: ["st-monitor", "Monitor"], flag: ["st-flag", "Discuss with GP"] };
  const [cls, label] = map[status] || map.stable;
  return (<span className={"pill " + cls}><span className="dot" />{label}</span>);
}

/* a single screen body wrapper */
function Body({ children, center = false, style }) {
  return <div className={"app-scroll" + (center ? " center" : "")} style={style}>{children}</div>;
}

/* labelled gallery item */
function Frame({ title, desc, children }) {
  return (
    <div className="panel-frame">
      <Panel>{children}</Panel>
      {(title || desc) && (
        <div className="cap">
          {title && <div className="cap-t">{title}</div>}
          {desc && <div className="cap-d">{desc}</div>}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { React, useState, Ic, Mark, Panel, Nav, StatusPill, Body, Frame });

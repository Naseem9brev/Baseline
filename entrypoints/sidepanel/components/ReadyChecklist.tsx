import { Ic } from './icons';

// Calm-down reminder shown on Today before a check-in: be in a quiet, well-lit spot.
// The list animates in with a staggered check; respects prefers-reduced-motion (CSS).
const ITEMS: { icon: keyof typeof Ic; title: string; hint: string }[] = [
  { icon: 'quiet', title: 'Find a calm, quiet spot', hint: 'Sit still and breathe — accuracy improves when you’re relaxed.' },
  { icon: 'sun', title: 'Good, even lighting', hint: 'Face a window or lamp so the camera can see you clearly.' },
];

export default function ReadyChecklist() {
  return (
    <div className="card ready-anim">
      <p className="eyebrow">Before you start</p>
      <div className="mt-3 space-y-3">
        {ITEMS.map(({ icon, title, hint }, i) => {
          const Icon = Ic[icon];
          return (
            <div
              key={icon}
              className="ready-item"
              style={{ animationDelay: `${0.08 + i * 0.18}s` }}
            >
              <span className="ready-ico">
                <Icon width={19} height={19} />
              </span>
              <span style={{ flex: 1 }}>
                <span className="serif-h block" style={{ fontSize: 14.5 }}>
                  {title}
                </span>
                <span className="muted block" style={{ fontSize: 12, lineHeight: 1.45 }}>
                  {hint}
                </span>
              </span>
              <span
                className="ready-check"
                style={{ animationDelay: `${0.34 + i * 0.18}s` }}
                aria-hidden
              >
                <Ic.check width={14} height={14} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

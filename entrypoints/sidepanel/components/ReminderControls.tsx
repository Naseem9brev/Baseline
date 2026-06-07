import { Ic } from './icons';

// 0–23 → "9:00 AM" / "2:00 PM" for the hour picker.
export function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00 ${period}`;
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export default function ReminderControls({
  enabled,
  hour,
  onChange,
}: {
  enabled: boolean;
  hour: number;
  onChange: (next: { enabled: boolean; hour: number }) => void;
}) {
  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange({ enabled: !enabled, hour })}
        className="reminder-toggle"
      >
        <span className="reminder-toggle-label">
          <span
            className="grid place-items-center rounded-lg"
            style={{ width: 32, height: 32, background: 'var(--ginseng-wash)', color: 'var(--ginseng-deep)', flex: '0 0 auto' }}
          >
            <Ic.bell width={18} height={18} />
          </span>
          <span>
            <span className="block" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
              Daily reminder
            </span>
            <span className="muted block" style={{ fontSize: 12 }}>
              {enabled ? `A nudge at ${formatHour(hour)}` : 'Off'}
            </span>
          </span>
        </span>
        <span className={'switch' + (enabled ? ' on' : '')} aria-hidden>
          <span className="switch-knob" />
        </span>
      </button>

      {enabled ? (
        <label className="mt-3 block">
          <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>
            Remind me at
          </span>
          <select
            className="input mt-1"
            style={{ fontSize: 14 }}
            value={hour}
            onChange={(e) => onChange({ enabled, hour: Number(e.target.value) })}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

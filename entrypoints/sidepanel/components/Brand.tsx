// Baseline brand mark — a saffron sprig rising from a baseline (the "Baseline" pun),
// on a rounded saffron tile. Ported from design/baseline-ui/frame.jsx `Mark`.
export default function Brand({ size = 30, radius = 9 }: { size?: number; radius?: number }) {
  return (
    <span className="mark" style={{ width: size, height: size, borderRadius: radius }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path d="M4 18h16" stroke="#FBF3E6" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18c0-4 0-7 0-9" stroke="#FBF3E6" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 11c-2.6.2-4.2-1.1-4.6-3.4 2.5-.3 4.1.8 4.6 3.4Z" fill="#FBF3E6" />
        <path d="M12 9c1.9-1.6 3.9-1.7 5.7-.5-1.3 2-3.2 2.5-5.7.5Z" fill="#FBF3E6" />
      </svg>
    </span>
  );
}

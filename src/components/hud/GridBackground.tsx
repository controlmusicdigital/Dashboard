const ORBS = [
  { top: "8%", left: "12%", size: 220, color: "var(--accent-cyan)", delay: "0s" },
  { top: "62%", left: "78%", size: 260, color: "var(--accent-magenta)", delay: "-4s" },
  { top: "38%", left: "58%", size: 180, color: "var(--accent-blue-dr)", delay: "-8s" },
];

export function GridBackground() {
  return (
    <div className="hud-grid-bg" aria-hidden>
      {ORBS.map((orb, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: orb.top,
            left: orb.left,
            width: orb.size,
            height: orb.size,
            borderRadius: "9999px",
            background: `radial-gradient(circle, ${orb.color}33, transparent 70%)`,
            filter: "blur(20px)",
            animation: `orb-drift ${10 + i * 2}s ease-in-out infinite`,
            animationDelay: orb.delay,
          }}
        />
      ))}
    </div>
  );
}

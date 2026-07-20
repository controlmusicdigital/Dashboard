const GRADIENTS: [string, string][] = [
  ["#3987e5", "#1c1c21"],
  ["#008300", "#1c1c21"],
  ["#d55181", "#1c1c21"],
  ["#c98500", "#1c1c21"],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// No real photo is fetched for these headlines — this renders a deterministic
// illustrative thumbnail per article so the feed doesn't read as a bare text list.
export function newsThumbnail(seed: string): string {
  const [from, to] = GRADIENTS[hash(seed) % GRADIENTS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/>
        <stop offset="1" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="220" fill="url(#g)"/>
    <g opacity="0.55" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round">
      <path d="M120 150 Q140 90 170 150 Q200 60 230 150 Q260 100 290 150"/>
    </g>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

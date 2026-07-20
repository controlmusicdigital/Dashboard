const GRADIENTS: [string, string][] = [
  ["#FF0000", "#1c1c21"],
  ["#3987e5", "#1c1c21"],
  ["#008300", "#1c1c21"],
  ["#c98500", "#1c1c21"],
  ["#d55181", "#1c1c21"],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// No real thumbnail is fetched from YouTube — this renders a deterministic
// placeholder per video so the dashboard doesn't read as a bare list of rows.
export function youtubeThumbnail(seed: string): string {
  const [from, to] = GRADIENTS[hash(seed) % GRADIENTS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/>
        <stop offset="1" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="320" height="180" fill="url(#g)"/>
    <circle cx="160" cy="90" r="30" fill="rgba(0,0,0,0.45)"/>
    <path d="M150 74 L182 90 L150 106 Z" fill="#ffffff"/>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

const GRADIENTS: [string, string][] = [
  ["#25F4EE", "#1c1c21"],
  ["#FE2C55", "#1c1c21"],
  ["#00f2ea", "#1c1c21"],
  ["#161823", "#1c1c21"],
  ["#69C9D0", "#1c1c21"],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// No real image is fetched from TikTok — this renders a deterministic vertical placeholder per
// video so the mock grid doesn't read as a bare list of rows.
export function tiktokThumbnail(seed: string): string {
  const [from, to] = GRADIENTS[hash(seed) % GRADIENTS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 320">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/>
        <stop offset="1" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="180" height="320" fill="url(#g)"/>
    <circle cx="90" cy="160" r="32" fill="rgba(0,0,0,0.45)"/>
    <path d="M80 144 L112 160 L80 176 Z" fill="#ffffff"/>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

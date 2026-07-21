const GRADIENTS: [string, string][] = [
  ["#E1306C", "#1c1c21"],
  ["#F77737", "#1c1c21"],
  ["#833AB4", "#1c1c21"],
  ["#C13584", "#1c1c21"],
  ["#5851DB", "#1c1c21"],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// No real image is fetched from Instagram — this renders a deterministic square placeholder
// per post so the mock grid doesn't read as a bare list of rows.
export function instagramThumbnail(seed: string): string {
  const [from, to] = GRADIENTS[hash(seed) % GRADIENTS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/>
        <stop offset="1" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="320" height="320" fill="url(#g)"/>
    <rect x="110" y="110" width="100" height="100" rx="22" fill="none" stroke="#ffffff" stroke-width="8" opacity="0.85"/>
    <circle cx="160" cy="160" r="26" fill="none" stroke="#ffffff" stroke-width="8" opacity="0.85"/>
    <circle cx="192" cy="128" r="6" fill="#ffffff" opacity="0.85"/>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

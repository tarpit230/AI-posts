type InstagramImageInput = {
  topic: string;
  content: string;
  imagePrompt?: string;
  niche?: string;
  tone?: string;
  goal?: string;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickPalette(seed: string) {
  const palettes = [
    ["#0f172a", "#1d4ed8", "#22d3ee"],
    ["#111827", "#7c3aed", "#ec4899"],
    ["#0f172a", "#16a34a", "#84cc16"],
    ["#111827", "#ea580c", "#f97316"],
    ["#111827", "#2563eb", "#0ea5e9"]
  ];
  return palettes[hashString(seed) % palettes.length];
}

function wrapText(text: string, maxChars: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxChars && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      continue;
    }
    currentLine = nextLine;
  }

  if (currentLine) lines.push(currentLine);
  if (lines.length > maxLines) {
    const clipped = lines.slice(0, maxLines);
    clipped[maxLines - 1] = `${clipped[maxLines - 1].replace(/[.,;:!?-]+$/, "")}...`;
    return clipped;
  }
  return lines;
}

function renderTextLines(lines: string[], x: number, y: number, lineHeight: number, fontSize: number, fill: string) {
  return lines
    .map((line, index) => {
      const offset = index * lineHeight;
      const safeLine = escapeXml(line);
      return `<text x="${x}" y="${y + offset}" fill="${fill}" font-size="${fontSize}" font-weight="700" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${safeLine}</text>`;
    })
    .join("");
}

export function createInstagramImageAsset(input: InstagramImageInput) {
  const headlineSource = input.content.split("\n").find(Boolean) || input.topic;
  const supportingSource = input.imagePrompt?.trim() || input.niche || input.goal || input.tone || input.topic;
  const headlineLines = wrapText(headlineSource, 24, 3);
  const supportingLines = wrapText(supportingSource, 36, 4);
  const palette = pickPalette(`${input.topic}-${input.content}`);
  const imageAlt = `${input.topic} Instagram image post`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="${escapeXml(imageAlt)}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${palette[0]}" />
          <stop offset="50%" stop-color="${palette[1]}" />
          <stop offset="100%" stop-color="${palette[2]}" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="24" stdDeviation="36" flood-color="#020617" flood-opacity="0.35" />
        </filter>
      </defs>
      <rect width="1080" height="1080" rx="72" fill="url(#bg)" />
      <circle cx="180" cy="160" r="160" fill="#ffffff" fill-opacity="0.10" />
      <circle cx="900" cy="220" r="120" fill="#ffffff" fill-opacity="0.08" />
      <circle cx="860" cy="900" r="180" fill="#ffffff" fill-opacity="0.06" />
      <rect x="86" y="94" width="908" height="892" rx="56" fill="#0f172a" fill-opacity="0.28" stroke="#ffffff" stroke-opacity="0.16" />
      <rect x="130" y="140" width="180" height="54" rx="27" fill="#ffffff" fill-opacity="0.16" />
      <text x="220" y="175" text-anchor="middle" fill="#ffffff" font-size="22" font-weight="700" font-family="Inter, ui-sans-serif, system-ui, sans-serif">INSTAGRAM POST</text>
      <g filter="url(#shadow)">
        <rect x="128" y="240" width="824" height="520" rx="42" fill="#ffffff" fill-opacity="0.92" />
      </g>
      <text x="180" y="320" fill="#0f172a" font-size="28" font-weight="700" font-family="Inter, ui-sans-serif, system-ui, sans-serif">FROM THE FEED</text>
      ${renderTextLines(headlineLines, 180, 410, 68, 52, "#020617")}
      ${renderTextLines(supportingLines, 180, 600, 42, 30, "#334155")}
      <rect x="180" y="690" width="240" height="62" rx="31" fill="${palette[1]}" />
      <text x="300" y="729" text-anchor="middle" fill="#ffffff" font-size="24" font-weight="700" font-family="Inter, ui-sans-serif, system-ui, sans-serif">SAVE THIS POST</text>
      <text x="140" y="895" fill="#ffffff" fill-opacity="0.92" font-size="26" font-weight="600" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${escapeXml(input.goal ?? "Engagement")}</text>
      <text x="140" y="935" fill="#ffffff" fill-opacity="0.72" font-size="22" font-weight="500" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${escapeXml(input.niche ?? input.tone ?? "Made for your audience")}</text>
      <rect x="792" y="862" width="148" height="148" rx="36" fill="#ffffff" fill-opacity="0.12" stroke="#ffffff" stroke-opacity="0.18" />
      <circle cx="866" cy="936" r="38" fill="#ffffff" fill-opacity="0.84" />
      <path d="M845 936 L858 923 L873 938 L891 917" fill="none" stroke="${palette[1]}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `.trim();

  return {
    imageAsset: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    imageAlt
  };
}

const PARTY_COLOR_MAP: Record<string, string> = {
  DMK: '#00A651',
  ADMK: '#FF9933',
  BJP: '#FF0000',
  INC: '#00B0F0',
  OTHERS: '#6B7280',
};

const PARTY_ALIASES: Record<string, string> = {
  AIADMK: 'ADMK',
  AIDMK: 'ADMK',
  ADMK: 'ADMK',
};

export const normalizePartyName = (party: string) => {
  const normalized = party.trim().toUpperCase();
  return PARTY_ALIASES[normalized] ?? normalized;
};

export const getPartyColor = (party: string) => {
  const normalized = normalizePartyName(party);
  return PARTY_COLOR_MAP[normalized] ?? PARTY_COLOR_MAP.OTHERS;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string) => {
  const value = hex.replace('#', '');
  const normalized = value.length === 3
    ? value.split('').map((char) => `${char}${char}`).join('')
    : value;

  const num = Number.parseInt(normalized, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((component) => clamp(Math.round(component), 0, 255).toString(16).padStart(2, '0')).join('')}`;

const mixWithWhite = (hex: string, amount: number) => {
  const { r, g, b } = hexToRgb(hex);
  const ratio = clamp(amount, 0, 1);
  return rgbToHex(
    r + (255 - r) * ratio,
    g + (255 - g) * ratio,
    b + (255 - b) * ratio,
  );
};

export const getMarginBand = (marginPercentage: number) => {
  if (marginPercentage >= 20) return 'safe';
  if (marginPercentage <= 5) return 'swing';
  return 'lean';
};

export const getPartyColorByMargin = (party: string, marginPercentage: number) => {
  const base = getPartyColor(party);
  const normalizedMargin = clamp((marginPercentage - 5) / 15, 0, 1);
  const lightening = 0.6 * (1 - normalizedMargin);
  return mixWithWhite(base, lightening);
};

export const getLegendEntries = () => [
  { party: 'DMK', color: PARTY_COLOR_MAP.DMK },
  { party: 'ADMK', color: PARTY_COLOR_MAP.ADMK },
  { party: 'BJP', color: PARTY_COLOR_MAP.BJP },
  { party: 'INC', color: PARTY_COLOR_MAP.INC },
  { party: 'Others', color: PARTY_COLOR_MAP.OTHERS },
];

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

export const getLegendEntries = () => [
  { party: 'DMK', color: PARTY_COLOR_MAP.DMK },
  { party: 'ADMK', color: PARTY_COLOR_MAP.ADMK },
  { party: 'BJP', color: PARTY_COLOR_MAP.BJP },
  { party: 'INC', color: PARTY_COLOR_MAP.INC },
  { party: 'Others', color: PARTY_COLOR_MAP.OTHERS },
];

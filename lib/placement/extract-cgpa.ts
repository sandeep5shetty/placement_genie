const CGPA_PATTERNS = [
  /(?:c\.?g\.?\s*p\.?\s*a\.?|s\.?g\.?\s*p\.?\s*a\.?|g\.?\s*p\.?\s*a\.?)\s*(?:of|:|-|is|=)?\s*(\d(?:\.\d{1,2})?)\s*(?:\/\s*(?:10|4(?:\.0)?))?/gi,
  /(\d(?:\.\d{1,2})?)\s*\/\s*10/gi,
  /(\d(?:\.\d{1,2})?)\s*(?:c\.?g\.?\s*p\.?\s*a\.?|s\.?g\.?\s*p\.?\s*a\.?)/gi,
];

function normalizeCgpa(raw: string) {
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) {
    return;
  }
  if (value >= 5 && value <= 10) {
    return raw;
  }
  if (value > 0 && value <= 4) {
    return `${raw}/4`;
  }
}

export function extractCgpaFromText(text: string) {
  for (const pattern of CGPA_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (!match?.[1]) {
      continue;
    }
    const normalized = normalizeCgpa(match[1]);
    if (normalized) {
      return normalized;
    }
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .trim();
}

export function detectWords(
  utterance: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
): string[] {
  const normalized = normalizeText(utterance);
  const detected: string[] = [];

  for (const word of cardWords) {
    if (alreadyFilled.has(word.toLowerCase())) continue;
    const nw = normalizeText(word);
    const pattern = new RegExp(`\\b${escapeRegex(nw)}\\b`, 'i');
    if (pattern.test(normalized)) {
      detected.push(word);
    }
  }

  return detected;
}

// 'interface' is intentionally omitted — too common in ordinary speech, causes false positives
export const WORD_ALIASES: Record<string, string[]> = {
  'ci/cd': ['ci cd', 'cicd'],
  'mvp': ['minimum viable product'],
  'roi': ['return on investment'],
  'api': ['a p i'],
  'devops': ['dev ops'],
};

export function detectWordsWithAliases(
  utterance: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
): string[] {
  const detected = detectWords(utterance, cardWords, alreadyFilled);
  const detectedSet = new Set(detected.map(w => w.toLowerCase()));
  const normalized = normalizeText(utterance);

  for (const word of cardWords) {
    if (alreadyFilled.has(word.toLowerCase())) continue;
    if (detectedSet.has(word.toLowerCase())) continue;

    const aliases = WORD_ALIASES[word.toLowerCase()];
    if (aliases) {
      for (const alias of aliases) {
        const pattern = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
        if (pattern.test(normalized)) {
          detected.push(word);
          break;
        }
      }
    }
  }

  return detected;
}

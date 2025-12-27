import type { Card, Conjugations, ConjugationGroup, WordType } from '../flashcard-types';
import { uid } from './storage';
import wordsCSV from '../data/words.csv?raw';

const parseConjugationGroup = (value?: string): ConjugationGroup | undefined => {
  if (!value || !value.trim()) return undefined;

  const parts = value.split('|').map((p) => p.trim());
  if (parts.length !== 6) return undefined;

  return {
    eu: parts[0],
    tu: parts[1],
    eleElaVoce: parts[2],
    nos: parts[3],
    vos: parts[4],
    elesElasVoces: parts[5],
  };
};

export function loadSampleWords(): Card[] {
  const lines = wordsCSV.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Skip header line
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    const cols = line.split(',').map((s) => s.trim());

    const front = cols[0];
    const back = cols[1];
    const type = (cols[2] ?? 'other') as WordType;
    const enEx = cols[3];
    const ptEx = cols[4];

    const conjugations: Conjugations = {};

    const present = parseConjugationGroup(cols[5]);
    if (present) conjugations.present = present;

    const perfeito = parseConjugationGroup(cols[6]);
    const imperfeito = parseConjugationGroup(cols[7]);
    if (perfeito || imperfeito) {
      conjugations.past = {};
      if (perfeito) conjugations.past.perfeito = perfeito;
      if (imperfeito) conjugations.past.imperfeito = imperfeito;
    }

    const future = parseConjugationGroup(cols[8]);
    if (future) conjugations.future = future;

    const hasConjugations =
      conjugations.present ||
      conjugations.future ||
      (conjugations.past &&
        (conjugations.past.perfeito || conjugations.past.imperfeito));

    return {
      id: uid(),
      front,
      back,
      type,
      examples: enEx && ptEx ? [{ en: enEx, pt: ptEx }] : undefined,
      conjugations: hasConjugations ? conjugations : undefined,
      createdAt: Date.now(),
    } as Card;
  }).filter((card) => !!card.front && !!card.back);
}

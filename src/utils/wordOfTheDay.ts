import type { Card } from '../flashcard-types';

/**
 * Picks one word to feature for the current calendar day, chosen from the
 * user's own cards — no network, no dictionary API, no licensing concerns.
 * Deterministic per day: everyone sees the same word all day and it rotates at
 * midnight. Sorted by id first so the choice is stable regardless of the deck's
 * current display order.
 */
export function getWordOfTheDay(cards: Card[]): Card | null {
  if (!cards.length) return null;

  const sorted = [...cards].sort((a, b) => a.id.localeCompare(b.id));

  const now = new Date();
  const dayNumber = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000
  );

  return sorted[dayNumber % sorted.length];
}

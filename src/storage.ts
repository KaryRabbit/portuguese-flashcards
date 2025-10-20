import type { Card } from './types';
const KEY = 'react-flashcards-v1';
export const loadCards = (): Card[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Card[]) : [];
  } catch {
    return [];
  }
};
export const saveCards = (cards: Card[]) => {
  localStorage.setItem(KEY, JSON.stringify(cards));
};

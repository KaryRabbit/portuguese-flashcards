import { useCallback, useEffect, useState } from 'react';
import type { Card } from '../flashcard-types';
import { load, SESSION_KEY, SELECTED_KEY, shuffle } from '../utils/storage';

export function useSession(cards: Card[], hasImported: boolean) {
  const [session, setSession] = useState<Card[]>([]);
  const [sessionId, setSessionId] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  // Reset showBack whenever card index changes
  useEffect(() => {
    setShowBack(false);
  }, [idx]);

  // Save session to localStorage
  useEffect(() => {
    if (isSessionRestored) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }, [session, isSessionRestored]);

  // Save selected IDs to localStorage
  useEffect(() => {
    if (isSessionRestored) {
      localStorage.setItem(SELECTED_KEY, JSON.stringify([...selectedIds]));
    }
  }, [selectedIds, isSessionRestored]);

  // Restore session on mount
  useEffect(() => {
    if (hasImported) {
      return;
    }

    try {
      const rawIds = localStorage.getItem(SELECTED_KEY);
      const rawSession = localStorage.getItem(SESSION_KEY);

      const savedIds: string[] = rawIds ? JSON.parse(rawIds) : [];
      const savedSession: Card[] = rawSession ? JSON.parse(rawSession) : [];

      // Try restoring saved session first
      if (Array.isArray(savedSession) && savedSession.length > 0) {
        const allCards = load();
        const restored = savedSession
          .map((s) => allCards.find((c) => c.id === s.id))
          .filter((c): c is Card => !!c);
        if (restored.length > 0) {
          setSession(restored);
          setSelectedIds(new Set(restored.map((c) => c.id)));
          setIsSessionRestored(true);
          return;
        }
      }

      // Fallback to saved selected IDs
      if (Array.isArray(savedIds) && savedIds.length > 0) {
        const valid = load().filter((c) => savedIds.includes(c.id));
        if (valid.length > 0) {
          setSession(valid);
          setSelectedIds(new Set(valid.map((c) => c.id)));
          setIsSessionRestored(true);
          return;
        }
      }

      // Otherwise clear
      setSession([]);
      setSelectedIds(new Set());
    } catch (err) {
      console.warn('Session restore failed', err);
      setSession([]);
    } finally {
      setIsSessionRestored(true);
    }

    setIdx(0);
    setShowBack(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up selected IDs when cards change
  useEffect(() => {
    setSelectedIds(
      (prev) =>
        new Set([...prev].filter((id) => cards.some((c) => c.id === id)))
    );
  }, [cards]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    setSession((prevSession) => {
      const card = cards.find((c) => c.id === id);
      if (!card) return prevSession;

      const exists = prevSession.some((c) => c.id === id);
      if (exists) {
        return prevSession.filter((c) => c.id !== id);
      } else {
        return [...prevSession, card];
      }
    });
  }, [cards]);

  const regenerateSession = useCallback((preserveSelection = true) => {
    const useSelected = selectedIds.size > 0;
    const base = useSelected
      ? cards.filter((c) => selectedIds.has(c.id))
      : cards;

    setSession(shuffle(base));
    if (!preserveSelection && base.length) {
      setSelectedIds(new Set(base.map((c) => c.id)));
    }
    setIdx(0);
    setShowBack(false);
    setSessionId((s) => s + 1);
  }, [cards, selectedIds]);

  const clearSession = useCallback(() => {
    setSelectedIds(new Set());
    setSession([]);
    setIdx(0);
    setShowBack(false);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SELECTED_KEY);
  }, []);

  const next = useCallback(() => {
    setIdx((i) => Math.min(i + 1, Math.max(session.length - 1, 0)));
  }, [session.length]);

  const prev = useCallback(() => {
    setIdx((i) => Math.max(i - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setIdx(0);
    setShowBack(false);
  }, []);

  const active = session[idx] ?? null;

  return {
    session,
    sessionId,
    selectedIds,
    setSelectedIds,
    idx,
    showBack,
    setShowBack,
    active,
    toggleSelect,
    regenerateSession,
    clearSession,
    next,
    prev,
    reset,
    setSession,
  };
}

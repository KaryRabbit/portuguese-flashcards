import { useCallback, useEffect, useState } from 'react';
import type { Card, StudyGroup } from '../flashcard-types';
import { loadGroups, saveGroups, uid } from '../utils/storage';

export function useStudyGroups(cards: Card[]) {
  const [groups, setGroups] = useState<StudyGroup[]>(() => loadGroups());

  useEffect(() => {
    const validIds = new Set(cards.map((card) => card.id));

    setGroups((prev) => {
      const cleaned = prev
        .map((group) => ({
          ...group,
          cardIds: group.cardIds.filter((id) => validIds.has(id)),
        }))
        .filter((group) => group.cardIds.length > 0);

      if (JSON.stringify(cleaned) !== JSON.stringify(prev)) {
        saveGroups(cleaned);
      }

      return cleaned;
    });
  }, [cards]);

  const createGroup = useCallback((name: string, cardIds: string[]) => {
    const trimmedName = name.trim();
    const uniqueCardIds = [...new Set(cardIds)];

    if (!trimmedName || uniqueCardIds.length === 0) {
      return { ok: false as const, reason: 'invalid' as const };
    }

    const group: StudyGroup = {
      id: uid(),
      name: trimmedName,
      cardIds: uniqueCardIds,
      createdAt: Date.now(),
    };

    setGroups((prev) => {
      const next = [group, ...prev];
      saveGroups(next);
      return next;
    });

    return { ok: true as const, group };
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setGroups((prev) => {
      const next = prev.filter((group) => group.id !== groupId);
      saveGroups(next);
      return next;
    });
  }, []);

  return {
    groups,
    createGroup,
    deleteGroup,
  };
}

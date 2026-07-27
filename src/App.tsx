import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AddWordSheet } from './components/AddWordSheet';
import { ConjugationGuide } from './components/ConjugationGuide';
import { ManageMode } from './components/ManageMode';
import { StudyMode } from './components/StudyMode';
import { WordOfTheDay } from './components/WordOfTheDay';
import type { Card } from './flashcard-types';
import { getWordOfTheDay } from './utils/wordOfTheDay';
import { useFlashcards } from './hooks/useFlashcards';
import { useKnownCards } from './hooks/useKnownCards';
import { useSession } from './hooks/useSession';
import { useStudyGroups } from './hooks/useStudyGroups';
import { GROUPS_KEY, KEY, KNOWN_KEY, shuffle } from './utils/storage';

// A fresh auto-started or "Start studying" session uses a bite-sized slice,
// matching the app's existing batch philosophy (default batch size is 20).
const DEFAULT_SESSION_SIZE = 20;

export function App() {
  const [mode, setMode] = useState<'study' | 'manage' | 'conjugations'>(
    'study'
  );
  const [direction, setDirection] = useState<'en-pt' | 'pt-en'>('en-pt');
  const [hasImported, setHasImported] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const { cards, addCard, removeCard, importCards, clearAll } = useFlashcards();
  const { groups, createGroup, deleteGroup } = useStudyGroups(cards);
  const { knownIds, markKnown, markLearning } = useKnownCards();

  const {
    session,
    sessionId,
    isSessionRestored,
    selectedIds,
    setSelectedIds,
    toggleSelect,
    regenerateSession,
    startSession,
    clearSession,
    removeFromSession,
    setSession,
  } = useSession(cards, hasImported);

  // Build a fresh, shuffled, bite-sized session from the cards the user is
  // still learning (falling back to all cards if everything is known).
  const startDefaultSession = useCallback(() => {
    if (cards.length === 0) return;
    const learning = cards.filter((c) => !knownIds.has(c.id));
    const base = learning.length > 0 ? learning : cards;
    const ids = shuffle(base)
      .slice(0, DEFAULT_SESSION_SIZE)
      .map((c) => c.id);
    startSession(ids, false);
    setMode('study');
  }, [cards, knownIds, startSession]);

  // Instant study on open: once cards are ready and the saved session (if any)
  // has been restored, auto-start a default session so Study is usable
  // immediately. Runs at most once per app load so it never interrupts the user
  // mid-session or after they intentionally stop.
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (bootstrappedRef.current) return;
    if (!isSessionRestored) return;
    if (cards.length === 0) return;
    bootstrappedRef.current = true;
    if (session.length > 0) return; // a saved session was restored
    startDefaultSession();
  }, [isSessionRestored, cards.length, session.length, startDefaultSession]);

  const wordOfTheDay = getWordOfTheDay(cards);

  const handleMarkKnown = (id: string) => {
    markKnown(id);
    removeFromSession(id);
  };

  const handleMarkLearning = (id: string) => {
    markLearning(id);
  };

  const handleRemove = (id: string) => {
    removeCard(id);
    removeFromSession(id);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === cards.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cards.map((c) => c.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setSession([]);
  };

  const handleImportCards = (newCards: Card[]) => {
    importCards(newCards);
    setSelectedIds(new Set());
    setSession([]);
    localStorage.removeItem('flashcards-session-v1');
    localStorage.removeItem('flashcards-selected-v1');
  };

  const handleSaveGroup = (name: string) => {
    const ids = [...selectedIds];
    const result = createGroup(name, ids);

    if (!result.ok) {
      alert('Select at least one card and add a study set name.');
      return false;
    }

    return true;
  };

  const handleLoadGroup = (groupId: string, studyNow = false) => {
    const group = groups.find((item) => item.id === groupId);
    if (!group) return;

    startSession(group.cardIds, false);

    if (studyNow) {
      setMode('study');
    } else {
      setMode('manage');
    }
  };

  const exportCardsCSV = (cardsToExport: Card[], filename: string) => {
    if (cardsToExport.length === 0) {
      alert('No cards to export.');
      return;
    }

    const rows = cardsToExport.map((c) => {
      const ex = c.examples?.[0];

      const present = c.conjugations?.present
        ? [
            c.conjugations.present.eu,
            c.conjugations.present.tu,
            c.conjugations.present.eleElaVoce,
            c.conjugations.present.nos,
            c.conjugations.present.vos,
            c.conjugations.present.elesElasVoces,
          ].join('|')
        : '';

      const perfeito = c.conjugations?.past?.perfeito
        ? [
            c.conjugations.past.perfeito.eu,
            c.conjugations.past.perfeito.tu,
            c.conjugations.past.perfeito.eleElaVoce,
            c.conjugations.past.perfeito.nos,
            c.conjugations.past.perfeito.vos,
            c.conjugations.past.perfeito.elesElasVoces,
          ].join('|')
        : '';

      const imperfeito = c.conjugations?.past?.imperfeito
        ? [
            c.conjugations.past.imperfeito.eu,
            c.conjugations.past.imperfeito.tu,
            c.conjugations.past.imperfeito.eleElaVoce,
            c.conjugations.past.imperfeito.nos,
            c.conjugations.past.imperfeito.vos,
            c.conjugations.past.imperfeito.elesElasVoces,
          ].join('|')
        : '';

      const future = c.conjugations?.future
        ? [
            c.conjugations.future.eu,
            c.conjugations.future.tu,
            c.conjugations.future.eleElaVoce,
            c.conjugations.future.nos,
            c.conjugations.future.vos,
            c.conjugations.future.elesElasVoces,
          ].join('|')
        : '';

      return [
        c.front ?? '',
        c.back ?? '',
        c.type ?? '',
        ex?.en ?? '',
        ex?.pt ?? '',
        present,
        perfeito,
        imperfeito,
        future,
      ].join(',');
    });

    const blob = new Blob([rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    exportCardsCSV(cards, 'flashcards.csv');
  };

  const exportUnknownCSV = () => {
    const unknownCards = cards.filter((c) => !knownIds.has(c.id));
    exportCardsCSV(unknownCards, 'flashcards-unknown.csv');
  };

  const handleResetAll = () => {
    if (confirm('Delete all saved cards?')) {
      localStorage.removeItem(KEY);
      localStorage.removeItem(GROUPS_KEY);
      localStorage.removeItem(KNOWN_KEY);
      localStorage.removeItem('flashcards-sort-v1');
      localStorage.removeItem('flashcards-page-size');
      clearAll();
      clearSession();
    }
  };

  const handleStop = () => {
    setMode('manage');
  };

  const isStudy = mode === 'study';
  const isManage = mode === 'manage';

  return (
    <div className="container">
      <div className="toolbar">
        <div className="toolbar-main">
          <div className="toggle-group">
            <button
              type="button"
              className={`btn ${isStudy ? 'primary' : ''}`}
              aria-pressed={isStudy}
              onClick={() => setMode('study')}
            >
              <span className="desktop-label">Study</span>
              <span className="mobile-label">Study</span>
            </button>
            <button
              type="button"
              className={`btn ${isManage ? 'primary' : ''}`}
              aria-pressed={isManage}
              onClick={() => setMode('manage')}
            >
              <span className="desktop-label">Manage</span>
              <span className="mobile-label">Manage</span>
            </button>
            <button
              type="button"
              className={`btn ${mode === 'conjugations' ? 'primary' : ''}`}
              aria-pressed={mode === 'conjugations'}
              onClick={() => setMode('conjugations')}
            >
              <span className="desktop-label">Conjugations</span>
              <span className="mobile-label">Verbs</span>
            </button>
          </div>
          <button
            type="button"
            color="warn"
            className="btn warn"
            onClick={handleResetAll}
            aria-label="Reset all"
            title="Reset all"
          >
            <Trash2 size={16} />
            <span className="reset-text">Reset All</span>
          </button>
        </div>

        <div className="toolbar-meta">
          <span className="pill">
            <span className="mobile-short">
              {cards.length} ({session.length})
            </span>
            <span className="desktop-long">
              Cards: {cards.length} ({session.length} in session)
            </span>
          </span>

          {isStudy ? (
            <div className="direction-wrap">
              <label className="muted mobile-hidden">Mode:</label>
              <select
                value={direction}
                onChange={(e) => {
                  setDirection(e.target.value as 'en-pt' | 'pt-en');
                }}
                className="input"
              >
                <option value="en-pt">EN → PT</option>
                <option value="pt-en">PT → EN</option>
              </select>
            </div>
          ) : null}
        </div>
      </div>

      <style>{`
        .mobile-short {
          display: inline;
        }
        .desktop-long {
          display: none;
        }
        .mobile-hidden {
          display: none;
        }
        .reset-text {
          display: none;
        }

        @media (min-width: 500px) {
          .reset-text {
            display: inline;
          }
        }

        @media (min-width: 768px) {
          .mobile-short {
            display: none;
          }
          .desktop-long {
            display: inline;
          }
          .mobile-hidden {
            display: inline;
          }
        }
      `}</style>

      {mode === 'study' && <WordOfTheDay card={wordOfTheDay} />}

      {mode === 'study' && (
        <StudyMode
          session={session}
          sessionId={sessionId}
          direction={direction}
          selectedIds={selectedIds}
          knownIds={knownIds}
          onToggleSelect={toggleSelect}
          onStop={handleStop}
          onShuffle={() => regenerateSession(true, true)}
          onMarkKnown={handleMarkKnown}
          onMarkLearning={handleMarkLearning}
          cardsCount={cards.length}
          onStartDefault={startDefaultSession}
          onAddWord={() => setAddOpen(true)}
        />
      )}

      {mode === 'manage' && (
        <ManageMode
          cards={cards}
          selectedIds={selectedIds}
          knownIds={knownIds}
          groups={groups}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onRemove={handleRemove}
          onOpenAddWord={() => setAddOpen(true)}
          onImportCards={handleImportCards}
          onExportCSV={exportCSV}
          onExportUnknownCSV={exportUnknownCSV}
          onStartSession={startSession}
          onClearSelection={handleClearSelection}
          onSaveGroup={handleSaveGroup}
          onLoadGroup={handleLoadGroup}
          onDeleteGroup={deleteGroup}
          setHasImported={setHasImported}
        />
      )}
      {mode === 'conjugations' && <ConjugationGuide sessionCards={session} />}

      <footer className="muted small-text" style={{ textAlign: 'center' }}>
        Made with ❤️ in React · {cards.length} cards saved
      </footer>

      {/* In study mode the feed's sticky toolbar has its own add button, and a
          fixed FAB would float over the full-width cards. */}
      {mode === 'manage' && (
        <button
          type="button"
          className="fab"
          onClick={() => setAddOpen(true)}
          aria-label="Add a word"
          title="Add a word"
        >
          <Plus size={24} />
        </button>
      )}

      <AddWordSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addCard}
      />
    </div>
  );
}

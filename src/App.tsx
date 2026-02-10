import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConjugationGuide } from './components/ConjugationGuide';
import { ManageMode } from './components/ManageMode';
import { StudyMode } from './components/StudyMode';
import type { Card } from './flashcard-types';
import { useFlashcards } from './hooks/useFlashcards';
import { useSession } from './hooks/useSession';
import { KEY } from './utils/storage';

export function App() {
  const [mode, setMode] = useState<'study' | 'manage' | 'conjugations'>(
    'study'
  );
  const [direction, setDirection] = useState<'en-pt' | 'pt-en'>('en-pt');
  const [hasImported, setHasImported] = useState(false);
  const [gotoIndex, setGotoIndex] = useState<number | null>(null);

  const { cards, addCard, removeCard, importCards, clearAll } = useFlashcards();

  const {
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
    resetProgress,
    setSession,
    goTo,
  } = useSession(cards, hasImported);

  const isActiveSelected = active ? selectedIds.has(active.id) : false;

  const handleRemove = (id: string) => {
    removeCard(id);
    setSession((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
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
    setShowBack(false);
  };

  const handleImportCards = (newCards: Card[]) => {
    importCards(newCards);
    setSelectedIds(new Set());
    setSession([]);
    localStorage.removeItem('flashcards-session-v1');
    localStorage.removeItem('flashcards-selected-v1');
  };

  const exportCSV = () => {
    if (cards.length === 0) {
      alert('No cards to export.');
      return;
    }

    const rows = cards.map((c) => {
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
    a.download = 'flashcards.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetAll = () => {
    if (confirm('Delete all saved cards?')) {
      localStorage.removeItem(KEY);
      localStorage.removeItem('flashcards-sort-v1');
      localStorage.removeItem('flashcards-page-size');
      clearAll();
      clearSession();
    }
  };

  const handleStop = () => {
    setMode('manage');
    reset();
  };

  const handleGoto = () => {
    if (gotoIndex === null) return;

    const target = Math.max(0, Math.min(gotoIndex - 1, session.length - 1));

    goTo(target);
    setGotoIndex(null);
  };

  const handlePrev = () => {
    setShowBack(false);
    prev();
  };

  const handleNext = () => {
    setShowBack(false);
    next();
  };

  const isStudy = mode === 'study';
  const isManage = mode === 'manage';

  return (
    <div className="container">
      <div
        className="toolbar"
        style={{
          gap: 8,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div className="toggle-group">
          <button
            type="button"
            className={`btn ${isStudy ? 'primary' : ''}`}
            aria-pressed={isStudy}
            onClick={() => setMode('study')}
          >
            Study
          </button>
          <button
            type="button"
            className={`btn ${isManage ? 'primary' : ''}`}
            aria-pressed={isManage}
            onClick={() => setMode('manage')}
          >
            Manage
          </button>
          <button
            type="button"
            className={`btn ${mode === 'conjugations' ? 'primary' : ''}`}
            aria-pressed={mode === 'conjugations'}
            onClick={() => setMode('conjugations')}
          >
            Conjugations
          </button>
        </div>
        <button
          type="button"
          color="warn"
          className="btn warn"
          onClick={handleResetAll}
        >
          <div className="center-alignment" style={{ gap: '0.5rem' }}>
            <Trash2 size={16} />
            <span className="reset-text">Reset All</span>
          </div>
        </button>
        <span className="pill">
          <span className="mobile-short">
            {cards.length} ({session.length})
          </span>
          <span className="desktop-long">
            Cards: {cards.length} ({session.length} in session)
          </span>
        </span>

        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <label className="muted mobile-hidden">Mode:</label>
          <select
            value={direction}
            onChange={(e) => {
              setDirection(e.target.value as 'en-pt' | 'pt-en');
              setShowBack(false);
            }}
            className="input"
            style={{ minWidth: 100, width: 'auto' }}
          >
            <option value="en-pt">EN → PT</option>
            <option value="pt-en">PT → EN</option>
          </select>
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

      {mode === 'study' && (
        <StudyMode
          active={active}
          sessionId={sessionId}
          idx={idx}
          sessionLength={session.length}
          showBack={showBack}
          direction={direction}
          isActiveSelected={isActiveSelected}
          onToggleSelect={() => active && toggleSelect(active.id)}
          onToggleBack={() => setShowBack((s) => !s)}
          onPrev={handlePrev}
          onNext={handleNext}
          onStop={handleStop}
          gotoIndex={gotoIndex}
          onInput={setGotoIndex}
          onGoto={handleGoto}
          onShuffle={() => regenerateSession(true, true)}
          onResetProgress={resetProgress}
        />
      )}

      {mode === 'manage' && (
        <ManageMode
          cards={cards}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onRemove={handleRemove}
          onAdd={addCard}
          onImportCards={handleImportCards}
          onExportCSV={exportCSV}
          onRegenerateSession={(preserveSelection) => regenerateSession(preserveSelection, false)}
          onClearSelection={handleClearSelection}
          setHasImported={setHasImported}
        />
      )}
      {mode === 'conjugations' && <ConjugationGuide sessionCards={session} />}

      <footer className="muted small-text" style={{ textAlign: 'center' }}>
        Made with ❤️ in React · {cards.length} cards saved
      </footer>
    </div>
  );
}

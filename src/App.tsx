import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ManageMode } from './components/ManageMode';
import { StudyMode } from './components/StudyMode';
import type { Card } from './flashcard-types';
import { useFlashcards } from './hooks/useFlashcards';
import { useSession } from './hooks/useSession';
import { KEY } from './utils/storage';

export function App() {
  const [mode, setMode] = useState<'study' | 'manage'>('study');
  const [direction, setDirection] = useState<'en-pt' | 'pt-en'>('en-pt');
  const [hasImported, setHasImported] = useState(false);

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
    setSession,
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
      const front = (c.front || '').replace(/,/g, '‚');
      const back = (c.back || '').replace(/,/g, '‚');
      const ex = c.examples?.[0];
      const enEx = ex?.en ? ex.en.replace(/,/g, '‚') : '';
      const ptEx = ex?.pt ? ex.pt.replace(/,/g, '‚') : '';
      const type = (c.type || '').replace(/,/g, '‚');

      return [front, back, type ?? '', enEx, ptEx].join(',');
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
            onClick={() => {
              setMode('study');
              reset();
            }}
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
        </div>
        <button
          type="button"
          color="warn"
          className="btn warn"
          onClick={handleResetAll}
        >
          <div className="center-alignment" style={{ gap: '0.5rem' }}>
            <Trash2 size={16} />
            Reset All
          </div>
        </button>
        <span className="pill">
          Cards: {cards.length} ({session.length} in session)
        </span>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <label className="muted">Mode:</label>
          <select
            value={direction}
            onChange={(e) => {
              setDirection(e.target.value as 'en-pt' | 'pt-en');
              setShowBack(false);
            }}
            className="input"
            style={{ width: 140 }}
          >
            <option value="en-pt">EN → PT</option>
            <option value="pt-en">PT → EN</option>
          </select>
        </div>
      </div>

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
          onShuffle={() => regenerateSession(true)}
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
          onRegenerateSession={regenerateSession}
          onClearSelection={handleClearSelection}
          setHasImported={setHasImported}
        />
      )}

      <footer className="muted small-text" style={{ textAlign: 'center' }}>
        Made with ❤️ in React · {cards.length} cards saved
      </footer>
    </div>
  );
}

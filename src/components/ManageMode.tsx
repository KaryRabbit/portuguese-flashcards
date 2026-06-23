import type { PaginationState } from '@tanstack/react-table';
import React, { useEffect, useRef, useState } from 'react';
import type { Card, Conjugations, StudyGroup, WordType } from '../flashcard-types';
import { BATCH_KEY, uid } from '../utils/storage';
import { loadSampleWords } from '../utils/sampleWords';
import { CardTable } from './CardTable';

type ConjugationGroup = {
  eu: string;
  tu: string;
  eleElaVoce: string;
  nos: string;
  vos: string;
  elesElasVoces: string;
};

interface ManageModeProps {
  cards: Card[];
  selectedIds: Set<string>;
  knownIds: Set<string>;
  groups: StudyGroup[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRemove: (id: string) => void;
  onAdd: (
    front: string,
    back: string,
    type: WordType,
    examples: string
  ) => void;
  onImportCards: (cards: Card[]) => void;
  onExportCSV: () => void;
  onExportUnknownCSV: () => void;
  onStartSession: (cardIds: string[], shouldShuffle: boolean) => void;
  onClearSelection: () => void;
  onSaveGroup: (name: string) => boolean;
  onLoadGroup: (groupId: string, studyNow?: boolean) => void;
  onDeleteGroup: (groupId: string) => void;
  setHasImported: (value: boolean) => void;
}

export function ManageMode({
  cards,
  selectedIds,
  knownIds,
  groups,
  onToggleSelect,
  onToggleSelectAll,
  onRemove,
  onAdd,
  onImportCards,
  onExportCSV,
  onExportUnknownCSV,
  onStartSession,
  onClearSelection,
  onSaveGroup,
  onLoadGroup,
  onDeleteGroup,
  setHasImported,
}: ManageModeProps) {
  const [en, setEn] = useState('');
  const [pt, setPt] = useState('');
  const [type, setType] = useState<WordType>('noun');
  const [examplesText, setExamplesText] = useState('');
  const [q, setQ] = useState('');
  const [filterType, setFilterType] = useState<WordType | 'all'>('all');
  const [onlySelected, setOnlySelected] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [skipKnown, setSkipKnown] = useState(true);
  const [batchSize, setBatchSize] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BATCH_KEY) || '{}');
      return saved.size || 20;
    } catch { return 20; }
  });
  const [batchIndex, setBatchIndex] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BATCH_KEY) || '{}');
      return saved.index || 0;
    } catch { return 0; }
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const PAGE_SIZE_KEY = 'flashcards-page-size';
  const ALLOWED_PAGE_SIZES = [5, 10, 20, 50] as const;

  const [pagination, setPagination] = useState<PaginationState>(() => {
    try {
      const saved = localStorage.getItem(PAGE_SIZE_KEY);
      const size = saved ? parseInt(saved, 10) : 10;
      return {
        pageIndex: 0,
        pageSize: ALLOWED_PAGE_SIZES.includes(
          size as (typeof ALLOWED_PAGE_SIZES)[number]
        )
          ? size
          : 10,
      };
    } catch {
      return { pageIndex: 0, pageSize: 10 };
    }
  });

  // Save page size whenever it changes
  useEffect(() => {
    localStorage.setItem(PAGE_SIZE_KEY, String(pagination.pageSize));
  }, [pagination.pageSize]);

  // Save batch position whenever it changes
  useEffect(() => {
    localStorage.setItem(BATCH_KEY, JSON.stringify({ size: batchSize, index: batchIndex }));
  }, [batchSize, batchIndex]);

  const norm = (s: string) => s.toLowerCase();

  const filtered = React.useMemo(() => {
    const needle = norm(q.trim());
    let base = onlySelected
      ? cards.filter((c) => selectedIds.has(c.id))
      : cards;

    if (filterType !== 'all') {
      base = base.filter((c) => c.type === filterType);
    }

    if (!needle) return base;

    return base.filter((c) => {
      if (norm(c.front).includes(needle) || norm(c.back).includes(needle))
        return true;
      return c.examples?.some(
        (ex) => norm(ex.en).includes(needle) || norm(ex.pt).includes(needle)
      );
    });
  }, [cards, onlySelected, selectedIds, q, filterType]);

  useEffect(() => {
    const maxPage = Math.max(
      0,
      Math.ceil(filtered.length / pagination.pageSize) - 1
    );
    if (pagination.pageIndex > maxPage) {
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }
  }, [filtered.length, pagination.pageSize, pagination.pageIndex]);

  const handleAdd = () => {
    const front = en.trim();
    const back = pt.trim();
    if (!front || !back) return;

    onAdd(front, back, type, examplesText);
    setEn('');
    setPt('');
    setExamplesText('');
  };

  const handleLoadSampleWords = () => {
    if (cards.length > 0) {
      const confirmed = confirm(
        'This will add 2,251 curated European Portuguese words to your collection. Continue?'
      );
      if (!confirmed) return;
    }

    setIsImporting(true);
    try {
      const sampleWords = loadSampleWords();
      onImportCards(sampleWords);
      setHasImported(true);
      alert(`Successfully loaded ${sampleWords.length} Portuguese words!`);
    } catch (err) {
      alert(`Failed to load sample words: ${(err as Error).message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const parseGroup = (value?: string): ConjugationGroup | undefined => {
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

  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Only CSV files are allowed.');
      e.target.value = '';
      return;
    }

    setIsImporting(true);

    try {
      const text = await file.text();

      const newCards: Card[] = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const cols = line.split(',').map((s) => s.trim());

          const front = cols[0];
          const back = cols[1];
          const type = (cols[2] ?? 'other') as WordType;
          const enEx = cols[3];
          const ptEx = cols[4];

          if (!front || !back) return null;

          const conjugations: Conjugations = {};

          const present = parseGroup(cols[5]);
          if (present) conjugations.present = present;

          const perfeito = parseGroup(cols[6]);
          const imperfeito = parseGroup(cols[7]);
          if (perfeito || imperfeito) {
            conjugations.past = {};
            if (perfeito) conjugations.past.perfeito = perfeito;
            if (imperfeito) conjugations.past.imperfeito = imperfeito;
          }

          const future = parseGroup(cols[8]);
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
        })
        .filter((c): c is Card => c !== null);

      if (newCards.length) {
        onImportCards(newCards);
        setHasImported(true);
      }
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    } finally {
      e.target.value = '';
      setIsImporting(false);
    }
  };

  const selected = cards.filter((c) => selectedIds.has(c.id));
  const totalKnown = cards.filter((c) => knownIds.has(c.id)).length;

  // Cards eligible for study (after filtering known)
  const studyPool = React.useMemo(() => {
    const base = selected.length > 0 ? selected : cards;
    return skipKnown ? base.filter((c) => !knownIds.has(c.id)) : base;
  }, [cards, selected, skipKnown, knownIds]);

  const totalBatches = Math.max(1, Math.ceil(studyPool.length / batchSize));

  // Keep batchIndex in range when pool or size changes
  useEffect(() => {
    if (batchIndex >= totalBatches) {
      setBatchIndex(Math.max(0, totalBatches - 1));
    }
  }, [batchIndex, totalBatches]);

  const handleStartSession = () => {
    if (studyPool.length === 0) {
      alert(
        skipKnown
          ? 'All cards in this selection are marked as known. Uncheck "Skip known" to include them.'
          : 'No cards to study.'
      );
      return;
    }
    const start = batchIndex * batchSize;
    const batch = studyPool.slice(start, start + batchSize);
    onStartSession(
      batch.map((c) => c.id),
      false
    );
  };

  const handleSaveGroup = () => {
    if (!onSaveGroup(groupName)) return;
    setGroupName('');
  };

  return (
    <div className="card">
      <h3>Add Card</h3>
      <div className="add-card-grid">
        <div className="input-field">
          <label className="muted">English</label>
          <input
            value={en}
            onChange={(e) => setEn(e.target.value)}
            placeholder="e.g., house"
            className="input"
          />
        </div>
        <div className="input-field">
          <label className="muted">Portuguese (EU)</label>
          <input
            value={pt}
            onChange={(e) => setPt(e.target.value)}
            placeholder="casa"
            className="input"
          />
        </div>

        <div className="input-field">
          <label className="muted">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as WordType)}
            className="input"
          >
            <option value="noun">Noun</option>
            <option value="verb-regular">Verb (Regular)</option>
            <option value="verb-irregular">Verb (Irregular)</option>
            <option value="adjective">Adjective</option>
            <option value="adverb">Adverb</option>
            <option value="expression">Expression</option>
            <option value="phrase">Phrase</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / span 2' }} className="input-field">
          <label className="muted">Examples (one per line: EN | PT)</label>
          <textarea
            value={examplesText}
            onChange={(e) => setExamplesText(e.target.value)}
            rows={3}
            placeholder="I like the house | Eu gosto da casa"
            className="input"
          />
        </div>
      </div>

      <div className="manage-actions">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={importFile}
          style={{ display: 'none' }}
        />
        <div className="tooltip-wrapper">
          <span className="tooltip-icon">i</span>
          <button
            type="button"
            className="btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? 'Importing…' : 'Import'}
          </button>
          <div className="tooltip-content">
            <strong>CSV format (one card per line):</strong>
            <br />
            <code>
              english,portuguese,type,example_en,example_pt,
              present,past_perfeito,past_imperfeito,future
            </code>
            <br />
            <br />
            <strong>Rules:</strong>
            <ul>
              <li>One CSV line = one card</li>
              <li>Columns are separated by commas (,)</li>
              <li>
                Conjugation columns are <b>optional</b> and can be provided
                partially
              </li>
              <li>
                Each conjugation column must contain exactly 6 forms separated
                by <b>|</b>
              </li>
            </ul>
            <em>
              You may provide only one conjugation column (e.g. present only).
              Missing conjugation columns are ignored.
            </em>
            <strong>Person order:</strong>
            <br />
            eu | tu | ele/ela/você | nós | vós | eles/elas/vocês
            <br />
            <br />
            <strong>Example (single CSV line):</strong>
            <br />
            <code
              style={{
                fontSize: '0.75rem',
                display: 'block',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              to be,ser,verb-irregular,I am happy.,Sou
              feliz.,sou|és|é|somos|sois|são,fui|foste|foi|fomos|fostes|foram,era|eras|era|éramos|éreis|eram,serei|serás|será|seremos|sereis|serão
            </code>
          </div>
        </div>
        <button
          type="button"
          className="btn"
          onClick={handleLoadSampleWords}
          disabled={isImporting}
          title="Load 2,251 curated European Portuguese words"
        >
          {isImporting ? 'Loading…' : 'Load Sample Words'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={onExportCSV}
          disabled={isImporting || cards.length === 0}
        >
          Export all
        </button>
        <button
          type="button"
          className="btn"
          onClick={onExportUnknownCSV}
          disabled={isImporting || cards.length === 0}
        >
          Export unknown only
        </button>

        <button
          type="button"
          className="btn primary"
          onClick={handleAdd}
          disabled={!en.trim() || !pt.trim() || isImporting}
        >
          {isImporting ? 'Please wait…' : 'Add'}
        </button>
      </div>

      <h3 style={{ marginTop: 16 }}>Cards</h3>

      <div className="card" style={{ margin: '1rem 0px 2rem', padding: 12 }}>
        <div className="cards-controls">
          <span className="pill">Selected: {selected.length}</span>
          <span className="pill">
            Items: {selected.length > 0 ? selected.length : cards.length}
          </span>
          {totalKnown > 0 && (
            <span className="pill" style={{ background: '#dcfce7', borderColor: '#bbf7d0' }}>
              Known: {totalKnown}
            </span>
          )}

          <label
            className="muted small-text"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <input
              type="checkbox"
              checked={onlySelected}
              onChange={(e) => {
                setOnlySelected(e.target.checked);
              }}
            />
            Show only selected
          </label>

          {totalKnown > 0 && (
            <label
              className="muted small-text"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <input
                type="checkbox"
                checked={skipKnown}
                onChange={(e) => setSkipKnown(e.target.checked)}
              />
              Skip known
            </label>
          )}

          <div className="cards-controls-buttons">
            <button className="btn" onClick={onToggleSelectAll}>
              Select all
            </button>
            <button className="btn" onClick={onClearSelection}>
              Clear
            </button>
          </div>
        </div>

        <div className="batch-controls">
          <label className="muted small-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Batch size:
            <select
              className="input"
              value={batchSize}
              onChange={(e) => {
                setBatchSize(Number(e.target.value));
                setBatchIndex(0);
              }}
              style={{ width: 70 }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              className="btn"
              onClick={() => setBatchIndex((i) => Math.max(0, i - 1))}
              disabled={batchIndex === 0}
              style={{ padding: '0.35rem 0.6rem' }}
            >
              &lt;
            </button>
            <span className="pill" style={{ minWidth: 90, textAlign: 'center' }}>
              Batch {batchIndex + 1} / {totalBatches}
            </span>
            <button
              className="btn"
              onClick={() => setBatchIndex((i) => Math.min(totalBatches - 1, i + 1))}
              disabled={batchIndex >= totalBatches - 1}
              style={{ padding: '0.35rem 0.6rem' }}
            >
              &gt;
            </button>
          </div>

          <span className="muted small-text">
            Cards {batchIndex * batchSize + 1}–{Math.min((batchIndex + 1) * batchSize, studyPool.length)} of {studyPool.length}
          </span>

          <button
            className="btn primary"
            onClick={handleStartSession}
            disabled={studyPool.length === 0}
          >
            Start batch
          </button>
        </div>
      </div>

      <div className="card" style={{ margin: '0 0 2rem', padding: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>Saved Study Sets</h3>
            <div className="muted small-text">
              Save a selection for focused review, like new words, weak spots,
              or a weekly batch.
            </div>
          </div>
          <span className="pill">Sets: {groups.length}</span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <input
            className="input"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g., Week 1 verbs"
            style={{ flex: '1 1 240px', minWidth: 0 }}
          />
          <button
            type="button"
            className="btn primary"
            onClick={handleSaveGroup}
            disabled={selected.length === 0 || !groupName.trim()}
            title="Save the current selection as a reusable study set"
          >
            Save selection as set
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="muted small-text">
            No saved sets yet. Select a few cards and save them as a reusable
            study set.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {groups.map((group) => (
              <div
                key={group.id}
                style={{
                  border: '1px solid var(--br)',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{group.name}</div>
                  <div className="muted small-text">
                    {group.cardIds.length} cards · saved{' '}
                    {new Date(group.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onLoadGroup(group.id, false)}
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => onLoadGroup(group.id, true)}
                  >
                    Study
                  </button>
                  <button
                    type="button"
                    className="btn warn"
                    onClick={() => onDeleteGroup(group.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          margin: '8px 0',
          flexWrap: 'wrap',
        }}
      >
        <input
          className="input"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          placeholder="Search English / Portuguese / examples"
          style={{ flex: '1 1 250px', maxWidth: 400, minWidth: 0 }}
        />

        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <label className="muted small-text desktop-filter-label">
            Filter:
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as WordType | 'all')}
            className="input"
            style={{ minWidth: 160 }}
          >
            <option value="all">All Types</option>
            <option value="noun">Noun</option>
            <option value="verb-regular">Verb (Regular)</option>
            <option value="verb-irregular">Verb (Irregular)</option>
            <option value="adjective">Adjective</option>
            <option value="adverb">Adverb</option>
            <option value="expression">Expression</option>
            <option value="phrase">Phrase</option>
            <option value="other">Other</option>
          </select>
        </div>

        {q && (
          <button
            className="btn"
            onClick={() => {
              setQ('');
            }}
          >
            Clear
          </button>
        )}
        <span className="pill" style={{ flexShrink: 0 }}>
          Results: {filtered.length}
        </span>
      </div>

      <style>{`
        .desktop-filter-label {
          display: none;
        }
        @media (min-width: 768px) {
          .desktop-filter-label {
            display: inline;
          }
        }
      `}</style>

      <CardTable
        cards={filtered}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
        onRemove={onRemove}
        pagination={pagination}
        onPaginationChange={setPagination}
      />

      {cards.length === 0 && (
        <div
          style={{ textAlign: 'center', margin: '2rem 0 1rem' }}
          className="muted small-text"
        >
          No cards yet.
        </div>
      )}
    </div>
  );
}

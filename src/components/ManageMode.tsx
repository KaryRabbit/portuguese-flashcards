import type { PaginationState } from '@tanstack/react-table';
import React, { useEffect, useRef, useState } from 'react';
import type {
  Card,
  Conjugations,
  ExamplePair,
  WordType,
} from '../flashcard-types';
import { uid } from '../utils/storage';
import { CardTable } from './CardTable';

interface ManageModeProps {
  cards: Card[];
  selectedIds: Set<string>;
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
  onRegenerateSession: (preserveSelection: boolean) => void;
  onClearSelection: () => void;
  setHasImported: (value: boolean) => void;
}

export function ManageMode({
  cards,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRemove,
  onAdd,
  onImportCards,
  onExportCSV,
  onRegenerateSession,
  onClearSelection,
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

  const normalizeConjugations = (data: unknown): Conjugations | undefined => {
    if (!data || typeof data !== 'object') return undefined;

    const PERSON_KEYS = [
      'eu',
      'tu',
      'eleElaVoce',
      'nos',
      'vos',
      'elesElasVoces',
    ] as const;

    const normalizeTense = (
      tense: unknown
    ): Record<string, string> | undefined => {
      if (!tense || typeof tense !== 'object') return undefined;
      const t = tense as Record<string, unknown>;
      const result: Record<string, string> = {};
      for (const k of PERSON_KEYS) {
        const v = t[k];
        if (typeof v === 'string' && v.trim()) result[k] = v.trim();
      }
      return Object.keys(result).length ? result : undefined;
    };

    const d = data as Record<string, unknown>;
    const result: Conjugations = {};

    if (d.present) result.present = normalizeTense(d.present);
    if (d.future) result.future = normalizeTense(d.future);

    if (d.past) {
      const past = d.past as Record<string, unknown>;
      if ('perfeito' in past || 'imperfeito' in past) {
        result.past = {
          perfeito: normalizeTense(past.perfeito),
          imperfeito: normalizeTense(past.imperfeito),
        };
      } else {
        result.past = normalizeTense(past);
      }
    }

    return Object.keys(result).length ? result : undefined;
  };

  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);

    try {
      const text = await file.text();
      let newCards: Card[] = [];

      const normalizeConjugationsCSV = (
        data: string
      ): Conjugations | undefined => {
        const parts = data.split('|').map((p) => p.trim());
        if (parts.length < 6) return undefined;

        return {
          present: {
            eu: parts[0],
            tu: parts[1],
            eleElaVoce: parts[2],
            nos: parts[3],
            vos: parts[4],
            elesElasVoces: parts[5],
          },
        };
      };

      const isCsvOrTxt = /\.(csv|txt)$/i.test(file.name);

      // CSV / TXT import
      if (isCsvOrTxt) {
        newCards = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line) => {
            const [front, back, type = 'other', enEx, ptEx, conj] = line
              .split(',')
              .map((s) => s.trim());

            if (!front || !back) return null;

            const conjugations = conj
              ? normalizeConjugationsCSV(conj)
              : undefined;

            return {
              id: uid(),
              front,
              back,
              type: type as WordType,
              examples: enEx && ptEx ? [{ en: enEx, pt: ptEx }] : undefined,
              conjugations,
              createdAt: Date.now(),
            } as Card;
          })
          .filter((c): c is Card => !!c);
      }

      // JSON import (supports conjugations)
      else if (file.name.endsWith('.json')) {
        const arr = JSON.parse(text);
        if (Array.isArray(arr)) {
          newCards = arr
            .map((it) => {
              const front = (it.front ?? '').trim();
              const back = (it.back ?? '').trim();
              if (!front || !back) return null;

              const type = (it.type || 'other') as WordType;

              const examples = Array.isArray(it.examples)
                ? it.examples
                    .map((e: ExamplePair) => ({
                      en: String(e?.en ?? '').trim(),
                      pt: String(e?.pt ?? '').trim(),
                    }))
                    .filter((e: ExamplePair) => e.en && e.pt)
                : undefined;

              const conjugations = normalizeConjugations(it.conjugations);

              return {
                id: uid(),
                front,
                back,
                type,
                examples,
                conjugations,
                createdAt: Date.now(),
              } as Card;
            })
            .filter((c): c is Card => !!c);
        }
      }

      // After importing, merge cards
      if (newCards.length) {
        onImportCards(newCards);
        setHasImported(true);
      }
    } catch (error) {
      alert(`Import failed: ${(error as Error).message}`);
    } finally {
      e.target.value = '';
      setIsImporting(false);
    }
  };

  const selected = cards.filter((c) => selectedIds.has(c.id));

  return (
    <div className="card">
      <h3>Add Card</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'end',
          marginTop: 8,
          alignItems: 'center',
          gap: 8,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,"
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
            {isImporting ? 'Importing…' : 'Import File'}
          </button>
          <div className="tooltip-content">
            <strong>Import Formats:</strong>
            <br />
            <br />
            <strong>CSV Format:</strong>
            <br />
            <code
              style={{
                fontSize: '0.75rem',
                background: '#374151',
                padding: '4px 6px',
                borderRadius: '3px',
                display: 'block',
                marginTop: '4px',
              }}
            >
              english,portuguese,type,example_en,example_pt,conjugations
            </code>
            <br />
            <strong>Example (noun):</strong>
            <br />
            <code
              style={{
                fontSize: '0.75rem',
                background: '#374151',
                padding: '4px 6px',
                borderRadius: '3px',
                display: 'block',
                marginTop: '4px',
              }}
            >
              house,casa,noun,I like the house,Eu gosto da casa
            </code>
            <br />
            <strong>Example (verb with conjugations):</strong>
            <br />
            <code
              style={{
                fontSize: '0.75rem',
                background: '#374151',
                padding: '4px 6px',
                borderRadius: '3px',
                display: 'block',
                marginTop: '4px',
              }}
            >
              to eat,comer,verb-regular,We eat together.,Comemos juntos.,como|comes|come|comemos|comeis|comem
            </code>
            <br />
            <strong>Conjugations:</strong> 6 forms separated by | (eu|tu|ele/ela/você|nós|vós|eles/elas/vocês)
            <br />
            <br />
            <strong>Supported types:</strong> noun, verb-regular, verb-irregular, adjective, adverb, expression, phrase, other
          </div>
        </div>
        <button
          type="button"
          className="btn"
          onClick={onExportCSV}
          disabled={isImporting || cards.length === 0}
        >
          Export CSV
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
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span className="pill">Selected: {selected.length}</span>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="pill">
              Items: {selected.length > 0 ? selected.length : cards.length}
            </span>
          </div>

          <label
            className="muted small-text"
            style={{
              marginLeft: 'auto',
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

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onToggleSelectAll}>
              Select all
            </button>
            <button className="btn" onClick={onClearSelection}>
              Clear
            </button>

            <button
              className="btn primary"
              onClick={() => onRegenerateSession(selectedIds.size > 0)}
              disabled={cards.length === 0}
              title={
                selected.length > 0 ? 'Start with selected' : 'Start with all'
              }
            >
              {selected.length > 0
                ? 'Start session (selected)'
                : 'Start session (all)'}
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          margin: '8px 0',
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
          style={{ minWidth: 260 }}
        />

        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <label className="muted small-text">Filter by Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as WordType | 'all')}
            className="input"
            style={{ width: 180 }}
          >
            <option value="all">All</option>
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

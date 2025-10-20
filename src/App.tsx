import { Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ExamplePair {
  en: string;
  pt: string;
}
interface Card {
  id: string;
  front: string;
  back: string;
  examples?: ExamplePair[];
  createdAt?: number;
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const KEY = 'flashcards-min-v1';
const load = (): Card[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Card[];
    const now = Date.now();
    return parsed.map((c) => ({
      ...c,
      createdAt: typeof c.createdAt === 'number' ? c.createdAt : now,
    }));
  } catch {
    return [];
  }
};

const save = (cards: Card[]) =>
  localStorage.setItem(KEY, JSON.stringify(cards));
const shuffle = <T,>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function App() {
  const [cards, setCards] = useState<Card[]>(() => load());
  const [mode, setMode] = useState<'study' | 'manage'>('study');
  const [showBack, setShowBack] = useState(false);
  const [idx, setIdx] = useState(0);
  const [en, setEn] = useState('');
  const [pt, setPt] = useState('');
  const [direction, setDirection] = useState<'en-pt' | 'pt-en'>('en-pt');
  const [sessionSource, setSessionSource] = useState<'all' | 'selected'>('all');
  const [examplesText, setExamplesText] = useState('');
  const [q, setQ] = useState('');

  const PAGE_SIZE_KEY = 'flashcards-page-size';
  const ALLOWED_PAGE_SIZES = [5, 10, 20, 50] as const;

  function loadPageSize(): number {
    const raw = localStorage.getItem(PAGE_SIZE_KEY);
    const n = raw ? parseInt(raw, 10) : 10;
    return (ALLOWED_PAGE_SIZES as readonly number[]).includes(n) ? n : 10;
  }

  // NEW: study session controls
  const [session, setSession] = useState<Card[]>([]);
  const [sessionId, setSessionId] = useState<number>(0); // bumps to invalidate when regenerating

  // NEW: simple pagination for Manage
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => loadPageSize());

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [onlySelected, setOnlySelected] = useState(false);

  // add with other state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // keep selection in sync if cards change
  useEffect(() => {
    setSelectedIds(
      (prev) =>
        new Set([...prev].filter((id) => cards.some((c) => c.id === id)))
    );
  }, [cards]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => save(cards), [cards]);

  type SortBy = 'front' | 'back' | 'createdAt' | 'examples';
  type SortDir = 'asc' | 'desc';

  const SORT_KEY = 'flashcards-sort-v1';
  const DEFAULT_SORT: { by: SortBy; dir: SortDir } = {
    by: 'createdAt',
    dir: 'desc',
  };

  function loadSort(): { by: SortBy; dir: SortDir } {
    try {
      const raw = localStorage.getItem(SORT_KEY);
      if (!raw) return DEFAULT_SORT;
      const { by, dir } = JSON.parse(raw);
      const validBy = ['front', 'back', 'createdAt', 'examples'].includes(by);
      const validDir = ['asc', 'desc'].includes(dir);
      return {
        by: (validBy ? by : DEFAULT_SORT.by) as SortBy,
        dir: (validDir ? dir : DEFAULT_SORT.dir) as SortDir,
      };
    } catch {
      return DEFAULT_SORT;
    }
  }

  const [sortBy, setSortBy] = useState<SortBy>(() => loadSort().by);
  const [sortDir, setSortDir] = useState<SortDir>(() => loadSort().dir);

  useEffect(() => {
    localStorage.setItem(
      SORT_KEY,
      JSON.stringify({ by: sortBy, dir: sortDir })
    );
  }, [sortBy, sortDir]);

  function toggleSort(field: SortBy) {
    setSortBy((prevBy) => {
      if (prevBy === field) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        return prevBy;
      }
      // choose sensible default direction when switching columns
      setSortDir(field === 'createdAt' ? 'desc' : 'asc');
      return field;
    });
  }

  function sortCards(list: Card[]): Card[] {
    const dirFactor = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';

      switch (sortBy) {
        case 'front':
          av = (a.front || '').toLowerCase();
          bv = (b.front || '').toLowerCase();
          break;
        case 'back':
          av = (a.back || '').toLowerCase();
          bv = (b.back || '').toLowerCase();
          break;
        case 'examples':
          av = a.examples?.length ?? 0;
          bv = b.examples?.length ?? 0;
          break;
        case 'createdAt':
        default:
          av = a.createdAt ?? 0;
          bv = b.createdAt ?? 0;
      }

      if (av < bv) return -1 * dirFactor;
      if (av > bv) return 1 * dirFactor;
      // tiebreaker: stable by id
      return a.id < b.id ? -1 : 1;
    });
  }

  // initial shuffle + initial session
  useEffect(() => {
    if (cards.length > 1) setCards((prev) => shuffle([...prev]));
    regenerateSession(); // produce default session on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(PAGE_SIZE_KEY, String(pageSize));
  }, [pageSize]);

  const regenerateSession = () => {
    const useSelected = selectedIds.size > 0;
    const base = useSelected
      ? cards.filter((c) => selectedIds.has(c.id))
      : cards;

    setSessionSource(useSelected ? 'selected' : 'all');
    setSession(shuffle([...base]));
    setIdx(0);
    setShowBack(false);
    setSessionId((s) => s + 1);
  };

  const norm = (s: string) => s.toLowerCase();
  const matches = (c: Card) => {
    if (!q.trim()) return true;
    const needle = norm(q.trim());
    if (norm(c.front).includes(needle) || norm(c.back).includes(needle))
      return true;
    if (c.examples) {
      return c.examples.some(
        (ex) => norm(ex.en).includes(needle) || norm(ex.pt).includes(needle)
      );
    }
    return false;
  };

  const active = session[idx] ?? null;

  const add = async () => {
    const front = en.trim();
    const back = pt.trim();
    if (!front || !back) return;

    const examples = examplesText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [enEx = '', ptEx = ''] = line.split('|').map((s) => s.trim());
        return { en: enEx, pt: ptEx };
      });

    setCards((prev) => [
      {
        id: uid(),
        front,
        back,
        examples: examples.length ? examples : undefined,
        createdAt: Date.now(),
      },
      ...prev,
    ]);

    setEn('');
    setPt('');
    setExamplesText('');
    setMode('study');
    setIdx(0);
    setShowBack(false);
    regenerateSession();
  };

  const isActiveSelected = active ? selectedIds.has(active.id) : false;

  const toggleActiveInSessions = () => {
    if (!active) return;

    // Toggle selection for future sessions
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(active.id)) next.delete(active.id);
      else next.add(active.id);
      return next;
    });

    // If user unchecked, remove from current session immediately
    // (so it disappears from this run as well)
    setSession((prev) => {
      const nextSess = prev.filter((c) => c.id !== active.id);
      // move index safely to the next available card
      setIdx((i) => Math.min(i, Math.max(nextSess.length - 1, 0)));
      return nextSess;
    });

    setShowBack(false);
  };

  const isStudy = mode === 'study';
  const isManage = mode === 'manage';

  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setIsImporting(true);

    try {
      let newCards: Card[] = [];

      if (file.name.endsWith('.csv')) {
        newCards = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line) => {
            const [front = '', back = ''] = line
              .split(',')
              .map((s) => s.trim());
            return front && back ? { id: uid(), front, back } : null;
          })
          .filter((c): c is Card => !!c);
      } else if (file.name.endsWith('.json')) {
        const arr = JSON.parse(text);
        if (Array.isArray(arr)) {
          newCards = arr
            .map((it) => ({
              id: uid(),
              front: (it.front ?? '').trim(),
              back: (it.back ?? '').trim(),
            }))
            .filter((c) => c.front && c.back);
        }
      } else if (file.name.endsWith('.txt')) {
        newCards = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line) => {
            const [front = '', back = ''] = line
              .split('|')
              .map((s) => s.trim());
            return front && back ? { id: uid(), front, back } : null;
          })
          .filter((c): c is Card => !!c);
      }

      if (newCards.length) {
        setCards((prev) => [...newCards, ...prev]);
      }
    } catch (error) {
      alert(`Import failed: ${(error as Error).message}`);
    } finally {
      e.target.value = '';
      setIsImporting(false);
      setMode('study');
      setIdx(0);
      setShowBack(false);
      regenerateSession();
    }
  };

  const remove = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setSession((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const next = () =>
    setIdx((i) => Math.min(i + 1, Math.max(session.length - 1, 0)));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));
  const reset = () => {
    setIdx(0);
    setShowBack(false);
  };

  // Compute text based on direction
  const frontText = active
    ? direction === 'en-pt'
      ? active.front
      : active.back
    : '';
  const backText = active
    ? direction === 'en-pt'
      ? active.back
      : active.front
    : '';

  // base list respects "Show only selected"
  const listBase = onlySelected
    ? cards.filter((c) => selectedIds.has(c.id))
    : cards;
  // apply search
  const filtered = listBase.filter(matches);
  const sorted = sortCards(filtered);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  const clampedPage = Math.min(page, totalPages);

  const start = (clampedPage - 1) * pageSize;
  const end = start + pageSize;

  const pageItems = sorted.slice(start, end);

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
        <button
          type="button"
          className={`btn ${isStudy ? 'primary' : ''}`}
          disabled={isStudy}
          aria-pressed={isStudy}
          onClick={() => {
            if (!isStudy) {
              setMode('study');
              reset();
            }
          }}
        >
          Study
        </button>
        <button
          type="button"
          className={`btn ${isManage ? 'primary' : ''}`}
          disabled={isManage}
          aria-pressed={isManage}
          onClick={() => setMode('manage')}
        >
          Manage
        </button>

        <button
          type="button"
          className="btn danger"
          onClick={() => {
            if (confirm('Delete all saved cards?')) {
              localStorage.removeItem('flashcards-min-v1');
              setCards([]);
              setSession([]);
              setIdx(0);
              setShowBack(false);
              setPage(1);
            }
          }}
        >
          Reset All
        </button>

        <span className="pill">Total: {cards.length}</span>
        <span className="pill">Session: {session.length}</span>

        {/* Direction selector */}
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
        <div className="card" key={sessionId}>
          {active ? (
            <>
              {active && (
                <div
                  className="muted"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    gap: 12,
                  }}
                >
                  <div
                    style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                  >
                    <span className="pill">
                      Source:{' '}
                      {sessionSource === 'selected' ? 'Selected' : 'All'}
                    </span>
                    <span className="pill">Items: {session.length}</span>

                    <label
                      className="muted"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginLeft: 12,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isActiveSelected}
                        onChange={toggleActiveInSessions}
                      />
                      In session
                    </label>
                  </div>
                </div>
              )}
              <div
                className="flash"
                role="button"
                onClick={() => setShowBack((s) => !s)}
              >
                {showBack ? backText : frontText}
              </div>

              {showBack && active?.examples && active.examples.length > 0 && (
                <ul
                  className="muted"
                  style={{ marginTop: 8, textAlign: 'left' }}
                >
                  {active.examples.map((ex, i) => (
                    <li key={i}>
                      <b>{ex.en}</b> → {ex.pt}
                    </li>
                  ))}
                </ul>
              )}

              <div
                style={{ display: 'flex', justifyContent: 'center', gap: 12 }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    prev();
                    setShowBack(false);
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setMode('manage');
                    reset();
                  }}
                >
                  Stop
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    next();
                    setShowBack(false);
                  }}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div
              className="muted"
              style={{ textAlign: 'center', padding: '2rem' }}
            >
              No cards in session.
            </div>
          )}
        </div>
      )}

      {mode === 'manage' && (
        <div className="card">
          <h3>Add Card</h3>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
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
              accept=".csv,.json,.txt"
              onChange={importFile}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? 'Importing…' : 'Import File'}
            </button>

            <button
              type="button"
              className="btn primary"
              onClick={add}
              disabled={isImporting}
            >
              {isImporting ? 'Please wait…' : 'Add'}
            </button>
          </div>

          <h3 style={{ marginTop: 16 }}>Cards</h3>

          {(() => {
            const selected = cards.filter((c) => selectedIds.has(c.id));
            return (
              <div
                className="card"
                style={{ margin: '1rem 0px 2rem', padding: 12 }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <span className="pill">Selected: {selected.length}</span>

                  <div
                    style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                  >
                    <span className="pill">
                      Source: {selected.length > 0 ? 'Selected' : 'All'}
                    </span>
                    <span className="pill">
                      Items:{' '}
                      {selected.length > 0 ? selected.length : cards.length}
                    </span>
                  </div>

                  <label
                    className="muted"
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
                        setPage(1);
                      }}
                    />
                    Show only selected
                  </label>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn"
                      onClick={() =>
                        setSelectedIds(new Set(cards.map((c) => c.id)))
                      }
                    >
                      Select all
                    </button>
                    <button
                      className="btn"
                      onClick={() => setSelectedIds(new Set())}
                    >
                      Clear
                    </button>
                    <button
                      className="btn primary"
                      onClick={regenerateSession}
                      disabled={cards.length === 0}
                      title={
                        selected.length > 0
                          ? 'Start with selected'
                          : 'Start with all'
                      }
                    >
                      {selected.length > 0
                        ? 'Start session (selected)'
                        : 'Start session (all)'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

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
                setPage(1);
              }}
              placeholder="Search English / Portuguese / examples"
              style={{ minWidth: 260 }}
            />
            {q && (
              <button
                className="btn"
                onClick={() => {
                  setQ('');
                  setPage(1);
                }}
              >
                Clear
              </button>
            )}
            <span className="pill" style={{ flexShrink: 0 }}>
              Results: {filtered.length}
            </span>
          </div>

          {/* Pagination controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <button
              className="btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={clampedPage <= 1}
            >
              ◀&nbsp;&nbsp;Prev
            </button>
            <span className="pill">
              Page {clampedPage} / {totalPages}
            </span>
            <button
              className="btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={clampedPage >= totalPages}
            >
              Next&nbsp;&nbsp;▶
            </button>
            <label className="muted" style={{ marginLeft: 12 }}>
              Rows:
            </label>
            <select
              className="input"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{ width: 80 }}
            >
              {[5, 10, 20, 50].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              className="btn"
              onClick={() => {
                setSelectedIds((prev) => {
                  const n = new Set(prev);
                  pageItems.forEach((c) => n.add(c.id)); // select current page
                  return n;
                });
              }}
            >
              Select page
            </button>
            <button className="btn" onClick={() => setSelectedIds(new Set())}>
              Clear selection
            </button>
            <button className="btn primary" onClick={regenerateSession}>
              Start session from selection
            </button>
          </div>

          <div style={{ maxHeight: '560px', overflowY: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              {' '}
              <thead>
                <tr>
                  <th>In session</th>

                  <th>
                    <button
                      type="button"
                      className="btn link"
                      onClick={() => toggleSort('front')}
                      title="Sort by English"
                    >
                      English{' '}
                      {sortBy === 'front'
                        ? sortDir === 'asc'
                          ? '▲'
                          : '▼'
                        : ''}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      className="btn link"
                      onClick={() => toggleSort('back')}
                      title="Sort by Portuguese"
                    >
                      Portuguese (EU){' '}
                      {sortBy === 'back' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      className="btn link"
                      onClick={() => toggleSort('examples')}
                      title="Sort by examples count"
                    >
                      Ex{' '}
                      {sortBy === 'examples'
                        ? sortDir === 'asc'
                          ? '▲'
                          : '▼'
                        : ''}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      className="btn link"
                      onClick={() => toggleSort('createdAt')}
                      title="Sort by date added"
                    >
                      Added{' '}
                      {sortBy === 'createdAt'
                        ? sortDir === 'asc'
                          ? '▲'
                          : '▼'
                        : ''}
                    </button>
                  </th>

                  <th />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        aria-label="Include in session"
                      />
                    </td>
                    <td>{c.front}</td>
                    <td>{c.back}</td>
                    <td>
                      <button
                        type="button"
                        className="btn link"
                        color="warn"
                        onClick={() => remove(c.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cards.length === 0 && <div className="muted">No cards yet.</div>}
        </div>
      )}
    </div>
  );
}

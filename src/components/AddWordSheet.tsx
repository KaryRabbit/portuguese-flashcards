import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { WordType } from '../flashcard-types';

interface AddWordSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    front: string,
    back: string,
    type: WordType,
    examplesText: string
  ) => boolean;
}

const WORD_TYPES: { value: WordType; label: string }[] = [
  { value: 'noun', label: 'Noun' },
  { value: 'verb-regular', label: 'Verb (Regular)' },
  { value: 'verb-irregular', label: 'Verb (Irregular)' },
  { value: 'adjective', label: 'Adjective' },
  { value: 'adverb', label: 'Adverb' },
  { value: 'expression', label: 'Expression' },
  { value: 'phrase', label: 'Phrase' },
  { value: 'other', label: 'Other' },
];

/**
 * Mobile-first bottom sheet for adding a single word by hand. Stays open after
 * a save so several words can be added in a row; shows an inline confirmation
 * instead of a browser alert.
 */
export function AddWordSheet({ open, onClose, onAdd }: AddWordSheetProps) {
  const [en, setEn] = useState('');
  const [pt, setPt] = useState('');
  const [type, setType] = useState<WordType>('noun');
  const [examplesText, setExamplesText] = useState('');
  const [result, setResult] = useState<
    { added: boolean; word: string } | null
  >(null);

  // Close on Escape while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSave = en.trim() && pt.trim();

  const handleSave = () => {
    const front = en.trim();
    const back = pt.trim();
    if (!front || !back) return;

    const added = onAdd(front, back, type, examplesText);
    setResult({ added, word: `${front} → ${back}` });
    if (added) {
      // Clear for the next entry, keep the type selection.
      setEn('');
      setPt('');
      setExamplesText('');
    }
  };

  return (
    <div
      className="sheet-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="sheet-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Add a word"
      >
        <div className="sheet-header">
          <h3 style={{ margin: 0 }}>Add a word</h3>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            aria-label="Close"
            style={{ border: 'none', padding: 6 }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sheet-body">
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSave) handleSave();
              }}
            />
          </div>
          <div className="input-field">
            <label className="muted">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as WordType)}
              className="input"
            >
              {WORD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="input-field">
            <label className="muted">Examples (optional — one per line: EN | PT)</label>
            <textarea
              value={examplesText}
              onChange={(e) => setExamplesText(e.target.value)}
              rows={2}
              placeholder="I like the house | Eu gosto da casa"
              className="input"
            />
          </div>

          {result && (
            <div
              className={`sheet-confirm ${result.added ? '' : 'is-duplicate'}`}
              role="status"
            >
              <Check size={16} />
              {result.added ? 'Added ' : 'Already in your deck: '}
              <strong>{result.word}</strong>
            </div>
          )}
        </div>

        <div className="sheet-footer">
          <button type="button" className="btn" onClick={onClose}>
            Done
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            Save &amp; add another
          </button>
        </div>
      </div>
    </div>
  );
}

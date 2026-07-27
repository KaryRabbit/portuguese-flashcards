import { Check, Plus, Shuffle, Volume2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Card } from '../flashcard-types';
import { isSpeechSupported, speak } from '../utils/speech';

interface StudyModeProps {
  session: Card[];
  sessionId: number;
  direction: 'en-pt' | 'pt-en';
  selectedIds: Set<string>;
  knownIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onStop: () => void;
  onShuffle: () => void;
  onMarkKnown: (id: string) => void;
  onMarkLearning: (id: string) => void;
  cardsCount: number;
  onStartDefault: () => void;
  onAddWord: () => void;
}

function Conjugations({ value }: { value: Card['conjugations'] }) {
  if (!value) return null;
  return (
    <div className="study-feed-conjugations">
      {Object.entries(value).map(([tense, forms]) => {
        if (!forms) return null;
        const entries = Object.entries(forms as Record<string, unknown>);
        const nested = entries.some(([, item]) => typeof item === 'object');
        const renderForms = (items: [string, unknown][]) => (
          <div className="study-conjugation-grid">
            {items.map(([form, formValue]) => (
              <div className="study-conjugation-pair" key={form}>
                <span className="study-conjugation-form">{form}</span>
                <b className="study-conjugation-value">{String(formValue)}</b>
              </div>
            ))}
          </div>
        );
        return (
          <section className="study-conjugation-section" key={tense}>
            <h4>{tense.charAt(0).toUpperCase() + tense.slice(1)}</h4>
            {nested
              ? entries.map(([label, item]) => (
                  <div className="study-conjugation-subsection" key={label}>
                    <strong>{label.charAt(0).toUpperCase() + label.slice(1)}</strong>
                    {renderForms(Object.entries(item as Record<string, unknown>))}
                  </div>
                ))
              : renderForms(entries)}
          </section>
        );
      })}
    </div>
  );
}

function ExampleLine({ label, text, lang }: { label: string; text: string; lang: string }) {
  return (
    <div className="example-line">
      <b>{label}:</b>
      <span>{text}</span>
      {isSpeechSupported() && (
        <button
          type="button"
          className="btn example-speak"
          onClick={() => speak(text, lang)}
          title={`Listen (${label})`}
        >
          <Volume2 size={14} />
        </button>
      )}
    </div>
  );
}

export function StudyMode({
  session,
  sessionId,
  direction,
  selectedIds,
  knownIds,
  onToggleSelect,
  onStop,
  onShuffle,
  onMarkKnown,
  onMarkLearning,
  cardsCount,
  onStartDefault,
  onAddWord,
}: StudyModeProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRevealedIds(new Set());
    setRatedIds(new Set());
    window.scrollTo({ top: 0 });
  }, [sessionId]);

  const scrollToNextUnrated = (afterId: string) => {
    const index = session.findIndex((c) => c.id === afterId);
    const nextCard = session
      .slice(index + 1)
      .find((c) => c.id !== afterId && !ratedIds.has(c.id));
    if (!nextCard) return;
    requestAnimationFrame(() => {
      document
        .getElementById(`study-card-${nextCard.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const rateCard = (card: Card, known: boolean) => {
    setRatedIds((current) => new Set(current).add(card.id));
    setRevealedIds((current) => {
      const next = new Set(current);
      next.delete(card.id);
      return next;
    });
    if (known) {
      // Card leaves the session, the next one slides up into place.
      onMarkKnown(card.id);
    } else {
      onMarkLearning(card.id);
      scrollToNextUnrated(card.id);
    }
  };

  if (session.length === 0) {
    const noCards = cardsCount === 0;
    return (
      <div className="card empty-state">
        <h3>{noCards ? 'No cards yet' : 'Ready to study'}</h3>
        <div className="muted" style={{ marginBottom: 16 }}>
          {noCards
            ? 'Add your first word to start memorizing.'
            : 'Start a fresh session, or pick a batch or study set in Manage.'}
        </div>
        <div className="empty-actions">
          <button type="button" className="btn primary" onClick={noCards ? onAddWord : onStartDefault}>
            {noCards && <Plus size={16} />}
            {noCards ? 'Add a word' : 'Start studying'}
          </button>
          {!noCards && (
            <button type="button" className="btn" onClick={onStop}>
              Go to Manage
            </button>
          )}
        </div>
      </div>
    );
  }

  const remaining = session.filter((c) => !ratedIds.has(c.id)).length;
  const reviewed = ratedIds.size;
  const total = reviewed + remaining;
  const done = remaining === 0;

  return (
    <section className="study-feed" aria-label="Study cards">
      <header className="study-feed-toolbar">
        <div className="study-feed-toolbar-row">
          <div>
            <span className="pill">
              {reviewed > 0 ? `${reviewed}/${total} reviewed` : `${total} cards`}
            </span>
            <p className="muted study-feed-hint">Tap a card to reveal · rate it to move on</p>
          </div>
          <div className="study-feed-actions">
            <button type="button" className="btn" onClick={onAddWord} title="Add a word">
              <Plus size={18} />
            </button>
            <button type="button" className="btn" onClick={onShuffle} title="Shuffle cards">
              <Shuffle size={18} />
            </button>
            <button type="button" className="btn" onClick={onStop}>
              Stop
            </button>
          </div>
        </div>
        <div
          className="study-feed-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={reviewed}
        >
          <div style={{ width: `${total ? (reviewed / total) * 100 : 0}%` }} />
        </div>
      </header>
      <div className="study-feed-list">
        {session.map((card) => {
          const revealed = revealedIds.has(card.id);
          const front = direction === 'en-pt' ? card.front : card.back;
          const back = direction === 'en-pt' ? card.back : card.front;
          const frontLang = direction === 'en-pt' ? 'en-US' : 'pt-PT';
          const backLang = direction === 'en-pt' ? 'pt-PT' : 'en-US';
          const stillLearning = ratedIds.has(card.id);
          return (
            <article className="card study-feed-card" key={card.id} id={`study-card-${card.id}`}>
              <header className="study-feed-card-header">
                <span>
                  {stillLearning && <span className="pill study-pill-learning">Still learning</span>}
                </span>
                <label className="study-session-toggle">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(card.id)}
                    onChange={() => onToggleSelect(card.id)}
                  />{' '}
                  In session
                </label>
              </header>
              <button
                type="button"
                className="study-card-face"
                aria-expanded={revealed}
                onClick={() =>
                  setRevealedIds((current) => {
                    const next = new Set(current);
                    if (next.has(card.id)) next.delete(card.id);
                    else next.add(card.id);
                    return next;
                  })
                }
              >
                {revealed ? back : front}
              </button>
              <div className="study-card-meta">
                {isSpeechSupported() && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => speak(revealed ? back : front, revealed ? backLang : frontLang)}
                    title="Listen to pronunciation"
                  >
                    <Volume2 size={18} />
                  </button>
                )}
                {knownIds.has(card.id) && <span className="muted small-text">Marked as known</span>}
              </div>
              {revealed && card.examples?.length ? (
                <ul className="muted examples-list">
                  {card.examples.map((example, exampleIndex) => (
                    <li key={exampleIndex} className="example-item">
                      <ExampleLine label="EN" text={example.en} lang="en-US" />
                      <ExampleLine label="PT" text={example.pt} lang="pt-PT" />
                    </li>
                  ))}
                </ul>
              ) : null}
              {revealed && <Conjugations value={card.conjugations} />}
              {revealed && (
                <div className="study-rating-actions">
                  <button
                    type="button"
                    className="btn rating-btn learning"
                    onClick={() => rateCard(card, false)}
                  >
                    <X size={16} />
                    Still learning
                  </button>
                  <button
                    type="button"
                    className="btn rating-btn known"
                    onClick={() => rateCard(card, true)}
                  >
                    <Check size={16} />
                    Know it
                  </button>
                </div>
              )}
            </article>
          );
        })}
        {done && (
          <div className="card study-feed-done">
            <h3>Session reviewed 🎉</h3>
            <p className="muted">
              You went through all {total} card{total !== 1 ? 's' : ''}.
              {session.length > 0 ? ' Cards you are still learning stay in the list above.' : ''}
            </p>
            <div className="empty-actions">
              <button type="button" className="btn primary" onClick={onStartDefault}>
                Next batch
              </button>
              <button type="button" className="btn btn-inline" onClick={onShuffle}>
                <Shuffle size={16} />
                Shuffle &amp; go again
              </button>
              <button type="button" className="btn" onClick={onStop}>
                Stop
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

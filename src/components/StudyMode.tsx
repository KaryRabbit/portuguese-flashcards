import { Shuffle, Volume2 } from 'lucide-react';
import React from 'react';
import type { Card } from '../flashcard-types';
import { isSpeechSupported, speak } from '../utils/speech';

interface StudyModeProps {
  active: Card | null;
  sessionId: number;
  idx: number;
  sessionLength: number;
  showBack: boolean;
  direction: 'en-pt' | 'pt-en';
  isActiveSelected: boolean;
  onToggleSelect: () => void;
  onToggleBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onStop: () => void;
  onShuffle: () => void;
  onInput: (value: number | null) => void;
  onGoto: () => void;
  gotoIndex: number | null;
}

export function StudyMode({
  active,
  sessionId,
  idx,
  sessionLength,
  showBack,
  direction,
  isActiveSelected,
  onToggleSelect,
  onToggleBack,
  onPrev,
  onNext,
  onInput,
  onGoto,
  gotoIndex,
  onStop,
  onShuffle,
}: StudyModeProps) {
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

  return (
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
                marginBottom: 12,
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="pill">
                  Progress: {Math.min(idx + 1, sessionLength)}/{sessionLength}
                </span>
                <span className="pill">
                  Remaining: {Math.max(sessionLength - (idx + 1), 0)}
                </span>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActiveSelected ? '#111' : '#666',
                  transition: 'color 0.2s ease',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={isActiveSelected}
                  onChange={onToggleSelect}
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: isActiveSelected ? '#007aff' : '#aaa',
                    cursor: 'pointer',
                  }}
                />
                In session
              </label>
            </div>
          )}
          <div className="center-alignment">
            <div className="flash" role="button" onClick={onToggleBack}>
              {showBack ? backText : frontText}
            </div>
            {/* Audio pronunciation button */}
            {isSpeechSupported() && (
              <button
                type="button"
                className="btn"
                style={{
                  border: 'none',
                  marginTop: '0.5rem',
                  marginLeft: '-1rem',
                }}
                onClick={() => {
                  const textToSpeak = showBack ? backText : frontText;
                  const lang =
                    direction === 'en-pt'
                      ? showBack
                        ? 'pt-PT'
                        : 'en-US'
                      : showBack
                      ? 'en-US'
                      : 'pt-PT';
                  speak(textToSpeak, lang);
                }}
                title="Listen to pronunciation"
              >
                <Volume2 size={18} />
              </button>
            )}
          </div>

          {/* Display examples */}
          {showBack && active?.examples?.length ? (
            <ul className="muted" style={{ marginTop: 8, textAlign: 'left' }}>
              {active.examples.map((ex, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <b>EN:</b>
                    <span>{ex.en}</span>
                    {isSpeechSupported() && (
                      <button
                        type="button"
                        className="btn"
                        style={{
                          border: 'none',
                          padding: '5px 4px 0',
                          minWidth: 'auto',
                        }}
                        onClick={() => speak(ex.en, 'en-US')}
                        title="Listen to English example"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <b>PT:</b>
                    <span>{ex.pt}</span>
                    {isSpeechSupported() && (
                      <button
                        type="button"
                        className="btn"
                        style={{
                          border: 'none',
                          padding: '5px 4px 0',
                          minWidth: 'auto',
                        }}
                        onClick={() => speak(ex.pt, 'pt-PT')}
                        title="Listen to Portuguese example"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </ul>
          ) : null}

          {/* Display conjugations */}
          {showBack && active?.conjugations && (
            <div
              className="conjugations-container"
              style={{
                marginTop: 16,
                borderTop: '1px solid #ddd',
                paddingTop: 12,
                textAlign: 'left',
                fontSize: '0.95rem',
                paddingLeft: '1rem',
              }}
            >
              {Object.entries(active.conjugations).map(([tense, data]) => {
                if (!data) return null;

                // Handle nested past (perfeito / imperfeito)
                if (
                  tense === 'past' &&
                  typeof data === 'object' &&
                  ('perfeito' in data || 'imperfeito' in data)
                ) {
                  const d = data as {
                    perfeito?: Record<string, string>;
                    imperfeito?: Record<string, string>;
                  };

                  return (
                    <div
                      key={tense}
                      style={{
                        marginBottom: 24,
                        paddingBottom: 16,
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      {d.perfeito && (
                        <>
                          <h4 style={{ margin: '6px 0', color: '#333' }}>
                            Past (Perfeito)
                          </h4>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(120px, 1fr) 2fr',
                              columnGap: 16,
                              rowGap: 4,
                              fontFamily: 'system-ui, sans-serif',
                            }}
                          >
                            {Object.entries(d.perfeito).map(([form, val]) => (
                              <React.Fragment key={form}>
                                <span style={{ opacity: 0.8 }}>{form}</span>
                                <b>{val}</b>
                              </React.Fragment>
                            ))}
                          </div>
                        </>
                      )}

                      {d.imperfeito && (
                        <>
                          <h4 style={{ margin: '10px 0 6px', color: '#333' }}>
                            Past (Imperfeito)
                          </h4>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'minmax(120px, 1fr) 2fr',
                              columnGap: 16,
                              rowGap: 4,
                              fontFamily: 'system-ui, sans-serif',
                            }}
                          >
                            {Object.entries(d.imperfeito).map(([form, val]) => (
                              <React.Fragment key={form}>
                                <span style={{ opacity: 0.8 }}>{form}</span>
                                <b>{val}</b>
                              </React.Fragment>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }

                // Normal simple tenses (present, future, simple past)
                const simple = data as Record<string, string>;
                const label = tense.charAt(0).toUpperCase() + tense.slice(1);

                return (
                  <div
                    key={tense}
                    style={{
                      marginBottom: 24,
                      paddingBottom: 16,
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <h4 style={{ margin: '6px 0', color: '#333' }}>{label}</h4>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(120px, 1fr) 2fr',
                        columnGap: 16,
                        rowGap: 4,
                        fontFamily: 'system-ui, sans-serif',
                      }}
                    >
                      {Object.entries(simple).map(([form, val]) => (
                        <React.Fragment key={form}>
                          <span style={{ opacity: 0.8 }}>{form}</span>
                          <b>{val}</b>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginTop: 16,
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={onPrev}
              style={{ flex: '1 1 auto', minWidth: 70 }}
            >
              Back
            </button>
            <button
              type="button"
              className="btn"
              onClick={onShuffle}
              title="Shuffle cards in current session"
              style={{ flex: '0 0 auto' }}
            >
              <Shuffle size={18} />
            </button>
            <button
              type="button"
              className="btn"
              onClick={onStop}
              style={{ flex: '1 1 auto', minWidth: 70 }}
            >
              Stop
            </button>
            <button
              type="button"
              className="btn"
              onClick={onNext}
              style={{ flex: '1 1 auto', minWidth: 70 }}
            >
              Next
            </button>

            <div
              className="jump"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexBasis: '100%',
                justifyContent: 'center',
                marginTop: 4,
              }}
            >
              <span className="muted" style={{ fontSize: '0.85rem' }}>
                Jump to:
              </span>
              <input
                type="number"
                value={gotoIndex ?? ''}
                className="input"
                min={1}
                max={sessionLength}
                placeholder="#"
                disabled={sessionLength === 0}
                onChange={(e) =>
                  onInput(e.target.value ? Number(e.target.value) : null)
                }
                onKeyDown={(e) => e.key === 'Enter' && onGoto()}
                style={{ width: 70 }}
              />
            </div>
          </div>

          <style>{`
            @media (min-width: 768px) {
              .conjugations-container {
                padding-left: 2.5rem !important;
              }
            }
          `}</style>
        </>
      ) : (
        <div className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
          No cards in session.
        </div>
      )}
    </div>
  );
}

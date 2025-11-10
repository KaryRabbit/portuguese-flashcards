import { Volume2 } from 'lucide-react';
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
  onStop,
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
                marginBottom: 8,
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  flexWrap: 'wrap',
                  gap: 8,
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
                    fontSize: '0.95rem',
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
              style={{
                marginTop: 16,
                borderTop: '1px solid #ddd',
                paddingTop: 12,
                textAlign: 'left',
                fontSize: '0.95rem',
                paddingLeft: '2.5rem',
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
                    <div key={tense} style={{ marginBottom: 12 }}>
                      {d.perfeito && (
                        <>
                          <h4 style={{ margin: '6px 0', color: '#333' }}>
                            Past (Perfeito)
                          </h4>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
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
                              gridTemplateColumns: '1fr 1fr',
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
                  <div key={tense} style={{ marginBottom: 12 }}>
                    <h4 style={{ margin: '6px 0', color: '#333' }}>{label}</h4>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
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

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button type="button" className="btn" onClick={onPrev}>
              Back
            </button>
            <button type="button" className="btn" onClick={onStop}>
              Stop
            </button>
            <button type="button" className="btn" onClick={onNext}>
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
          No cards in session.
        </div>
      )}
    </div>
  );
}

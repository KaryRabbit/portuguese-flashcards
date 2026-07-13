import { Volume2 } from 'lucide-react';
import type { Card } from '../flashcard-types';
import { isSpeechSupported, speak } from '../utils/speech';

interface WordOfTheDayProps {
  card: Card | null;
}

export function WordOfTheDay({ card }: WordOfTheDayProps) {
  if (!card) return null;

  const example = card.examples?.[0];

  return (
    <div className="wotd">
      <div className="wotd-label">Word of the day</div>
      <div className="wotd-body">
        <span className="wotd-en">{card.front}</span>
        <span className="wotd-sep">—</span>
        <span className="wotd-pt">{card.back}</span>
        {isSpeechSupported() && (
          <button
            type="button"
            className="btn wotd-audio"
            onClick={() => speak(card.back, 'pt-PT')}
            aria-label="Listen to pronunciation"
            title="Listen"
          >
            <Volume2 size={16} />
          </button>
        )}
      </div>
      {example && (
        <div className="wotd-example muted small-text">{example.pt}</div>
      )}
    </div>
  );
}

/**
 * Text-to-Speech utility using Web Speech API
 * Free, works offline, no API keys needed
 */

// iOS/Safari (and Chrome) load voices asynchronously: getVoices() returns an
// empty array on the first call until the `voiceschanged` event fires. We cache
// the latest non-empty result so the very first tap doesn't fall back to the
// wrong (often English) voice for Portuguese text.
let cachedVoices: SpeechSynthesisVoice[] = [];

const refreshVoices = (): SpeechSynthesisVoice[] => {
  const v = window.speechSynthesis.getVoices();
  if (v.length) cachedVoices = v;
  return cachedVoices;
};

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  // Keep the cache warm as the system finishes loading voices.
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
}

const pickVoice = (lang: string): SpeechSynthesisVoice | null => {
  const langVoices = cachedVoices.filter((v) => v.lang === lang);
  if (!langVoices.length) return null;

  // Preferred high-quality voices per platform. 'Joana' is the iOS
  // European-Portuguese voice; the English names cover en-* playback.
  const preferredNames = [
    'Joana',
    'Samantha',
    'Alex',
    'Karen',
    'Victoria',
    'Daniel',
    'Google',
  ];
  for (const name of preferredNames) {
    const match = langVoices.find((v) => v.name.includes(name));
    if (match) return match;
  }
  return langVoices.find((v) => v.default) || langVoices[0];
};

const speakNow = (text: string, lang: string, rate: number) => {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // English sounds better at normal speed
  const speechRate = lang.startsWith('en') ? 1.0 : rate;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = speechRate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voice = pickVoice(lang);
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
};

export const speak = (
  text: string,
  lang: string = 'pt-PT',
  rate: number = 0.8
) => {
  // Check if browser supports speech synthesis
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }

  // If voices haven't loaded yet (common on first interaction in iOS), wait for
  // them once before speaking so we don't lock in the wrong voice.
  if (!refreshVoices().length) {
    let spoken = false;
    const speakOnce = () => {
      if (spoken) return;
      spoken = true;
      window.speechSynthesis.removeEventListener('voiceschanged', speakOnce);
      speakNow(text, lang, rate);
    };
    window.speechSynthesis.addEventListener('voiceschanged', speakOnce);
    // Fallback: some engines never emit the event again — speak anyway shortly.
    setTimeout(speakOnce, 250);
    return;
  }

  speakNow(text, lang, rate);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeechSupported = () => {
  return 'speechSynthesis' in window;
};

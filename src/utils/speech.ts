/**
 * Text-to-Speech utility using Web Speech API
 * Free, works offline, no API keys needed
 */

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

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeechSupported = () => {
  return 'speechSynthesis' in window;
};

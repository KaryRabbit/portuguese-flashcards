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

  // English sounds better at normal speed
  const speechRate = lang.startsWith('en') ? 1.0 : rate;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = speechRate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Select better quality voice, prefer standard voices
  const voices = window.speechSynthesis.getVoices();
  const langVoices = voices.filter((v) => v.lang === lang);

  // Try each preferred voice in order
  const preferredNames = [
    'Samantha',
    'Alex',
    'Karen',
    'Victoria',
    'Daniel',
    'Google',
  ];
  let voice = null;
  for (const name of preferredNames) {
    voice = langVoices.find((v) => v.name.includes(name));
    console.log(voice);
    if (voice) break;
  }
  if (!voice) voice = langVoices.find((v) => v.default) || langVoices[0];
  if (voice) utterance.voice = voice;

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

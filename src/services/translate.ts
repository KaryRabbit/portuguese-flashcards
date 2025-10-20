export async function translateToPtEU(text: string): Promise<string> {
  const q = text.trim();
  if (!q) return '';
  // 1) LibreTranslate (public instance; rate-limited; may be down)
  try {
    const r = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, source: 'en', target: 'pt', format: 'text' }),
    });
    if (r.ok) {
      const d = await r.json();
      if (d?.translatedText) return d.translatedText as string; // returns pt-BR style sometimes
    }
  } catch {
    /* empty */
  }

  // 2) MyMemory (free; includes EU lexicon; add &de=youremail for higher limits)
  try {
    const r = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        q
      )}&langpair=en|pt-PT`
    );
    if (r.ok) {
      const d = await r.json();
      const t = d?.responseData?.translatedText as string | undefined;
      if (t) return t;
    }
  } catch {
    /* empty */
  }

  return q; // fallback to original if all fail
}

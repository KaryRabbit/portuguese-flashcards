// import cors from 'cors';
// import express from 'express';
// import OpenAI from 'openai';

// const app = express();
// app.use(cors());
// app.use(express.json());

// // ✅ Use your environment variable
// const client = new OpenAI({
//   apiKey:
//     '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',
// });

// interface ExamplePair {
//   en: string;
//   pt: string;
// }

// interface Item {
//   en: string;
//   pt: string;
//   examples: ExamplePair[];
// }

// interface Payload {
//   items: Item[];
// }

// // Utility: delay helper for mild retry
// const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// // 🔹 GPT-only translator
// async function gptBatch(words: string[]): Promise<Item[]> {
//   const prompt = `Translate the following English words into **European Portuguese (pt-PT)**.
// For each word, provide exactly 2 short, natural bilingual example sentences.

// Return STRICT JSON:
// {
//   "items": [
//     {
//       "en": "word",
//       "pt": "translation in pt-PT",
//       "examples": [
//         { "en": "English sentence", "pt": "Portuguese sentence" },
//         { "en": "English sentence", "pt": "Portuguese sentence" }
//       ]
//     }
//   ]
// }

// Rules:
// - Use ONLY European Portuguese (avoid Brazilian terms like "você" or "pegar").
// - Keep sentences natural and short.
// - No markdown, no explanations, just valid JSON.

// Words: ${JSON.stringify(words)}
// `;

//   let attempt = 0;
//   while (attempt < 3) {
//     try {
//       const res = await client.chat.completions.create({
//         model: 'gpt-4o-mini',
//         temperature: 0.2,
//         messages: [
//           {
//             role: 'system',
//             content:
//               'You are a precise European Portuguese translator. Respond ONLY with valid JSON.',
//           },
//           { role: 'user', content: prompt },
//         ],
//       });

//       const text = res.choices[0]?.message?.content ?? '{"items":[]}';
//       const parsed = JSON.parse(text) as Payload;
//       return parsed.items ?? [];
//     } catch (err: any) {
//       console.error(`⚠️ GPT attempt ${attempt + 1} failed:`, err.message);
//       attempt++;
//       if (attempt >= 3) throw err;
//       await sleep(600 * attempt);
//     }
//   }

//   return [];
// }

// // Helper: small chunking to keep token size safe
// function chunk<T>(arr: T[], size = 40): T[][] {
//   const out: T[][] = [];
//   for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
//   return out;
// }

// // 🔹 API route
// app.post('/api/en2pt/batch', async (req: Request, res: Response) => {
//   const words =
//     (req.body?.words as string[] | undefined)
//       ?.map((w) => String(w).trim())
//       .filter(Boolean) ?? [];

//   if (words.length === 0)
//     return res.status(400).json({ error: 'words[] required' });

//   try {
//     const parts = chunk(words, 40);
//     const results: Item[] = [];

//     for (const p of parts) {
//       const got = await gptBatch(p);
//       console.log(`✅ Translated ${p.length} words`);
//       results.push(...got);
//     }

//     return res.json({ items: results });
//   } catch (e: any) {
//     console.error('❌ GPT translation failed:', e.message);
//     return res.status(500).json({
//       error: 'Translation failed',
//       details: e.message,
//     });
//   }
// });

// const PORT = process.env.PORT || 8787;
// app.listen(PORT, () =>
//   console.log(`🚀 API running on http://localhost:${PORT}`)
// );

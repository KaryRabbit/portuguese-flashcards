# Portuguese Flashcards App

A modern, lightweight flashcard application for learning European Portuguese, built with React, TypeScript, and Vite.

## Screenshots

### Study Mode

![Study Mode - Card View](docs/screenshots/study-mode.png)
*Interactive flashcard study with audio pronunciation*

### Manage Mode

![Manage Mode - Card List](docs/screenshots/manage-mode.png)
*Card management with search, filter, and import/export*

## Features

- **Study Mode**: Interactive flashcard practice with EN↔PT translation support
- **Audio Pronunciation**: Built-in text-to-speech for both English and Portuguese
- **Smart Session Management**: Persist study sessions across browser refreshes
- **Card Management**: Add, edit, search, filter, and organize flashcards
- **Rich Card Types**: Support for nouns, verbs (regular/irregular), adjectives, expressions, and more
- **Examples & Conjugations**: Store example sentences and verb conjugations
- **Import/Export**: Import from CSV/JSON and export to CSV
- **Pagination & Sorting**: Efficient table with TanStack Table
- **Local Storage**: All data stored locally in browser (no backend required)
- **Single-File Build**: Compiles to a single HTML file for easy distribution

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite 7** - Build tool & dev server
- **TanStack Table** - Table management
- **vite-plugin-singlefile** - Single HTML output

## Project Structure

```plaintext
src/
├── components/
│   ├── StudyMode.tsx       # Study interface with card flipping
│   ├── ManageMode.tsx      # Card management & import/export
│   └── CardTable.tsx       # Sortable, paginated table
├── hooks/
│   ├── useFlashcards.ts    # Card CRUD operations
│   └── useSession.ts       # Study session state
├── utils/
│   ├── storage.ts          # localStorage helpers
│   ├── debounce.ts         # Performance optimization
│   └── speech.ts           # Text-to-speech audio
├── flashcard-types.ts      # TypeScript types
├── App.tsx                 # Main app component
├── main.tsx                # Entry point
└── index.css               # Global styles
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Build

```bash
npm run build
```

Creates a single `dist/index.html` file (270KB gzipped to ~82KB)

### Preview Production Build

```bash
npm run preview
```

## Usage

### Adding Cards

1. Click **Manage** tab
2. Fill in English & Portuguese (EU) translations
3. Select word type (noun, verb, etc.)
4. Optionally add examples: `English sentence | Portuguese sentence`
5. Click **Add**

### Studying

1. Select cards using checkboxes in Manage mode
2. Click **Start session (selected)** or **Start session (all)**
3. Click **Study** tab
4. Click cards to flip between languages
5. Use **Next/Back** buttons to navigate
6. Toggle **EN → PT** or **PT → EN** mode

### Import / Export

#### CSV Import

The app supports importing cards from a CSV file.

**Format (one card per line):**

```csv
english,portuguese,type,example_en,example_pt,present,past_perfeito,past_imperfeito,future


### Search & Filter

- Search by English/Portuguese text or examples
- Filter by word type (noun, verb, adjective, etc.)
- Show only selected cards

## Performance Optimizations

- **Debounced Saves**: localStorage writes batched to reduce I/O (500ms)
- **Memoized Filtering**: Efficient search/filter with React.useMemo
- **Code Splitting**: Components separated for better tree-shaking
- **Single File Build**: No network requests after initial load

## Data Storage

All data stored in `localStorage`:

| Key | Purpose |
|-----|---------|
| `flashcards-min-v1` | Card collection |
| `flashcards-session-v1` | Active study session |
| `flashcards-selected-v1` | Selected card IDs |
| `flashcards-page-size` | Table pagination preference |

## Card Schema

```typescript
interface Card {
  id: string;
  front: string;                    // English
  back: string;                     // Portuguese (EU)
  type?: WordType;                  // noun, verb-regular, etc.
  examples?: ExamplePair[];         // Bilingual examples
  conjugations?: Conjugations;      // Optional verb conjugations (present / past / future)
  createdAt?: number;               // Timestamp
}
```

## Browser Support

Modern browsers with ES2020+ support:

- Chrome/Edge 80+
- Firefox 75+
- Safari 13.1+

## Audio Pronunciation

Uses the Web Speech API for text-to-speech:

- Free and built into browsers
- Works offline after initial page load
- Supports European Portuguese (pt-PT) and English (en-US)

## Development

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

Made with ❤️ for Portuguese learners

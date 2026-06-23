# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Meeting Bingo — a browser-based bingo game that listens for corporate/agile/tech buzzwords during meetings using the Web Speech API. Zero backend. Client-side only. Deployed to Vercel free tier.

## Commands

```bash
npm run dev          # Vite dev server on port 3000
npm run build        # tsc + vite build → dist/
npm run preview      # Preview the production build locally
npm run lint         # ESLint over .ts/.tsx files
npm run typecheck    # tsc --noEmit (no emit, types only)
```

The app has no test suite yet. Manual testing checklist is in `meeting-bingo-architecture.md`.

## Architecture

### Screen state machine (`src/App.tsx`)

```
'landing' → 'category' → 'game' → 'win'
```

`App.tsx` owns `GameState` and renders one screen at a time. State is passed down as typed `GameAction` dispatch callbacks — **not** raw setters and **not** React Context. The plan deliberately omits `GameContext` for MVP to avoid dual state-ownership hazards.

### Auto-fill data pipeline (`src/components/GameBoard.tsx`)

```
useSpeechRecognition.lastFinalChunk
  → detectWordsWithAliases(chunk, cardWords, alreadyFilled)   ← chunk only, not full transcript
  → autoFillWords(detectedWords)
  → checkForBingo(card)
  → onWin(winningLine)
```

### Key constraints baked into the design

- **`filledCount` is not stored in `GameState`** — always derived at render via `countFilled(card)` from `src/lib/bingoChecker.ts` to prevent state drift.
- **`detectWords` receives each finalized utterance chunk**, not the cumulative transcript. The cumulative transcript is only for display. Running detection on the full string degrades O(n) per utterance over a long meeting.
- **`isListening` lives in a `useRef`** inside `useSpeechRecognition`, not React state. The `onend` auto-restart handler reads it synchronously and calls `recognition.start()` directly — putting this in a `setState` updater causes double-start bugs in React 18 Strict Mode.
- **`useLocalStorage` must strip transcript fields** before serializing `GameState`. Transcript text is never written to disk.
- **Phrase matching in `wordDetector.ts` uses regex word-boundary assertions** (`/\bcircle back\b/i`), not `String.includes()` — "circle backbone" would otherwise match "circle back".
- **`WORD_ALIASES` must not include `'interface'`** — too common in ordinary English speech, produces constant false positives.
- **Auto-filled squares use a `pulse-once` Tailwind animation** (`animation-iteration-count: 1`, ~500ms) — the standard Tailwind `animate-pulse` runs infinitely and becomes distracting in long meetings.
- **Privacy copy on `LandingPage`** must read: *"Audio processed by your browser's built-in speech API. On Chrome, this uses Google's speech servers. This app never stores your audio."* Do not write "processed locally" — Chrome sends audio to Google.

### Required file: `src/lib/utils.ts`

Every component imports `cn()` from here. Create it before any component:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

### `useSpeechRecognition` initialization

The `SpeechRecognition` constructor must be looked up **inside a `useEffect`** with a `typeof window !== 'undefined'` guard — never at module import time. Module-level evaluation crashes Vitest/JSDOM and bypasses TypeScript safety via `any`. Type the ref as `InstanceType<typeof window.SpeechRecognition>` using `@types/dom-speech-recognition`.

### BingoCard accessibility requirements

- Container: `role="grid"`, `aria-label="Bingo card"`
- Each square: `role="gridcell"`, `aria-label="{word} — filled|empty"`, `aria-pressed`
- Arrow-key navigation between cells; Enter/Space fills focused square
- Filled/winning states must have a secondary indicator beyond color (SVG checkmark) — color-alone fails WCAG 2.1 SC 1.4.1

### P1 / P2 split

Phase 4 components are split by build priority. **P2 items are safe to drop if behind schedule** — the core bingo loop works without them:

- **P2**: `Toast.tsx` (queue management), `TranscriptPanel.tsx` (can be minimal), WinScreen stats display

## Reference docs

- `meeting-bingo-prd.md` — product requirements and acceptance criteria
- `meeting-bingo-architecture.md` — full architecture with type definitions and reference implementations
- `meeting-bingo-uxr.md` — UX research, storyboards, and design principles
- `IMPLEMENTATION_PLAN.md` — step-by-step build plan incorporating all review findings

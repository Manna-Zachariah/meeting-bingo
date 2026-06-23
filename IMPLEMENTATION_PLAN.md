# Meeting Bingo — Implementation Plan

Based on: `meeting-bingo-prd.md`, `meeting-bingo-architecture.md`, `meeting-bingo-uxr.md`

**Stack**: React 18 + TypeScript, Vite, Tailwind CSS, canvas-confetti, Web Speech API  
**Deployment**: Vercel free tier  
**Constraint**: Zero backend — fully client-side, no auth, no database

**Time budget**: ~100 min total. Items marked **[P2]** are safe to skip if running behind — the core bingo loop works without them.

---

## Phase 1 — Project Setup (~15 min)

1. Scaffold project in-place: `npm create vite@latest . -- --template react-ts`
2. Install dependencies:
   - `npm install canvas-confetti clsx tailwind-merge`
   - `npm install -D tailwindcss postcss autoprefixer @types/canvas-confetti @types/dom-speech-recognition`
3. Configure Tailwind: `npx tailwindcss init -p`, wire into `src/index.css`
4. Add custom animation keyframes to `tailwind.config.js`:
   - `bounceIn`, `pulse-fast`
   - `pulse-once` — identical to pulse but with `animation-iteration-count: 1` (~500ms, used for auto-filled squares instead of infinite pulse)
5. Create directory structure:
   ```
   src/
   ├── components/
   │   └── ui/
   ├── hooks/
   ├── lib/
   ├── data/
   └── types/
   ```

---

## Phase 2 — Types, Data & Core Logic (~25 min)

6. **`src/lib/utils.ts`** — Create `cn()` helper (required by all components — create this first to avoid build errors):
   ```ts
   import { clsx, type ClassValue } from 'clsx';
   import { twMerge } from 'tailwind-merge';
   export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
   ```

7. **`src/types/index.ts`** — Define all shared interfaces:
   - `CategoryId` (`'agile' | 'corporate' | 'tech'`)
   - `BingoSquare` (id, word, isFilled, isAutoFilled, isFreeSpace, filledAt, row, col)
   - `BingoCard` (squares 5×5, words flat list)
   - `GameState` (status, category, card, isListening, startedAt, completedAt, winningLine, winningWord) — **omit `filledCount`; it is derived at render via `countFilled()` to prevent state drift**
   - `WinningLine` (type, index, squares)
   - `SpeechRecognitionState`, `Toast`
   - `GameAction` — discriminated union for all state mutations (replaces raw setter props — see Phase 5)

8. **`src/data/categories.ts`** — Static buzzword lists for all three categories (40+ words each):
   - `agile`: sprint, backlog, standup, retrospective, velocity, blocker, story points, epic…
   - `corporate`: synergy, leverage, circle back, take offline, bandwidth, low-hanging fruit…
   - `tech`: API, cloud, microservices, kubernetes, CI/CD, DevOps, observability…

9. **`src/lib/cardGenerator.ts`**
   - Fisher-Yates shuffle on category word list
   - Pick 24 words, build 5×5 `BingoSquare[][]`
   - Free space pre-filled at center position `[2][2]`

10. **`src/lib/bingoChecker.ts`**
    - `checkForBingo(card)` — checks all 12 lines (5 rows + 5 cols + 2 diagonals), returns first `WinningLine` or `null`
    - `countFilled(card)` — returns number of filled squares; call this at render time rather than tracking a `filledCount` field in state
    - `getClosestToWin(card)` — returns `{ squaresNeeded: number, lineType: string }` for the nearest incomplete line; used to trigger the "One away!" banner in `GameBoard`

11. **`src/lib/wordDetector.ts`**
    - `detectWords(utterance, cardWords, alreadyFilled)` — accepts a **single finalized utterance chunk**, not the cumulative transcript, to avoid O(n²) scan degradation over a 30-minute meeting
    - Single-word matching: regex `\b`-bounded
    - Multi-word phrase matching: regex with word-boundary assertions (e.g. `/\bcircle back\b/i`) — **not** `String.includes()`, to prevent "circle backbone" matching "circle back"
    - `WORD_ALIASES` — maps card abbreviations to spoken variants:
      - `CI/CD → ['ci cd', 'cicd']`
      - `MVP → ['minimum viable product']`
      - `ROI → ['return on investment']`
      - `API → ['a p i']`
      - `DevOps → ['dev ops']`
      - **Do not alias `interface`** — it is too common in ordinary speech and will produce constant false positives
    - `detectWordsWithAliases()` — runs base detection + alias lookup

12. **`src/lib/shareUtils.ts`**
    - Build text summary (time to bingo, winning word, squares filled, category, app link)
    - Try Web Share API on mobile, fall back to `navigator.clipboard` on desktop
    - Return `{ status: 'shared' | 'copied' | 'error' }` so the Share button can display the correct feedback state

---

## Phase 3 — Hooks (~20 min)

13. **`src/hooks/useSpeechRecognition.ts`**
    - Type `recognitionRef` as `InstanceType<typeof window.SpeechRecognition>` using `@types/dom-speech-recognition` — not `any`
    - Instantiate the `SpeechRecognition` constructor **inside a `useEffect`** with a `typeof window !== 'undefined'` guard — never at module import time (crashes Vitest/JSDOM and bypasses TypeScript safety)
    - `continuous = true`, `interimResults = true`, `lang = 'en-US'`
    - Track `isListening` in a `useRef`, not state, so the `onend` handler reads it synchronously; call `recognition.start()` directly inside `onend` — **do not** call `setState` from inside `onend`, as this causes double-start bugs in React 18 Strict Mode
    - Fire `onResult` callback only on finalized chunks (`isFinal === true`); pass the **chunk string**, not the cumulative transcript
    - Exposes: `{ isSupported, isListening, lastFinalChunk, interimTranscript, error, startListening, stopListening }`

14. **`src/hooks/useGame.ts`**
    - Accepts typed `GameAction` dispatch, not a raw `setGame` setter
    - `fillSquare(row, col)`, `autoFillWords(words[])`, `resetGame()`
    - Calls `checkForBingo` after every fill and fires `onWin(line: WinningLine)` — type the callback as `(line: WinningLine) => void`, not `any`
    - Passes `alreadyFilled` Set to `detectWords` so a spoken word never double-triggers

15. **`src/hooks/useLocalStorage.ts`**
    - Generic `[value, setValue]` hook that syncs state to `localStorage`
    - When persisting `GameState`, **strip all transcript fields** before serializing — transcript text is never written to disk
    - Used by `useGame` to persist card state and game status across page refreshes

---

## Phase 4 — UI Components (~40 min)

16. **`src/components/ui/Button.tsx`** [P1] — Base button with `primary`, `secondary`, `ghost` variants

17. **`src/components/ui/Toast.tsx`** [P2] — Auto-dismissing notification queue:
    - Max 3 toasts visible simultaneously, vertically stacked, newest at top
    - 3s auto-dismiss per toast
    - Group buzzwords detected in the same utterance into a single toast: "Detected: sprint, backlog"

18. **`src/components/LandingPage.tsx`** [P1]
    - Hero: "🎯 MEETING BINGO" title, tagline, "New Game" CTA
    - Privacy note — use this exact copy: **"Audio processed by your browser's built-in speech API. On Chrome, this uses Google's speech servers. This app never stores your audio."**
    - Do not write "Audio processed locally. Never recorded." — factually incorrect on Chrome, which sends audio to Google's servers
    - "How It Works" 4-step section

19. **`src/components/CategorySelect.tsx`** [P1]
    - 3 category cards: Agile / Corporate / Tech (emoji used for decoration only; structural icons use SVG)
    - Each card shows icon, name, description, sample words
    - Selecting a category triggers card generation and transitions to the game screen

20. **`src/components/BingoSquare.tsx`** [P1] — Wrapped in `React.memo`
    - States use both color and a secondary visual indicator — never color alone (WCAG 2.1 SC 1.4.1):
      - Default: `bg-white border-gray-200`
      - Filled (manual or auto): `bg-blue-500 text-white` + SVG checkmark icon — verify ≥4.5:1 contrast ratio
      - Free space: `bg-amber-100 border-amber-300`, non-clickable, `aria-disabled="true"`
      - Winning: `bg-green-500 ring-2 ring-green-300` + SVG checkmark + thicker ring — verify ≥4.5:1 contrast ratio
      - Auto-filled: additionally receives `pulse-once` class on fill (single 500ms animation cycle, not infinite)
    - Long buzzword overflow: `text-xs leading-tight overflow-hidden line-clamp-3`
    - ARIA: `role="gridcell"`, `aria-label="{word} — {filled|empty}"`, `aria-pressed` reflecting filled state

21. **`src/components/BingoCard.tsx`** [P1]
    - 5×5 grid of `BingoSquare` components, container has `role="grid"` and `aria-label="Bingo card"`
    - Keyboard navigation: arrow keys move focus between cells; Enter or Space fills the focused square
    - Each square receives a stable `useCallback` `onClick` handler — not inline arrow functions — to prevent unnecessary re-renders
    - Derives `isWinningSquare` per square from `winningLine.squares`

22. **`src/components/TranscriptPanel.tsx`** [P2]
    - Idle state (before mic started): render placeholder text "Tap 'Start Listening' to detect buzzwords automatically"
    - Active: SVG mic icon pulsing red when listening, grey when paused
    - Shows last ~100 characters of the finalized transcript + italic interim text
    - Detected word chips: use the detected word string as React `key` (not array index)
    - `aria-live="polite"` on the detected words list so screen readers announce new detections

23. **`src/components/GameControls.tsx`** [P1]
    - "Start / Stop Listening" toggle — disabled with tooltip if `isSupported === false`
    - "New Card" button — **show a confirmation dialog before resetting if a game is in progress**; skip the guard if the game has not started yet

24. **`src/components/GameBoard.tsx`** [P1]
    - Header row: SVG logo, mic status indicator, `X/24 squares filled` counter (computed via `countFilled(card)`, not from state), **"← Back to Categories"** button that returns to `CategorySelect` without resetting the current card
    - Near-bingo hint: when `getClosestToWin(card).squaresNeeded === 1`, display an amber banner reading "One away!" above the card
    - Assembles `BingoCard` + `TranscriptPanel` + `GameControls`
    - Auto-fill pipeline:
      ```
      useSpeechRecognition.lastFinalChunk
        → detectWordsWithAliases(chunk, cardWords, alreadyFilled)
        → autoFillWords(detectedWords)
        → checkForBingo(card)
        → onWin(winningLine)
      ```
    - All callbacks passed to child components are stabilized with `useCallback`

25. **`src/components/WinScreen.tsx`** [P1]
    - Confetti on mount — wrap with `prefers-reduced-motion` check:
      ```ts
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) confetti(…)
      ```
    - Shows the winning card with the winning line highlighted in green
    - Stats [P2]: time to BINGO, winning word, squares filled, category
    - **"Play Again"** → navigates to `CategorySelect` (not landing — saves the extra click)
    - **"Home"** → navigates to landing
    - Share button states: idle → loading spinner → "Copied!" on success → "Share failed" on error (driven by `shareUtils` return value)

---

## Phase 5 — App Wiring (~10 min)

26. **State architecture** — No `GameContext` for MVP. Prop-drill typed `GameAction` dispatch callbacks instead of raw state setters. Using both Context and raw setters simultaneously creates two competing mutation patterns with no clear state owner. Add Context only if prop depth grows beyond three levels post-MVP.

27. **`src/App.tsx`** — Top-level screen state machine:
    ```
    'landing' → 'category' → 'game' → 'win'
    ```
    - Holds `GameState`
    - Renders one screen at a time, passes typed `GameAction` dispatch (not raw setter) to children
    - Wire `useLocalStorage` here to persist `GameState` — explicitly exclude transcript fields from the serialized object

28. **`src/main.tsx`** — Mount `<App />`

---

## Phase 6 — Polish & Deploy (~10 min)

29. **Responsive pass** — verify 5×5 grid renders correctly on mobile (minimum tap-target size, `text-xs` on small screens, landscape orientation)

30. **Accessibility pass** — verify `role="grid"` / `role="gridcell"` on BingoCard, arrow-key navigation, color contrast ratios ≥4.5:1 on all square states, `aria-live="polite"` on TranscriptPanel, `prefers-reduced-motion` confetti guard

31. **Firefox fallback** — if `isSupported === false`, hide the mic toggle and render a **sticky banner above the BingoCard** (not inline in the card — prevents layout overlap): "Manual mode — tap squares yourself"

32. **`vercel.json`** — SPA rewrite rule so direct URL loads work:
    ```json
    { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
    ```

33. **Deploy** — push to GitHub and connect Vercel project, or run `vercel --prod`

---

## Key Constraints

| Constraint | Detail |
|-----------|--------|
| Browser speech privacy | On Chrome, Web Speech API sends audio to Google's servers for processing. This app never records or stores audio itself. State this clearly on the landing screen — do not claim local processing. |
| No double-fills | Pass an `alreadyFilled` Set to `detectWords` on every call so a repeated buzzword doesn't re-trigger. |
| Chunk-only detection | Run `detectWords` on each new finalized utterance chunk, not the full cumulative transcript, to prevent performance degradation in long meetings. |
| Firefox fallback | `SpeechRecognition` is behind a flag in Firefox. Detect at startup and degrade gracefully — the card and bingo logic must work without speech. |
| MVP scope lock | Multiplayer, custom word lists, sound effects, dark mode, and game history are explicitly out of scope. |
| No transcript persistence | `useLocalStorage` must strip all transcript fields from persisted state. |

---

## Out of Scope (MVP)

- User accounts / authentication
- Multiplayer real-time sync
- Custom buzzword creation — the "CUSTOM ✏️" category card in the UXR storyboards is a post-MVP feature; do not implement in this session
- "Invite Others" button visible in UXR storyboards — post-MVP; do not implement
- Sound effects
- Dark mode
- Game history beyond current session
- Leaderboards
- Calendar integration
- Rich link previews — the Share feature produces plain text only; Open Graph meta tags are a post-MVP enhancement

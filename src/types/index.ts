export type CategoryId = 'agile' | 'corporate' | 'tech';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
  sampleWords: string[];
  words: string[];
}

export interface BingoSquare {
  id: string;
  word: string;
  isFilled: boolean;
  isAutoFilled: boolean;
  isFreeSpace: boolean;
  filledAt: number | null;
  row: number;
  col: number;
}

export interface BingoCard {
  squares: BingoSquare[][];
  words: string[];
}

export type GameStatus = 'idle' | 'playing' | 'won';

export interface WinningLine {
  type: 'row' | 'column' | 'diagonal';
  index: number;
  squares: string[];
}

// filledCount is intentionally omitted — derived at render via countFilled() to prevent state drift
export interface GameState {
  status: GameStatus;
  category: CategoryId | null;
  card: BingoCard | null;
  isListening: boolean;
  startedAt: number | null;
  completedAt: number | null;
  winningLine: WinningLine | null;
  winningWord: string | null;
}

export interface SpeechRecognitionState {
  isSupported: boolean;
  isListening: boolean;
  lastFinalChunk: string;
  interimTranscript: string;
  error: string | null;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  duration?: number;
}

export type GameAction =
  | { type: 'START_GAME'; category: CategoryId; card: BingoCard }
  | { type: 'FILL_SQUARE'; row: number; col: number; isAutoFilled: boolean }
  | { type: 'WIN'; winningLine: WinningLine; winningWord: string }
  | { type: 'SET_LISTENING'; isListening: boolean }
  | { type: 'RESET' };

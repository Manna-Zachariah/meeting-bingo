import { useEffect, useRef } from 'react';
import { GameState, WinningLine, GameAction } from '../types';
import { detectWordsWithAliases } from '../lib/wordDetector';
import { countFilled, getClosestToWin } from '../lib/bingoChecker';
import { BingoCard } from './BingoCard';
import { GameControls } from './GameControls';
import { TranscriptPanel } from './TranscriptPanel';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useGame } from '../hooks/useGame';

interface GameBoardProps {
  game: GameState;
  dispatch: (action: GameAction) => void;
  onWin: (line: WinningLine, winningWord: string) => void;
  onNewCard: () => void;
  onBack: () => void;
}

export function GameBoard({ game, dispatch, onWin, onNewCard, onBack }: GameBoardProps) {
  const speech = useSpeechRecognition();
  const { fillSquare, autoFillWords, alreadyFilled, resetAlreadyFilled } = useGame(
    game,
    dispatch,
    onWin,
  );

  // Refs so the speech effect only re-runs on new chunks, not on every card update
  const autoFillWordsRef = useRef(autoFillWords);
  autoFillWordsRef.current = autoFillWords;
  const cardWordsRef = useRef(game.card?.words ?? []);
  cardWordsRef.current = game.card?.words ?? [];

  // Auto-fill pipeline: new speech chunk → detectWords → autoFillWords → checkBingo
  useEffect(() => {
    if (!speech.lastFinalChunk) return;
    const detected = detectWordsWithAliases(
      speech.lastFinalChunk,
      cardWordsRef.current,
      alreadyFilled,
    );
    if (detected.length > 0) {
      autoFillWordsRef.current(detected);
    }
  }, [speech.lastFinalChunk, alreadyFilled]);

  function handleToggleListen() {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.startListening();
    }
  }

  function handleNewCard() {
    if (speech.isListening) speech.stopListening();
    resetAlreadyFilled();
    onNewCard();
  }

  if (!game.card) return null;

  const filledCount = countFilled(game.card);
  const closest = getClosestToWin(game.card);
  const oneAway = closest?.squaresNeeded === 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          ← Back
        </button>
        <div className="text-sm font-medium text-gray-600">
          {filledCount - 1}/24 squares
        </div>
      </div>

      {/* Firefox / unsupported browser banner */}
      {!speech.isSupported && (
        <div className="mb-3 w-full max-w-sm rounded-lg bg-amber-50 border border-amber-300 px-4 py-2 text-center text-sm font-semibold text-amber-800">
          Manual mode — tap squares yourself
        </div>
      )}

      {/* One away banner */}
      {oneAway && (
        <div
          role="status"
          aria-live="polite"
          className="mb-3 w-full max-w-sm rounded-lg bg-amber-50 border border-amber-300 px-4 py-2 text-center text-sm font-semibold text-amber-800"
        >
          One away! 🎯
        </div>
      )}

      {/* Bingo card */}
      <div className="w-full max-w-sm mb-6">
        <BingoCard
          card={game.card}
          winningLine={game.winningLine}
          onSquareClick={fillSquare}
        />
      </div>

      {/* Controls */}
      <GameControls
        isListening={speech.isListening}
        isSupported={speech.isSupported}
        filledCount={filledCount}
        onToggleListen={handleToggleListen}
        onNewCard={handleNewCard}
      />

      {/* Error */}
      {speech.error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          Mic error: {speech.error}
        </p>
      )}

      {/* Transcript panel */}
      {(speech.isListening || speech.lastFinalChunk) && (
        <TranscriptPanel
          lastFinalChunk={speech.lastFinalChunk}
          interimTranscript={speech.interimTranscript}
        />
      )}
    </div>
  );
}

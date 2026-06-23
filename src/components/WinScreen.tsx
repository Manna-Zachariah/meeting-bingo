import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameState } from '../types';
import { countFilled } from '../lib/bingoChecker';
import { shareResult, formatDuration } from '../lib/shareUtils';
import { Button } from './ui/Button';

interface WinScreenProps {
  game: GameState;
  onPlayAgain: () => void;
  onHome: () => void;
}

type ShareStatus = 'idle' | 'loading' | 'copied' | 'shared' | 'error';

export function WinScreen({ game, onPlayAgain, onHome }: WinScreenProps) {
  const confettiFired = useRef(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');

  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  async function handleShare() {
    setShareStatus('loading');
    const result = await shareResult(game);
    setShareStatus(result.status);
    if (result.status === 'copied' || result.status === 'shared') {
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  }

  const filledCount = game.card ? countFilled(game.card) - 1 : 0;
  const timeTaken =
    game.startedAt && game.completedAt
      ? formatDuration(game.completedAt - game.startedAt)
      : null;

  const shareLabel = {
    idle: 'Share Result',
    loading: 'Sharing…',
    copied: 'Copied!',
    shared: 'Shared!',
    error: 'Share failed',
  }[shareStatus];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="text-6xl mb-4" aria-hidden="true">🎉</div>
      <h1 className="text-4xl font-extrabold text-green-700 mb-2">BINGO!</h1>
      {game.winningWord && (
        <p className="text-gray-600 mb-6">
          Winning word: <span className="font-semibold text-gray-800">"{game.winningWord}"</span>
        </p>
      )}

      {/* Stats */}
      <div className="flex gap-6 mb-8">
        <Stat label="Squares" value={`${filledCount}/24`} />
        {timeTaken && <Stat label="Time" value={timeTaken} />}
        {game.winningLine && (
          <Stat
            label="Win type"
            value={game.winningLine.type.charAt(0).toUpperCase() + game.winningLine.type.slice(1)}
          />
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          variant="primary"
          onClick={handleShare}
          disabled={shareStatus === 'loading'}
          className={shareStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : ''}
        >
          {shareLabel}
        </Button>
        <Button variant="secondary" onClick={onPlayAgain}>
          Play Again
        </Button>
        <Button variant="ghost" onClick={onHome}>
          Home
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold text-gray-800">{value}</span>
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

import { GameState } from '../types';
import { CATEGORIES } from '../data/categories';
import { countFilled } from './bingoChecker';

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function buildShareText(game: GameState): string {
  const category = CATEGORIES.find(c => c.id === game.category);
  const categoryName = category?.name ?? 'Unknown';
  const filled = game.card ? countFilled(game.card) - 1 : 0; // subtract free space
  const timeTaken =
    game.startedAt && game.completedAt
      ? formatDuration(game.completedAt - game.startedAt)
      : 'unknown';

  return [
    `🎯 BINGO! I won Meeting Bingo!`,
    `Category: ${categoryName}`,
    `Time: ${timeTaken}`,
    game.winningWord ? `Winning word: "${game.winningWord}"` : null,
    `Squares filled: ${filled}/24`,
    `Play at: meetingbingo.vercel.app`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function shareResult(
  game: GameState,
): Promise<{ status: 'shared' | 'copied' | 'error' }> {
  try {
    const text = buildShareText(game);

    if (navigator.share) {
      await navigator.share({ text });
      return { status: 'shared' };
    }

    await navigator.clipboard.writeText(text);
    return { status: 'copied' };
  } catch {
    return { status: 'error' };
  }
}

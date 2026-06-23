import { useCallback, useRef } from 'react';
import { BingoCard as BingoCardType, WinningLine } from '../types';
import { BingoSquare } from './BingoSquare';

interface BingoCardProps {
  card: BingoCardType;
  winningLine: WinningLine | null;
  onSquareClick: (row: number, col: number) => void;
}

export function BingoCard({ card, winningLine, onSquareClick }: BingoCardProps) {
  const winningIds = winningLine ? new Set(winningLine.squares) : new Set<string>();

  // Always-current ref — updated every render so stable handlers below never go stale
  const onSquareClickRef = useRef(onSquareClick);
  onSquareClickRef.current = onSquareClick;

  const cellRefs = useRef<(HTMLButtonElement | null)[][]>(
    Array.from({ length: 5 }, () => Array(5).fill(null)),
  );

  // Stable per-cell handlers created once — read from the ref so they always call
  // the latest onSquareClick regardless of how many times the prop identity changes
  const handleClicks = useRef(
    Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 5 }, (__, c) => () => onSquareClickRef.current(r, c)),
    ),
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number) => {
      let nextRow = row;
      let nextCol = col;

      if (e.key === 'ArrowUp') nextRow = Math.max(0, row - 1);
      else if (e.key === 'ArrowDown') nextRow = Math.min(4, row + 1);
      else if (e.key === 'ArrowLeft') nextCol = Math.max(0, col - 1);
      else if (e.key === 'ArrowRight') nextCol = Math.min(4, col + 1);
      else return;

      e.preventDefault();
      cellRefs.current[nextRow]?.[nextCol]?.focus();
    },
    [],
  );

  return (
    <div
      role="grid"
      aria-label="Bingo card"
      className="grid grid-cols-5 gap-1 w-full max-w-sm mx-auto"
    >
      {card.squares.map((row, r) =>
        row.map((square, c) => (
          <div
            key={square.id}
            onKeyDown={(e) => handleKeyDown(e, r, c)}
          >
            <BingoSquare
              ref={(el) => { cellRefs.current[r][c] = el; }}
              square={square}
              isWinningSquare={winningIds.has(square.id)}
              onClick={handleClicks.current[r][c]}
            />
          </div>
        )),
      )}
    </div>
  );
}

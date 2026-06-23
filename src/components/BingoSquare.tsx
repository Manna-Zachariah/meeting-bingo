import { memo, forwardRef } from 'react';
import { BingoSquare as BingoSquareType } from '../types';
import { cn } from '../lib/utils';

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-4 w-4 shrink-0"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
      clipRule="evenodd"
    />
  </svg>
);

interface BingoSquareProps {
  square: BingoSquareType;
  isWinningSquare: boolean;
  onClick: () => void;
}

export const BingoSquare = memo(
  forwardRef<HTMLButtonElement, BingoSquareProps>(function BingoSquare(
    { square, isWinningSquare, onClick },
    ref,
  ) {
    const { word, isFilled, isAutoFilled, isFreeSpace } = square;

    const label = isFreeSpace
      ? 'FREE space'
      : `${word} — ${isFilled ? 'filled' : 'empty'}`;

    return (
      <button
        ref={ref}
        role="gridcell"
        aria-label={label}
        aria-pressed={isFilled}
        aria-disabled={isFreeSpace ? true : undefined}
        disabled={isFreeSpace}
        onClick={onClick}
        className={cn(
          'relative flex flex-col items-center justify-center rounded border p-1 text-center text-xs font-medium leading-tight transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
          'aspect-square w-full overflow-hidden',
          // Default
          !isFilled && !isFreeSpace && 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer',
          // Free space
          isFreeSpace && 'border-amber-300 bg-amber-100 cursor-default',
          // Winning (check before plain filled so winning takes precedence)
          isWinningSquare && 'border-green-400 bg-green-500 text-white ring-2 ring-green-300',
          // Filled (non-winning)
          isFilled && !isWinningSquare && !isFreeSpace && 'border-blue-600 bg-blue-500 text-white',
          // Auto-fill animation (single 500ms pulse, not infinite)
          isAutoFilled && !isWinningSquare && 'animate-pulse-once',
        )}
      >
        {isFreeSpace ? (
          <span className="text-amber-800 font-bold text-xs">FREE</span>
        ) : (
          <>
            <span className="line-clamp-3 break-words px-0.5">{word}</span>
            {isFilled && (
              <span className={cn('mt-0.5', isWinningSquare ? 'text-white' : 'text-blue-100')}>
                <CheckIcon />
              </span>
            )}
          </>
        )}
      </button>
    );
  }),
);

import { BingoCard, WinningLine } from '../types';

export function checkForBingo(card: BingoCard): WinningLine | null {
  const { squares } = card;

  for (let row = 0; row < 5; row++) {
    if (squares[row].every(sq => sq.isFilled)) {
      return { type: 'row', index: row, squares: squares[row].map(sq => sq.id) };
    }
  }

  for (let col = 0; col < 5; col++) {
    if (squares.every(row => row[col].isFilled)) {
      return { type: 'column', index: col, squares: squares.map(row => row[col].id) };
    }
  }

  if ([0, 1, 2, 3, 4].every(i => squares[i][i].isFilled)) {
    return { type: 'diagonal', index: 0, squares: [0, 1, 2, 3, 4].map(i => `${i}-${i}`) };
  }

  if ([0, 1, 2, 3, 4].every(i => squares[i][4 - i].isFilled)) {
    return { type: 'diagonal', index: 1, squares: [0, 1, 2, 3, 4].map(i => `${i}-${4 - i}`) };
  }

  return null;
}

export function countFilled(card: BingoCard): number {
  return card.squares.flat().filter(sq => sq.isFilled).length;
}

export function getClosestToWin(card: BingoCard): { squaresNeeded: number; lineType: string } | null {
  const { squares } = card;
  const lines = [
    ...squares.map((row, i) => ({ squares: row, name: `Row ${i + 1}` })),
    ...[0, 1, 2, 3, 4].map(col => ({ squares: squares.map(row => row[col]), name: `Column ${col + 1}` })),
    { squares: [0, 1, 2, 3, 4].map(i => squares[i][i]), name: 'Diagonal ↘' },
    { squares: [0, 1, 2, 3, 4].map(i => squares[i][4 - i]), name: 'Diagonal ↙' },
  ];

  let best: { squaresNeeded: number; lineType: string } | null = null;

  for (const line of lines) {
    const needed = line.squares.filter(sq => !sq.isFilled).length;
    if (needed > 0 && (best === null || needed < best.squaresNeeded)) {
      best = { squaresNeeded: needed, lineType: line.name };
    }
  }

  return best;
}

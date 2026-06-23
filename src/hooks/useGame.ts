import { useCallback, useRef } from 'react';
import { GameState, GameAction, WinningLine, BingoCard } from '../types';
import { checkForBingo } from '../lib/bingoChecker';

type Dispatch = (action: GameAction) => void;

// Returns the updated card after filling a square — used internally before dispatching
function fillSquareInCard(
  card: BingoCard,
  row: number,
  col: number,
  isAutoFilled: boolean,
): BingoCard {
  const squares = card.squares.map((r, ri) =>
    r.map((sq, ci) => {
      if (ri === row && ci === col) {
        return { ...sq, isFilled: true, isAutoFilled, filledAt: Date.now() };
      }
      return sq;
    }),
  );
  return { ...card, squares };
}

export function useGame(
  game: GameState,
  dispatch: Dispatch,
  onWin: (line: WinningLine, winningWord: string) => void,
) {
  // Tracks all filled words to prevent double-fill on repeated utterances
  const alreadyFilledRef = useRef<Set<string>>(new Set());

  const fillSquare = useCallback(
    (row: number, col: number) => {
      if (!game.card) return;
      const sq = game.card.squares[row]?.[col];
      if (!sq || sq.isFilled || sq.isFreeSpace) return;

      dispatch({ type: 'FILL_SQUARE', row, col, isAutoFilled: false });

      const updatedCard = fillSquareInCard(game.card, row, col, false);
      const winningLine = checkForBingo(updatedCard);
      if (winningLine) {
        onWin(winningLine, sq.word);
      }
    },
    [game.card, dispatch, onWin],
  );

  const autoFillWords = useCallback(
    (words: string[]) => {
      if (!game.card || words.length === 0) return;

      let currentCard = game.card;

      for (const word of words) {
        if (alreadyFilledRef.current.has(word.toLowerCase())) continue;

        let found = false;
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            const sq = currentCard.squares[row][col];
            if (
              !sq.isFilled &&
              !sq.isFreeSpace &&
              sq.word.toLowerCase() === word.toLowerCase()
            ) {
              dispatch({ type: 'FILL_SQUARE', row, col, isAutoFilled: true });
              currentCard = fillSquareInCard(currentCard, row, col, true);
              alreadyFilledRef.current.add(word.toLowerCase());
              found = true;

              // Check bingo immediately after each fill — sq.word is the triggering word
              const winningLine = checkForBingo(currentCard);
              if (winningLine) {
                onWin(winningLine, sq.word);
                return; // Stop filling once the game is won
              }
              break;
            }
          }
          if (found) break;
        }
      }
    },
    [game.card, dispatch, onWin],
  );

  const resetAlreadyFilled = useCallback(() => {
    alreadyFilledRef.current = new Set();
  }, []);

  return { fillSquare, autoFillWords, alreadyFilled: alreadyFilledRef.current, resetAlreadyFilled };
}

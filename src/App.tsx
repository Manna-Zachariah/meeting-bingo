import { useReducer, useCallback, useEffect } from 'react';
import { GameState, GameAction, CategoryId, WinningLine } from './types';
import { generateCard } from './lib/cardGenerator';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LandingPage } from './components/LandingPage';
import { CategorySelect } from './components/CategorySelect';
import { GameBoard } from './components/GameBoard';
import { WinScreen } from './components/WinScreen';

type Screen = 'landing' | 'category' | 'game' | 'win';

const INITIAL_GAME: GameState = {
  status: 'idle',
  category: null,
  card: null,
  isListening: false,
  startedAt: null,
  completedAt: null,
  winningLine: null,
  winningWord: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...INITIAL_GAME,
        status: 'playing',
        category: action.category,
        card: action.card,
        startedAt: Date.now(),
      };
    case 'FILL_SQUARE': {
      if (!state.card) return state;
      const squares = state.card.squares.map((row, r) =>
        row.map((sq, c) => {
          if (r === action.row && c === action.col) {
            return { ...sq, isFilled: true, isAutoFilled: action.isAutoFilled, filledAt: Date.now() };
          }
          return sq;
        }),
      );
      return { ...state, card: { ...state.card, squares } };
    }
    case 'WIN':
      return {
        ...state,
        status: 'won',
        winningLine: action.winningLine,
        winningWord: action.winningWord,
        completedAt: Date.now(),
      };
    case 'SET_LISTENING':
      return { ...state, isListening: action.isListening };
    case 'RESET':
      return INITIAL_GAME;
    default:
      return state;
  }
}

export default function App() {
  const [persistedGame, setPersistedGame] = useLocalStorage<GameState>(
    'meeting-bingo-state',
    INITIAL_GAME,
  );

  // useReducer dispatch is stable — never recreated, safe to pass as a prop
  const [game, dispatch] = useReducer(gameReducer, persistedGame);
  const [screen, setScreen] = useLocalStorage<Screen>(
    'meeting-bingo-screen',
    'landing',
  );

  // Persist game state by reading the live reducer state — avoids stale-closure divergence
  useEffect(() => {
    setPersistedGame(game);
  }, [game, setPersistedGame]);

  // --- Transition handlers (all deps are stable: dispatch, setScreen) ---

  const handleStart = useCallback(() => setScreen('category'), [setScreen]);

  const handleCategorySelect = useCallback(
    (categoryId: CategoryId) => {
      const card = generateCard(categoryId);
      dispatch({ type: 'START_GAME', category: categoryId, card });
      setScreen('game');
    },
    [dispatch, setScreen],
  );

  const handleBackToLanding = useCallback(() => setScreen('landing'), [setScreen]);
  const handleBackToCategory = useCallback(() => setScreen('category'), [setScreen]);

  const handleWin = useCallback(
    (line: WinningLine, winningWord: string) => {
      dispatch({ type: 'WIN', winningLine: line, winningWord });
      setScreen('win');
    },
    [dispatch, setScreen],
  );

  // game.category only changes on new-game — not on every fill
  const handleNewCard = useCallback(() => {
    if (!game.category) {
      setScreen('category');
      return;
    }
    const card = generateCard(game.category);
    dispatch({ type: 'START_GAME', category: game.category, card });
  }, [game.category, dispatch, setScreen]);

  const handlePlayAgain = useCallback(() => setScreen('category'), [setScreen]);

  const handleHome = useCallback(() => {
    dispatch({ type: 'RESET' });
    setScreen('landing');
  }, [dispatch, setScreen]);

  // --- Render ---

  if (screen === 'landing') {
    return <LandingPage onStart={handleStart} />;
  }

  if (screen === 'category') {
    return (
      <CategorySelect
        onSelect={handleCategorySelect}
        onBack={handleBackToLanding}
      />
    );
  }

  if (screen === 'game') {
    return (
      <GameBoard
        game={game}
        dispatch={dispatch}
        onWin={handleWin}
        onNewCard={handleNewCard}
        onBack={handleBackToCategory}
      />
    );
  }

  if (screen === 'win') {
    return (
      <WinScreen
        game={game}
        onPlayAgain={handlePlayAgain}
        onHome={handleHome}
      />
    );
  }

  return null;
}

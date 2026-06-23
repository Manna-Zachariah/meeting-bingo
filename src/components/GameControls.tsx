import { useState } from 'react';
import { Button } from './ui/Button';

interface GameControlsProps {
  isListening: boolean;
  isSupported: boolean;
  filledCount: number;
  onToggleListen: () => void;
  onNewCard: () => void;
}

export function GameControls({
  isListening,
  isSupported,
  filledCount,
  onToggleListen,
  onNewCard,
}: GameControlsProps) {
  const [confirmingNew, setConfirmingNew] = useState(false);

  function handleNewCardClick() {
    if (filledCount > 1) {
      setConfirmingNew(true);
    } else {
      onNewCard();
    }
  }

  function handleConfirmNew() {
    setConfirmingNew(false);
    onNewCard();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Mic toggle */}
      {isSupported ? (
        <button
          onClick={onToggleListen}
          aria-pressed={isListening}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
          className={`flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
            isListening
              ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse-fast'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <MicIcon isListening={isListening} />
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
      ) : (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          Speech recognition not supported in this browser. Try Chrome.
        </p>
      )}

      {/* New card */}
      {confirmingNew ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <span className="text-sm text-amber-800">Reset your progress?</span>
          <Button variant="ghost" className="text-xs" onClick={() => setConfirmingNew(false)}>
            Cancel
          </Button>
          <Button variant="secondary" className="text-xs border-amber-500 text-amber-700" onClick={handleConfirmNew}>
            New Card
          </Button>
        </div>
      ) : (
        <Button variant="ghost" onClick={handleNewCardClick} className="text-xs text-gray-500">
          New Card
        </Button>
      )}
    </div>
  );
}

function MicIcon({ isListening }: { isListening: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      {isListening ? (
        // Stop square
        <path d="M5.25 3A2.25 2.25 0 003 5.25v9.5A2.25 2.25 0 005.25 17h9.5A2.25 2.25 0 0017 14.75v-9.5A2.25 2.25 0 0014.75 3h-9.5z" />
      ) : (
        // Microphone
        <path d="M7 4a3 3 0 016 0v6a3 3 0 01-6 0V4zm-2 6a1 1 0 112 0 3 3 0 006 0 1 1 0 112 0 5 5 0 01-10 0zm5 7a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
      )}
    </svg>
  );
}

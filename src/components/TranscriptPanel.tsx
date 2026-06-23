interface TranscriptPanelProps {
  lastFinalChunk: string;
  interimTranscript: string;
}

export function TranscriptPanel({ lastFinalChunk, interimTranscript }: TranscriptPanelProps) {
  return (
    <div
      aria-label="Speech transcript"
      aria-live="polite"
      className="mt-4 w-full max-w-sm rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-sm"
    >
      {interimTranscript && (
        <span className="italic text-gray-400">{interimTranscript}</span>
      )}
      {!interimTranscript && lastFinalChunk && (
        <span className="text-gray-600">{lastFinalChunk}</span>
      )}
      {!interimTranscript && !lastFinalChunk && (
        <span className="text-gray-400">Listening…</span>
      )}
    </div>
  );
}

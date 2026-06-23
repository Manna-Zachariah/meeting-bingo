import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  lastFinalChunk: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
}

export function useSpeechRecognition(): SpeechRecognitionResult {
  // isListeningRef is read synchronously inside onend — keeping this in useState
  // would cause double-start bugs in React 18 Strict Mode
  const isListeningRef = useRef(false);
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastFinalChunk, setLastFinalChunk] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    setIsSupported(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimTranscript(interim);
      if (finalChunk) {
        // Pass only the finalized chunk — not the cumulative transcript
        setLastFinalChunk(finalChunk);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error);
      setIsListening(false);
      isListeningRef.current = false;
    };

    // Auto-restart: reads isListeningRef synchronously — no setState needed
    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (err) {
          // InvalidStateError means already running — safe to ignore
          if (err instanceof DOMException && err.name === 'InvalidStateError') return;
          // Any other error (e.g. NotAllowedError after permission revoked) means we
          // cannot restart — reset state so the UI doesn't show a zombie active mic
          isListeningRef.current = false;
          setIsListening(false);
          setError(err instanceof Error ? err.message : 'Speech recognition failed');
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      recognition.stop();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    isListeningRef.current = true;
    setIsListening(true);
    setError(null);
    setLastFinalChunk('');
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
    } catch {
      // Already running — ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    // Set ref first so onend doesn't restart
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
    recognitionRef.current.stop();
  }, []);

  return {
    isSupported,
    isListening,
    lastFinalChunk,
    interimTranscript,
    error,
    startListening,
    stopListening,
  };
}

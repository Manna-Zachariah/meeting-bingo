import { Button } from './ui/Button';

interface LandingPageProps {
  onStart: () => void;
}

const steps = [
  { icon: '🎯', title: 'Select category', desc: 'Choose Agile, Corporate, or Tech buzzwords.' },
  { icon: '🎙️', title: 'Start listening', desc: 'Grant mic access and join your meeting.' },
  { icon: '✅', title: 'Auto-fill squares', desc: 'Squares fill automatically when words are detected.' },
  { icon: '🎉', title: 'Yell BINGO!', desc: 'Complete a line to win. Share your result.' },
];

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-blue-700 mb-3">
          MEETING BINGO
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-md mb-8">
          Turn corporate buzzword bingo into a game. Auto-detects jargon in real time.
        </p>
        <Button
          variant="primary"
          className="px-8 py-3 text-base"
          onClick={onStart}
        >
          New Game
        </Button>

        {/* Privacy notice — required exact copy per CLAUDE.md */}
        <p className="mt-6 text-xs text-gray-400 max-w-sm">
          Audio processed by your browser&apos;s built-in speech API. On Chrome, this uses
          Google&apos;s speech servers. This app never stores your audio.
        </p>
      </main>

      {/* How it works */}
      <section className="px-4 pb-16 max-w-2xl mx-auto w-full">
        <h2 className="text-xl font-bold text-gray-700 text-center mb-6">How It Works</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <span className="text-2xl" aria-hidden="true">{step.icon}</span>
              <div>
                <span className="font-semibold text-gray-800">{i + 1}. {step.title}</span>
                <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

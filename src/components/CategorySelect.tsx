import { CATEGORIES } from '../data/categories';
import { CategoryId } from '../types';
import { Button } from './ui/Button';

interface CategorySelectProps {
  onSelect: (categoryId: CategoryId) => void;
  onBack: () => void;
}

export function CategorySelect({ onSelect, onBack }: CategorySelectProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white px-4 py-8 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Back
          </Button>
          <h2 className="text-3xl font-bold text-gray-800">Choose a Category</h2>
          <p className="text-gray-500 mt-1">Pick the buzzword set that matches your meeting.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="group flex flex-col items-start gap-2 rounded-xl border-2 border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95"
            >
              <span className="text-3xl" aria-hidden="true">{cat.icon}</span>
              <div>
                <div className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                  {cat.name}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">{cat.description}</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {cat.sampleWords.slice(0, 4).map((w) => (
                  <span
                    key={w}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

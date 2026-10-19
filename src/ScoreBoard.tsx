import React from 'react';
import { TEAM_COLORS, type Team } from './teams';

interface ScoreBoardProps {
  teams: Team[];
  onChange: (teams: Team[]) => void;
  onClose: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

const Counter = ({ icon, label, value, onMinus, onPlus }: {
  icon: string; label: string; value: number; onMinus: () => void; onPlus: () => void;
}) => (
  <div className="flex items-center justify-between gap-2 sm:gap-4">
    <span className="text-3xl sm:text-5xl" aria-hidden="true">{icon}</span>
    <button onClick={onMinus} aria-label={`Enlever : ${label}`} className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 text-white rounded-full text-3xl font-black shadow-md active:scale-90 transition-all">−</button>
    <span className="text-3xl sm:text-5xl font-black text-gray-900 tabular-nums min-w-[2ch] text-center" aria-label={`${label} : ${value}`}>{value}</span>
    <button onClick={onPlus} aria-label={`Ajouter : ${label}`} className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-600 text-white rounded-full text-3xl font-black shadow-md active:scale-90 transition-all">+</button>
  </div>
);

const ScoreBoard = ({ teams, onChange, onClose, onExport, onImport, onReset }: ScoreBoardProps) => {
  const update = (i: number, patch: Partial<Team>) =>
    onChange(teams.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-xl p-2 sm:p-6">
      <div role="dialog" aria-modal="true" aria-label="Tableau des scores" className="relative bg-white rounded-[2rem] sm:rounded-[4rem] border-[10px] sm:border-[16px] border-sky-500 w-full max-w-7xl max-h-[95vh] overflow-y-auto p-4 sm:p-10">
        <button onClick={onClose} aria-label="Fermer le tableau des scores" className="absolute top-2 right-3 sm:top-6 sm:right-8 text-4xl sm:text-6xl font-black text-red-600 hover:text-red-700 p-2">✕</button>
        <h2 className="text-3xl sm:text-6xl font-black text-sky-700 text-center mb-4 sm:mb-8">Scores 🏆</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {teams.map((t, i) => (
            <div key={i} className="rounded-3xl border-4 border-gray-200 overflow-hidden shadow-lg">
              <div className={`${TEAM_COLORS[i % TEAM_COLORS.length]} p-2 sm:p-3`}>
                <input
                  value={t.name} maxLength={30}
                  onChange={(e) => update(i, { name: e.target.value })}
                  aria-label={`Nom de l'équipe ${i + 1}`}
                  className="w-full bg-white/90 rounded-xl px-3 py-2 text-xl sm:text-3xl font-black text-gray-900 text-center"
                />
              </div>
              <div className="p-3 sm:p-5 flex flex-col gap-3 sm:gap-4 bg-gray-50">
                <Counter icon="🪙" label={`pièces de ${t.name}`} value={t.coins}
                  onMinus={() => update(i, { coins: Math.max(0, t.coins - 1) })}
                  onPlus={() => update(i, { coins: t.coins + 1 })} />
                <Counter icon="⭐" label={`étoiles de ${t.name}`} value={t.stars}
                  onMinus={() => update(i, { stars: Math.max(0, t.stars - 1) })}
                  onPlus={() => update(i, { stars: t.stars + 1 })} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-6 sm:mt-10">
          <button onClick={onExport} className="bg-amber-500 text-white px-6 py-3 sm:py-4 rounded-2xl text-lg sm:text-2xl font-black shadow-lg hover:scale-105 transition-all">💾 SAUVEGARDER LA PARTIE</button>
          <label className="bg-sky-600 text-white px-6 py-3 sm:py-4 rounded-2xl text-lg sm:text-2xl font-black shadow-lg hover:scale-105 transition-all cursor-pointer focus-within:outline focus-within:outline-4 focus-within:outline-amber-500">
            📂 CHARGER UNE PARTIE
            <input type="file" accept=".json" onChange={onImport} className="sr-only" />
          </label>
          <button onClick={onReset} className="bg-gray-600 text-white px-6 py-3 sm:py-4 rounded-2xl text-lg sm:text-2xl font-black shadow-lg hover:scale-105 transition-all">↺ TOUT REMETTRE À ZÉRO</button>
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;

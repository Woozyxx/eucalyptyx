import { useEffect, useId, useState } from 'react';
import { playBeep } from './sounds';

export interface ModalButton {
  label: string;
  onClick: () => void;
  tone?: 'green' | 'red' | 'gray';
}

const TONES: Record<NonNullable<ModalButton['tone']>, string> = {
  green: 'bg-emerald-500 shadow-[0_8px_0_rgb(5,150,105)]',
  red: 'bg-red-500 shadow-[0_8px_0_rgb(153,27,27)]',
  gray: 'bg-gray-500 shadow-[0_8px_0_rgb(55,65,81)]',
};

/** Fenêtre de message aux couleurs du site (remplace alert/confirm). */
export const MessageModal = ({ title, message, buttons, onClose }: {
  title: string;
  message: string;
  buttons: ModalButton[];
  onClose: () => void;
}) => {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="bg-white rounded-[2rem] sm:rounded-[3rem] border-[8px] sm:border-[12px] border-amber-400 p-6 sm:p-12 w-full max-w-3xl text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-3xl sm:text-5xl font-black text-amber-600 mb-4 sm:mb-8">{title}</h2>
        <p className="text-xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-10">{message}</p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {buttons.map((b) => (
            <button
              key={b.label} autoFocus={b === buttons[0]} onClick={b.onClick}
              className={`flex-1 ${TONES[b.tone ?? 'green']} text-white py-4 sm:py-6 rounded-2xl text-xl sm:text-3xl font-black hover:scale-105 active:translate-y-2 active:shadow-none transition-all`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Chrono visuel avec barre de progression et bip final. */
export const CountdownTimer = ({ seconds }: { seconds: number }) => {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          setRunning(false);
          playBeep(3);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const start = () => {
    setRemaining(seconds);
    setRunning(true);
  };

  const ratio = remaining / seconds;
  const barColor = ratio > 0.5 ? 'bg-emerald-500' : ratio > 0.2 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="w-full flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
      <button
        onClick={start}
        className="bg-sky-500 text-white px-6 sm:px-10 py-3 sm:py-5 rounded-2xl text-xl sm:text-3xl font-black shadow-[0_8px_0_rgb(3,105,161)] hover:scale-105 active:translate-y-2 active:shadow-none transition-all whitespace-nowrap"
      >
        {running ? '⏱️ RELANCER' : remaining === 0 ? '⏱️ ENCORE !' : `⏱️ CHRONO ${seconds} s`}
      </button>
      <div className="flex-1 w-full flex items-center gap-4" role="timer" aria-live="off">
        <div className="flex-1 h-6 sm:h-10 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} transition-all duration-1000 ease-linear`} style={{ width: `${ratio * 100}%` }} />
        </div>
        <span className="text-3xl sm:text-6xl font-black text-blue-900 tabular-nums w-20 sm:w-36 text-right">{remaining}</span>
      </div>
    </div>
  );
};

/** Bouton flottant : police adaptée à la dyslexie (mémorisée). */
export const DyslexiaToggle = () => {
  const [on, setOn] = useState(() => {
    try { return localStorage.getItem('eucalyptyx_dyslexia') === '1'; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dyslexia', on);
    try { localStorage.setItem('eucalyptyx_dyslexia', on ? '1' : '0'); } catch { /* stockage indisponible */ }
  }, [on]);

  return (
    <button
      onClick={() => setOn(!on)}
      aria-pressed={on}
      aria-label="Police facile à lire (dyslexie)"
      title="Police facile à lire"
      className={`fixed bottom-3 left-3 z-[250] w-14 h-14 rounded-full text-2xl font-black shadow-xl border-4 border-white transition-all hover:scale-110 ${on ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800'}`}
    >
      Aa
    </button>
  );
};

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import SuperMarioParty from './SuperMarioParty';
import { MessageModal } from './ui';
import { playFanfare } from './sounds';

// --- CONSTANTS ---
const DEFAULT_CHALLENGES = [
  { text: "Trouve un objet qui commence par la lettre E !", desc: "L'enfant doit courir dans la pièce et rapporter un objet (Ex: Éponge, Écharpe)." },
  { text: "Fais 5 sauts de grenouille !", desc: "S'accroupir les mains au sol et sauter le plus haut possible 5 fois." },
  { text: "Imite le cri d'un animal de la savane !", desc: "L'enfant peut choisir un lion, un éléphant ou un singe." },
  { text: "Touche 3 objets rouges !", desc: "Course de rapidité : toucher 3 objets différents de couleur rouge." },
  { text: "Équilibre sur un pied !", desc: "Rester immobile sur un pied sans tomber pendant 15 secondes." }
];

const ANIMAL_AVATARS = ["🦁", "🐘", "🦒", "🦊", "🐼", "🐨", "🐸", "🐧", "🐒", "🐯", "🦓", "🦉"];

type Screen = 'dashboard' | 'wheel_game' | 'mario_party';

interface Player {
  id: string;
  name: string;
  score: number;
  avatar: string;
}

interface Challenge {
  text: string;
  desc: string;
}

interface Preset {
  id: string;
  name: string;
  challenges: Challenge[];
  finaleSoundUrl: string;
  isVoiceEnabled: boolean;
}

// --- SUB-COMPONENTS ---

interface HeaderProps {
  title: string;
  color: string;
  onAccueil: () => void;
  onFinale: () => void;
  onToggleSidebar?: () => void;
  showSidebarButton?: boolean;
}

const Header = ({ title, color, onAccueil, onFinale, onToggleSidebar, showSidebarButton }: HeaderProps) => (
  <div className="w-full flex justify-between items-center mb-4 sm:mb-6 lg:mb-8 bg-white/40 backdrop-blur-md p-2 sm:p-4 lg:p-6 rounded-2xl sm:rounded-[2rem] shadow-xl border-t-2 border-l-2 border-white gap-2">
    <div className="flex items-center gap-2">
      <button onClick={onAccueil} className={`${color} px-3 sm:px-6 lg:px-10 py-2 sm:py-3 lg:py-5 rounded-xl sm:rounded-2xl shadow-lg text-sm sm:text-xl lg:text-3xl font-black text-white hover:scale-105 transition-all whitespace-nowrap`}>← ACCUEIL</button>
      {showSidebarButton && (
        <button onClick={onToggleSidebar} className="lg:hidden bg-emerald-600 px-3 py-2 rounded-xl shadow-lg text-sm font-black text-white">JOUEURS</button>
      )}
    </div>
    <h2 className={`text-xl sm:text-3xl lg:text-6xl font-black ${color.replace('bg-', 'text-')} tracking-tighter uppercase truncate px-2 text-center flex-1`}>{title}</h2>
    <button onClick={onFinale} className="bg-amber-500 px-3 sm:px-6 lg:px-10 py-2 sm:py-3 lg:py-5 rounded-xl sm:rounded-2xl shadow-lg text-sm sm:text-xl lg:text-3xl font-black text-white hover:scale-105 transition-all animate-pulse whitespace-nowrap">FIN ! 🏁</button>
  </div>
);

interface PlayerSidebarProps {
  players: Player[];
  currentPlayerIndex: number;
  currentScreen: string;
  newPlayerName: string;
  setNewPlayerName: (name: string) => void;
  addPlayer: () => void;
  updateScore: (id: string, delta: number) => void;
  movePlayer: (index: number, direction: 'up' | 'down') => void;
  removePlayer: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PlayerSidebar = ({ 
  players, 
  currentPlayerIndex, 
  currentScreen, 
  newPlayerName, 
  setNewPlayerName, 
  addPlayer, 
  updateScore, 
  movePlayer, 
  removePlayer,
  isOpen,
  onClose
}: PlayerSidebarProps) => (
  <div className={`${isOpen ? 'flex' : 'hidden'} lg:flex fixed lg:static inset-0 z-[110] lg:z-10 w-full sm:w-[24rem] xl:w-[28rem] bg-gradient-to-b from-emerald-500/95 to-teal-700/95 lg:from-emerald-500/80 lg:to-teal-700/80 backdrop-blur-xl lg:rounded-r-[4rem] p-6 xl:p-8 shadow-2xl lg:border-r-8 border-white/30 flex-col h-screen font-kids transition-all duration-300`}>
    <div className="flex justify-between items-center mb-6 lg:mb-8">
      <h3 className="text-3xl xl:text-4xl font-black text-white uppercase drop-shadow-md">Les Aventuriers</h3>
      <button onClick={onClose} aria-label="Fermer la liste des joueurs" className="lg:hidden text-white text-4xl">✕</button>
    </div>
    
    <div className="bg-white/20 p-4 rounded-3xl mb-6 flex flex-col gap-3 border-2 border-white/30">
      <input 
        type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)}
        placeholder="PRÉNOM..." className="text-xl xl:text-2xl p-4 rounded-2xl bg-white/90 outline-none font-black uppercase text-teal-900"
        onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
      />
      <button onClick={addPlayer} className="bg-amber-400 text-white py-3 rounded-2xl text-xl xl:text-2xl font-black shadow-lg hover:bg-amber-500 active:scale-95 transition-all">AJOUTER</button>
    </div>

    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
      {players.map((p, i) => (
        <div key={p.id} className={`group p-4 rounded-3xl flex items-center gap-4 transition-all border-4 shadow-lg ${i === currentPlayerIndex && currentScreen === 'wheel_game' ? 'bg-amber-400 border-white scale-105' : 'bg-white/10 border-white/20'}`}>
          <span className="text-3xl xl:text-4xl bg-white/20 p-2 rounded-2xl">{p.avatar}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xl xl:text-2xl font-black text-white truncate leading-tight uppercase">{p.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => updateScore(p.id, -1)} aria-label={`Enlever un point à ${p.name}`} className="w-8 h-8 bg-red-400 text-white rounded-full font-black text-xl flex items-center justify-center">-</button>
              <span className="text-xl font-bold text-amber-100">{p.score}</span>
              <button onClick={() => updateScore(p.id, 1)} aria-label={`Ajouter un point à ${p.name}`} className="w-8 h-8 bg-emerald-400 text-white rounded-full font-black text-xl flex items-center justify-center">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button onClick={() => movePlayer(i, 'up')} aria-label={`Monter ${p.name}`} className="text-white text-xl hover:text-amber-300">▲</button>
            <button onClick={() => removePlayer(p.id)} aria-label={`Supprimer ${p.name}`} className="text-red-300 text-xl hover:text-red-500">🗑️</button>
            <button onClick={() => movePlayer(i, 'down')} aria-label={`Descendre ${p.name}`} className="text-white text-xl hover:text-amber-300">▼</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- APP COMPONENT ---

const App: React.FC = () => {
  // Global State
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Voice & Audio Settings
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [finaleSoundUrl, setFinaleSoundUrl] = useState(""); // vide = fanfare intégrée
  const [notice, setNotice] = useState<string | null>(null);

  // Game State
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isWheelSettingsOpen, setIsWheelSettingsOpen] = useState(false);
  const [newChallengeText, setNewChallengeText] = useState("");
  const [newChallengeDesc, setNewChallengeDesc] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Presets State
  const [presets, setPresets] = useState<Preset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");

  // --- INITIALIZATION ---
  useEffect(() => {
    const savedChallenges = localStorage.getItem('eucalyptyx_challenges_v4');
    const savedPlayers = localStorage.getItem('eucalyptyx_players_v4');
    const savedPresets = localStorage.getItem('eucalyptyx_presets_v4');
    
    setChallenges(savedChallenges ? JSON.parse(savedChallenges) : DEFAULT_CHALLENGES);
    setPlayers(savedPlayers ? JSON.parse(savedPlayers) : []);
    setPresets(savedPresets ? JSON.parse(savedPresets) : []);

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices.filter(v => v.lang.startsWith('fr')));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    localStorage.setItem('eucalyptyx_challenges_v4', JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem('eucalyptyx_players_v4', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('eucalyptyx_presets_v4', JSON.stringify(presets));
  }, [presets]);

  // --- PRESET ACTIONS ---
  const saveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      challenges: [...challenges],
      finaleSoundUrl,
      isVoiceEnabled
    };
    setPresets([...presets, newPreset]);
    setNewPresetName("");
  };

  const loadPreset = (preset: Preset) => {
    setChallenges(preset.challenges);
    setFinaleSoundUrl(preset.finaleSoundUrl);
    setIsVoiceEnabled(preset.isVoiceEnabled);
    setIsWheelSettingsOpen(false);
  };

  const deletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
  };

  const exportConfig = () => {
    const data = {
      version: "1.0",
      challenges,
      players,
      finaleSoundUrl,
      isVoiceEnabled
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eucalyptyx_config_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.challenges) {
          setChallenges(data.challenges);
          if (data.finaleSoundUrl) setFinaleSoundUrl(data.finaleSoundUrl);
          if (data.isVoiceEnabled !== undefined) setIsVoiceEnabled(data.isVoiceEnabled);
          if (Array.isArray(data.players)) setPlayers(data.players);
          setNotice("Configuration importée avec succès !");
        }
      } catch {
        setNotice("Erreur lors de l'importation du fichier.");
      }
    };
    reader.readAsText(file);
  };

  // --- AUDIO LOGIC ---
  const speak = (text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = availableVoices.find(v => v.voiceURI === selectedVoiceURI) || availableVoices[0];
    if (voice) utterance.voice = voice;
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const playFinale = () => {
    if (finaleSoundUrl.trim()) {
      const audio = new Audio(finaleSoundUrl);
      audio.onerror = playFanfare;
      audio.play().catch(playFanfare);
    } else {
      playFanfare();
    }
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#FBBF24', '#3B82F6', '#F472B6']
    });
    setShowLeaderboard(true);
  };

  // --- PLAYER ACTIONS ---
  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < 30) {
      const newPlayer: Player = { 
        id: Date.now().toString(), 
        name: newPlayerName.trim().toUpperCase(), 
        score: 0,
        avatar: ANIMAL_AVATARS[Math.floor(Math.random() * ANIMAL_AVATARS.length)]
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName("");
    }
  };

  const removePlayer = (id: string) => setPlayers(players.filter(p => p.id !== id));
  
  const updateScore = (id: string, delta: number) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, score: Math.max(0, p.score + delta) } : p));
  };

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    const newPlayers = [...players];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < players.length) {
      [newPlayers[index], newPlayers[target]] = [newPlayers[target], newPlayers[index]];
      setPlayers(newPlayers);
    }
  };

  const shuffleChallenges = () => {
    const shuffled = [...challenges].sort(() => Math.random() - 0.5);
    setChallenges(shuffled);
  };

  const addChallenge = () => {
    if (newChallengeText.trim()) {
      setChallenges([...challenges, { text: newChallengeText.trim(), desc: newChallengeDesc }]);
      setNewChallengeText("");
      setNewChallengeDesc("");
    }
  };

  // --- GAME ACTIONS ---
  const spinWheel = () => {
    if (isSpinning || challenges.length === 0) return;
    setSelectedChallenge(null);
    setIsDescriptionVisible(false);
    setIsSpinning(true);

    const totalRotation = rotation + (5 + Math.floor(Math.random() * 5)) * 360 + Math.floor(Math.random() * 360);
    setRotation(totalRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      const index = Math.floor((360 - (totalRotation % 360)) / (360 / challenges.length)) % challenges.length;
      const result = challenges[index];
      setWinningIndex(index);
      setSelectedChallenge(result);
      speak(`Défi pour ${players[currentPlayerIndex]?.name || 'toi'} : ${result.text}`);
    }, 5000);
  };

  const givePointToAll = () => {
    setPlayers(prev => prev.map(p => ({ ...p, score: p.score + 1 })));
  };

  const resetScores = () => {
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    setCurrentPlayerIndex(0);
    setShowLeaderboard(false);
  };

  const handleChallengeAction = (keep: boolean) => {
    if (selectedChallenge) {
      if (players.length > 0 && players[currentPlayerIndex]) {
        setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
      }
      
      if (!keep && winningIndex !== null) {
        setChallenges(challenges.filter((_, i) => i !== winningIndex));
      }
      
      setSelectedChallenge(null);
      setWinningIndex(null);
    }
  };

  // --- RENDERING ---

  if (currentScreen === 'dashboard') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-tr from-sky-300 via-emerald-200 to-amber-100 overflow-hidden font-kids">
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black text-emerald-800 mb-8 sm:mb-12 md:mb-20 drop-shadow-xl tracking-tighter leading-none text-center">
          Eucaly<span className="text-amber-500">ptyx</span>
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 md:gap-12 max-w-7xl w-full overflow-y-auto max-h-[70vh] md:max-h-none p-4">
          <button onClick={() => setCurrentScreen('wheel_game')} className="group bg-white/40 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] lg:rounded-[4rem] p-6 sm:p-10 lg:p-16 shadow-2xl border-4 lg:border-8 border-white transition-all hover:scale-105 flex flex-col items-center">
            <div className="text-6xl sm:text-8xl lg:text-[10rem] mb-2 sm:mb-4 lg:mb-6 transform group-hover:rotate-12 transition-transform">🎡</div>
            <h2 className="text-2xl sm:text-4xl lg:text-7xl font-black text-emerald-900 uppercase">La Roue</h2>
          </button>
          <button onClick={() => setCurrentScreen('mario_party')} className="group bg-white/40 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] lg:rounded-[4rem] p-6 sm:p-10 lg:p-16 shadow-2xl border-4 lg:border-8 border-white transition-all hover:scale-105 flex flex-col items-center">
            <div className="text-6xl sm:text-8xl lg:text-[10rem] mb-2 sm:mb-4 lg:mb-6 transform group-hover:-rotate-12 transition-transform">🎲</div>
            <h2 className="text-2xl sm:text-4xl lg:text-7xl font-black text-blue-800 uppercase text-center">Mario Party</h2>
          </button>
        </div>
      </div>
    );
  }

  if (currentScreen === 'mario_party') {
    return <SuperMarioParty onBack={() => setCurrentScreen('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-emerald-100 via-sky-100 to-amber-100 flex font-kids overflow-hidden w-full h-full">
      <PlayerSidebar 
        players={players} 
        currentPlayerIndex={currentPlayerIndex} 
        currentScreen={currentScreen}
        newPlayerName={newPlayerName}
        setNewPlayerName={setNewPlayerName}
        addPlayer={addPlayer}
        updateScore={updateScore}
        movePlayer={movePlayer}
        removePlayer={removePlayer}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col items-center p-2 sm:p-4 lg:p-8 relative bg-[url('https://www.transparenttextures.com/patterns/leaf.png')] bg-repeat w-full h-full overflow-hidden">
        {/* Decorative Nature Blobs */}
        <div className="absolute top-20 right-20 w-[10rem] sm:w-[20rem] lg:w-[30rem] h-[10rem] sm:h-[20rem] lg:h-[30rem] bg-amber-300/30 rounded-full blur-[40px] sm:blur-[80px] lg:blur-[100px] -z-10"></div>
        <div className="absolute bottom-20 left-20 w-[15rem] sm:w-[30rem] lg:w-[40rem] h-[15rem] sm:h-[30rem] lg:h-[40rem] bg-emerald-400/20 rounded-full blur-[50px] sm:blur-[100px] lg:blur-[120px] -z-10"></div>
        
        <Header 
          title="La Roue" 
          color="bg-emerald-500" 
          onAccueil={() => setCurrentScreen('dashboard')} 
          onFinale={playFinale} 
          onToggleSidebar={() => setIsSidebarOpen(true)}
          showSidebarButton={true}
        />
        
        <div className="flex-1 flex flex-col items-center justify-center w-full max-h-[calc(100vh-10rem)] overflow-hidden">
          {players.length > 0 && !isSpinning && !selectedChallenge && (
            <div className="mb-2 sm:mb-6 lg:mb-10 bg-amber-400 p-2 sm:p-4 lg:p-8 rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] shadow-2xl animate-bounce border-2 sm:border-4 lg:border-8 border-white flex items-center gap-2 sm:gap-4 lg:gap-6">
              <span className="text-2xl sm:text-4xl lg:text-7xl">{players[currentPlayerIndex]?.avatar}</span>
              <p className="text-sm sm:text-2xl lg:text-5xl font-black text-white uppercase underline decoration-white decoration-2 sm:decoration-4 lg:decoration-8">C'est à {players[currentPlayerIndex]?.name} !</p>
            </div>
          )}

          <div className="relative scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 transition-transform origin-center">
            <div className="absolute -top-8 lg:-top-12 left-1/2 -translate-x-1/2 z-20 text-[4rem] sm:text-[6rem] lg:text-[10rem] text-amber-500 drop-shadow-xl">▼</div>
            <div style={{ transform: `rotate(${rotation}deg)` }} className="transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1)">
              <svg width="600" height="600" viewBox="0 0 600 600" className="max-w-[90vw] max-h-[50vh] sm:max-h-[60vh] drop-shadow-2xl">
                {challenges.map((_, i) => {
                  const angle = 360 / (challenges.length || 1);
                  const startAngle = i * angle - 90;
                  const endAngle = (i + 1) * angle - 90;
                  const x1 = 300 + 280 * Math.cos(startAngle * Math.PI / 180);
                  const y1 = 300 + 280 * Math.sin(startAngle * Math.PI / 180);
                  const x2 = 300 + 280 * Math.cos(endAngle * Math.PI / 180);
                  const y2 = 300 + 280 * Math.sin(endAngle * Math.PI / 180);
                  const colors = ['#10B981', '#FBBF24', '#3B82F6', '#F472B6', '#8B5CF6', '#F97316', '#06B6D4', '#6366F1'];
                  return (
                    <g key={i}>
                      <path d={`M 300 300 L ${x1} ${y1} A 280 280 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={colors[i % colors.length]} stroke="white" strokeWidth="6" />
                      <text x={300 + 180 * Math.cos((startAngle + angle/2) * Math.PI / 180)} y={300 + 180 * Math.sin((startAngle + angle/2) * Math.PI / 180)} fill="white" fontSize="32" fontWeight="900" textAnchor="middle" transform={`rotate(${startAngle + 90 + angle/2}, ${300 + 180 * Math.cos((startAngle + angle/2) * Math.PI / 180)}, ${300 + 180 * Math.sin((startAngle + angle/2) * Math.PI / 180)})`}>#{i + 1}</text>
                    </g>
                  );
                })}
                <circle cx="300" cy="300" r="50" fill="white" stroke="#e2e8f0" strokeWidth="6" />
              </svg>
            </div>
            <button onClick={spinWheel} disabled={isSpinning || challenges.length === 0} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 sm:w-32 lg:w-44 h-24 sm:h-32 lg:h-44 rounded-full border-[6px] sm:border-[8px] lg:border-[12px] border-white shadow-2xl text-2xl sm:text-4xl lg:text-6xl font-black transition ${isSpinning || challenges.length === 0 ? 'bg-gray-400' : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white hover:scale-110 active:scale-95'}`}>GO!</button>
          </div>
        </div>

        {/* Challenge Modal */}
        {selectedChallenge && !isSpinning && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-emerald-900/80 p-4 sm:p-6 lg:p-10 backdrop-blur-xl">
            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] lg:rounded-[5rem] p-6 sm:p-8 lg:p-16 max-w-6xl w-full text-center shadow-2xl border-[8px] sm:border-[12px] lg:border-[24px] border-amber-400 animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
              <p className="text-sm sm:text-xl lg:text-4xl font-black text-amber-600 mb-2 sm:mb-4 lg:mb-6 uppercase tracking-widest">DÉFI POUR {players[currentPlayerIndex]?.name || 'TOI'}</p>
              <h3 className="text-xl sm:text-4xl md:text-6xl lg:text-8xl font-black text-blue-700 leading-tight mb-4 sm:mb-8 lg:mb-12">"{selectedChallenge.text}"</h3>
              
              <div className="flex flex-col gap-4 lg:gap-6">
                {!isDescriptionVisible ? (
                  <button onClick={() => setIsDescriptionVisible(true)} className="text-sm sm:text-2xl lg:text-4xl font-black text-emerald-600 bg-emerald-50 px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-6 rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] border-2 sm:border-4 border-emerald-200 hover:bg-emerald-100 transition-all">REVELER LES CONSIGNES ❓</button>
                ) : (
                  <div className="bg-sky-50 p-4 sm:p-6 lg:p-10 rounded-xl sm:rounded-[2rem] lg:rounded-[3rem] border-2 sm:border-4 border-dashed border-sky-300 animate-in slide-in-from-bottom duration-300 max-h-[30vh] overflow-y-auto">
                    <p className="text-sm sm:text-2xl lg:text-4xl font-bold text-sky-900 leading-relaxed italic">{selectedChallenge.desc}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 sm:gap-4 lg:gap-8 justify-center mt-4 lg:mt-8">
                  <button onClick={() => { givePointToAll(); handleChallengeAction(true); }} className="bg-amber-400 text-white px-4 sm:px-8 lg:px-16 py-3 sm:py-4 lg:py-8 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] text-sm sm:text-2xl lg:text-4xl font-black shadow-[0_4px_0_rgb(180,83,9)] sm:shadow-[0_8px_0_rgb(180,83,9)] lg:shadow-[0_12px_0_rgb(180,83,9)] hover:scale-105 transition-all">1PT POUR TOUS 🏆</button>
                  <button onClick={() => handleChallengeAction(true)} className="bg-emerald-500 text-white px-4 sm:px-8 lg:px-16 py-3 sm:py-4 lg:py-8 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] text-sm sm:text-2xl lg:text-4xl font-black shadow-[0_4px_0_rgb(5,150,105)] sm:shadow-[0_8px_0_rgb(5,150,105)] lg:shadow-[0_12px_0_rgb(5,150,105)] hover:scale-105 transition-all">GARDER LE DÉFI 🔁</button>
                  <button onClick={() => handleChallengeAction(false)} className="bg-red-500 text-white px-4 sm:px-8 lg:px-16 py-3 sm:py-4 lg:py-8 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] text-sm sm:text-2xl lg:text-4xl font-black shadow-[0_4px_0_rgb(153,27,27)] sm:shadow-[0_8px_0_rgb(153,27,27)] lg:shadow-[0_12px_0_rgb(153,27,27)] hover:scale-105 transition-all">ENLEVER LE DÉFI 🗑️</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-sky-900/90 p-4 sm:p-6 lg:p-10 backdrop-blur-2xl">
            <div className="bg-white rounded-[2rem] sm:rounded-[4rem] p-6 sm:p-10 lg:p-16 max-w-4xl w-full text-center shadow-2xl border-[8px] sm:border-[16px] border-emerald-400 relative overflow-hidden">
              <h3 className="text-3xl sm:text-6xl lg:text-8xl font-black text-emerald-800 mb-6 sm:mb-10 uppercase italic">Félicitations !</h3>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto p-2 sm:p-4">
                {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-emerald-50 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border-2 sm:border-4 border-emerald-100 shadow-lg">
                    <div className="flex items-center gap-2 sm:gap-6">
                      <span className="text-xl sm:text-5xl">{i === 0 ? "🏆" : i === 1 ? "🥈" : i === 2 ? "🥉" : "👤"}</span>
                      <span className="text-xl sm:text-5xl">{p.avatar}</span>
                      <span className="text-sm sm:text-4xl font-black text-emerald-900 uppercase">{p.name}</span>
                    </div>
                    <span className="text-xl sm:text-5xl font-black text-amber-500">{p.score} PTS</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 justify-center mt-8 sm:mt-12">
                <button onClick={() => setShowLeaderboard(false)} className="bg-emerald-500 text-white px-8 sm:px-16 py-4 sm:py-6 rounded-full text-xl sm:text-4xl font-black shadow-[0_4px_0_rgb(5,150,105)] sm:shadow-[0_8px_0_rgb(5,150,105)] hover:scale-110 transition-all">RETOURNER AU JEU</button>
                <button onClick={resetScores} className="bg-red-500 text-white px-8 sm:px-16 py-4 sm:py-6 rounded-full text-xl sm:text-4xl font-black shadow-[0_4px_0_rgb(153,27,27)] sm:shadow-[0_8px_0_rgb(153,27,27)] hover:scale-110 transition-all">RÉINITIALISER TOUT 🔄</button>
              </div>
            </div>
          </div>
        )}

        {/* Global Settings Toggle */}
        <div className="absolute bottom-4 sm:bottom-6 lg:bottom-10 right-4 sm:right-6 lg:right-10 flex flex-col gap-2 sm:gap-4 z-30">
          <button onClick={givePointToAll} className="bg-white p-3 sm:p-4 lg:p-6 rounded-full shadow-2xl text-2xl sm:text-4xl lg:text-5xl hover:scale-110 transition-all border-2 sm:border-4 border-emerald-500 group relative">
            🏆
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-base font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">+1 PT TOUS !</span>
          </button>
          <button onClick={shuffleChallenges} className="bg-white p-3 sm:p-4 lg:p-6 rounded-full shadow-2xl text-2xl sm:text-4xl lg:text-5xl hover:scale-110 transition-all border-2 sm:border-4 border-amber-400 group relative">
            🔀
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-base font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">MÉLANGER !</span>
          </button>
          <button onClick={() => setIsWheelSettingsOpen(true)} className="bg-white p-3 sm:p-4 lg:p-6 rounded-full shadow-2xl text-2xl sm:text-4xl lg:text-6xl hover:rotate-90 transition-all duration-500 border-2 sm:border-4 border-emerald-500">⚙️</button>
        </div>

        {/* Full Settings Overlay */}
        {isWheelSettingsOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-2 sm:p-4 lg:p-10" onClick={() => setIsWheelSettingsOpen(false)}>
            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] lg:rounded-[4rem] p-4 sm:p-8 lg:p-12 w-full max-w-7xl max-h-[90vh] overflow-y-auto border-[6px] sm:border-[8px] lg:border-[12px] border-emerald-500 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 sm:mb-10">
                <h3 className="text-2xl sm:text-4xl lg:text-6xl font-black text-emerald-900 uppercase">Paramètres</h3>
                <button onClick={() => setIsWheelSettingsOpen(false)} aria-label="Fermer les paramètres" className="text-3xl sm:text-4xl lg:text-6xl font-black text-red-600 p-2">✕</button>
              </div>

              {/* Audio Settings */}
              <div className="mb-8 sm:mb-12 bg-emerald-50 p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[3rem] border-2 sm:border-4 border-emerald-100">
                <h4 className="text-xl sm:text-3xl lg:text-4xl font-black text-emerald-800 mb-4 sm:mb-6 uppercase">🎙️ Voix & Sons</h4>
                <div className="grid gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:gap-8">
                    <button 
                      onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                      className={`px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-6 rounded-xl sm:rounded-2xl text-sm sm:text-xl lg:text-3xl font-black transition-all ${isVoiceEnabled ? 'bg-emerald-500 text-white shadow-lg' : 'bg-gray-400 text-white shadow-md'}`}
                    >
                      {isVoiceEnabled ? 'VOIX ACTIVÉE' : 'VOIX DÉSACTIVÉE'}
                    </button>
                    <select 
                      value={selectedVoiceURI} 
                      onChange={(e) => setSelectedVoiceURI(e.target.value)}
                      className="flex-1 text-sm sm:text-xl lg:text-2xl p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-emerald-200 outline-none"
                    >
                      {availableVoices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-lg sm:text-2xl font-black text-emerald-700 uppercase">SON DE FINALE (facultatif) :</label>
                    <p className="text-base sm:text-lg font-bold text-emerald-700">Laisse vide pour la fanfare intégrée, ou colle un lien vers un fichier son.</p>
                    <input type="text" placeholder="Fanfare intégrée" value={finaleSoundUrl} onChange={e => setFinaleSoundUrl(e.target.value)} className="text-sm sm:text-xl p-3 sm:p-4 rounded-xl border-2 border-emerald-200 outline-none" />
                  </div>
                </div>
              </div>

              {/* Portability & Presets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
                <div className="bg-amber-50 p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[3rem] border-2 sm:border-4 border-amber-100">
                  <h4 className="text-xl sm:text-3xl lg:text-4xl font-black text-amber-800 mb-4 sm:mb-6 uppercase">💾 Sauvegarde & Portabilité</h4>
                  <p className="text-sm sm:text-xl font-bold text-amber-700 mb-4 sm:mb-6 italic">Exportez votre configuration pour l'utiliser sur un autre ordinateur.</p>
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <button onClick={exportConfig} className="bg-amber-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-xl font-black shadow-lg hover:bg-amber-600 transition-all">EXPORTER (.json)</button>
                    <label className="bg-sky-500 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-xl font-black shadow-lg hover:bg-sky-600 transition-all cursor-pointer">
                      IMPORTER
                      <input type="file" accept=".json" onChange={importConfig} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="bg-teal-50 p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[3rem] border-2 sm:border-4 border-teal-100">
                  <h4 className="text-xl sm:text-3xl lg:text-4xl font-black text-teal-800 mb-4 sm:mb-6 uppercase">📚 Mes Configurations</h4>
                  <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <input 
                      type="text" placeholder="NOM..." value={newPresetName} 
                      onChange={e => setNewPresetName(e.target.value)} 
                      className="flex-1 text-sm sm:text-xl p-3 sm:p-4 rounded-xl border-2 border-teal-200 outline-none font-bold"
                    />
                    <button onClick={saveCurrentAsPreset} className="bg-teal-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl text-sm sm:text-xl font-black shadow-lg">SAUVER</button>
                  </div>
                  <div className="space-y-2 sm:space-y-3 max-h-40 overflow-y-auto pr-2">
                    {presets.map(p => (
                      <div key={p.id} className="bg-white p-3 sm:p-4 rounded-xl flex items-center justify-between shadow-sm border border-teal-100">
                        <span className="text-sm sm:text-xl font-black text-teal-900 truncate mr-2 sm:mr-4 uppercase">{p.name}</span>
                        <div className="flex gap-2">
                          <button onClick={() => loadPreset(p)} className="bg-emerald-100 text-emerald-700 px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-bold text-base">CHARGER</button>
                          <button onClick={() => deletePreset(p.id)} aria-label={`Supprimer ${p.name}`} className="text-red-600 hover:text-red-700 text-2xl p-1">✕</button>
                        </div>
                      </div>
                    ))}
                    {presets.length === 0 && <p className="text-teal-600 italic text-sm">Aucune configuration enregistrée.</p>}
                  </div>
                </div>
              </div>

              {/* Challenge Management */}
              <div className="bg-sky-50 p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[3rem] border-2 sm:border-4 border-sky-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10">
                  <h4 className="text-xl sm:text-3xl lg:text-4xl font-black text-sky-800 uppercase">🎡 Liste des Défis ({challenges.length})</h4>
                  <button onClick={shuffleChallenges} className="bg-amber-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-xl font-black shadow-md hover:scale-105 transition-all">🔀 MÉLANGER LA ROUE</button>
                </div>
                <div className="grid gap-4 mb-8 sm:mb-12">
                  <input 
                    type="text" placeholder="TITRE DU DÉFI..." value={newChallengeText} 
                    onChange={e => setNewChallengeText(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && addChallenge()}
                    className="text-sm sm:text-xl lg:text-2xl p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-sky-200 outline-none font-bold" 
                  />
                  <textarea placeholder="DESCRIPTION / CONSIGNES..." value={newChallengeDesc} onChange={e => setNewChallengeDesc(e.target.value)} className="text-sm sm:text-xl lg:text-2xl p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-sky-200 outline-none font-bold h-20 sm:h-24 lg:h-32" />
                  <button onClick={addChallenge} className="bg-sky-500 text-white py-3 sm:py-4 lg:py-6 rounded-xl sm:rounded-2xl text-lg sm:text-2xl lg:text-3xl font-black shadow-lg">AJOUTER LE DÉFI</button>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {challenges.map((c, i) => (
                    <div key={i} className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl flex items-center justify-between shadow-md border-2 border-sky-100">
                      <div className="flex-1 pr-4 sm:pr-10 min-w-0">
                        <p className="text-sm sm:text-2xl lg:text-3xl font-black text-sky-900 leading-none mb-1 sm:mb-2 truncate uppercase">{c.text}</p>
                        <p className="text-xs sm:text-lg lg:text-xl font-bold text-sky-600 truncate italic">{c.desc}</p>
                      </div>
                      <button onClick={() => setChallenges(challenges.filter((_, idx) => idx !== i))} className="text-xl sm:text-3xl lg:text-4xl p-2 sm:p-3 lg:p-4 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl">🗑️</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {notice && (
          <MessageModal title="Information" message={notice} buttons={[{ label: "OK", onClick: () => setNotice(null) }]} onClose={() => setNotice(null)} />
        )}
      </div>
    </div>
  );
};

export default App;

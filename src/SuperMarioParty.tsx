import React, { useState, useEffect, useRef } from 'react';
import { MessageModal, CountdownTimer } from './ui';
import ScoreBoard from './ScoreBoard';
import { defaultTeams, parseTeams, type Team } from './teams';

// Image du plateau (ex. "/plateau.png" après l'avoir copiée dans le dossier public/). Vide = message "bientôt".
const BOARD_IMAGE = "";

// --- DATA STRUCTURES ---
interface Step {
  icon: string;
  text: string;
}

interface Item {
  name: string;
  desc: string; // texte complet (détails pour l'animateur)
  icon: string;
  steps?: Step[]; // consignes courtes pour l'écran TV
  timer?: number; // durée (en secondes) d'un chrono à proposer
}

const MINI_GAMES: Item[] = [
  {
    name: "Penalty", icon: "⚽",
    steps: [
      { icon: "⚽", text: "Un joueur de chaque équipe tire un penalty." },
      { icon: "🧤", text: "Le gardien change à chaque tir." },
      { icon: "🏆", text: "Chaque joueur tire une seule fois." }
    ],
    desc: "Un joueur de chaque équipe doit faire un penalty avec un gros ballon. Chaque joueur tire une fois, les gardiens changent aussi à chaque tir."
  },
  {
    name: "Relais Puzzle", icon: "🧩",
    steps: [
      { icon: "🏃", text: "En file derrière ton plot de départ." },
      { icon: "🧩", text: "Cours chercher une pièce de puzzle sous un plot." },
      { icon: "🖐️", text: "Reviens vite et tape dans la main du suivant." },
      { icon: "🏆", text: "Puzzle fini en premier = victoire !" }
    ],
    desc: "Les équipes se placent en file indienne derrière leur plot de départ. Au signal, le premier enfant de chaque équipe sprinte jusqu'à l'autre bout du parcours pour récupérer une pièce de puzzle cachée sous un plot, puis fait le trajet retour le plus vite possible pour taper dans la main de son coéquipier. Le relais s'enchaîne ainsi, un joueur à la fois, jusqu'à ce que l'équipe ait ramené toutes ses pièces et puisse assembler complètement son puzzle pour remporter la manche."
  },
  {
    name: "Courses Bizarres", icon: "🧠",
    steps: [
      { icon: "🏃", text: "Le 1er court normalement jusqu'à l'animateur." },
      { icon: "🤫", text: "L'animateur lui donne une façon bizarre de se déplacer." },
      { icon: "🖐️", text: "Il revient en courant et dit la consigne au suivant." },
      { icon: "🦘", text: "Le suivant y va en bougeant de cette façon !" }
    ],
    desc: "Les équipes se placent en file indienne derrière leur plot de départ. Au signal, le premier enfant court normalement jusqu'à son animateur situé au bout du parcours, qui lui confie alors une consigne de déplacement spécifique écrite, destinée exclusivement au joueur suivant. L'enfant fait le trajet retour en courant, tape dans la main de son coéquipier et lui transmet la consigne : ce deuxième joueur s'élance alors en effectuant le mouvement demandé jusqu'à l'animateur pour récupérer la consigne du troisième, et le relais continue ainsi jusqu'à ce que toute l'équipe soit passée."
  },
  {
    name: "Relais Plot", icon: "🎯",
    steps: [
      { icon: "🏃", text: "En file derrière ton plot de départ." },
      { icon: "🎯", text: "Cours chercher un plot de la couleur de ton équipe." },
      { icon: "🖐️", text: "Reviens vite et tape dans la main du suivant." },
      { icon: "🏆", text: "Tous les plots ramenés = victoire !" }
    ],
    desc: "Les équipes se placent en file indienne derrière leur plot de départ. Au top départ, le premier enfant de chaque équipe sprinte jusqu'au bout du parcours pour récupérer un plot de la couleur assignée à son équipe, puis fait le trajet retour le plus vite possible. Il tape dans la main du joueur suivant pour lui passer le relais, et l'action se répète ainsi, un enfant à la fois, jusqu'à ce que toute l'équipe ait terminé le parcours ou que tous les plots de couleur soient ramenés."
  },
  {
    name: "Lapin Chasseur", icon: "🐇",
    steps: [
      { icon: "⭕", text: "La moitié de chaque équipe entre dans le cercle." },
      { icon: "🎾", text: "Les animateurs lancent des ballons en mousse." },
      { icon: "💨", text: "Touché = tu sors ! Esquive le plus longtemps possible." },
      { icon: "⭐", text: "L'équipe du dernier survivant gagne 1 point. Puis on change !" }
    ],
    desc: "Pour commencer, la moitié des joueurs de chaque équipe prend place à l'intérieur d'un grand cercle délimité par des plots. Depuis l'extérieur de la zone, les animateurs lancent des ballons en mousse pour viser les enfants : dès qu'un joueur est touché par un ballon, il est éliminé et doit immédiatement sortir du cercle. Les enfants doivent esquiver les tirs le plus longtemps possible, car l'équipe du dernier survivant encore présent sur le terrain remporte 1 point. Une fois cette première manche terminée, la seconde moitié des joueurs prend place au centre du cercle pour s'affronter exactement de la même manière."
  },
  {
    name: "Toad a dit", icon: "🍄",
    steps: [
      { icon: "📣", text: "Le maître du jeu annonce un critère : taille, couleur, prénoms…" },
      { icon: "↔️", text: "Mettez-vous en ligne le plus vite possible !" },
      { icon: "🪑", text: "Ligne finie ? Tout le monde s'assoit." },
      { icon: "⭐", text: "Ligne sans erreur = 1 point. Premier = 1 point en plus !" }
    ],
    desc: "Chaque animateur se place dans un espace distinct de la pièce avec son équipe. Le maître du jeu annonce un critère de tri spécifique (par ordre de taille, par couleur, par ordre alphabétique des prénoms, etc.) et les membres de chaque équipe doivent s'aligner le plus vite possible en respectant cette consigne. Dès qu'une équipe a terminé de se ranger, tous ses joueurs s'assoient par terre pour figer leur position, ce qui permet au maître du jeu de noter l'ordre de rapidité de chacun. Une fois toutes les équipes assises, le maître du jeu passe vérifier chaque ligne : un classement sans aucune erreur rapporte 1 point à l'équipe, avec 1 point bonus supplémentaire accordé à celle qui a terminé en premier de manière valide, avant de relancer la manche suivante avec un nouveau critère."
  },
  {
    name: "Relais Chifumi", icon: "✊",
    steps: [
      { icon: "⚔️", text: "Duels : 1er contre 6e, 2e contre 5e, 3e contre 4e." },
      { icon: "🦘", text: "Saute de cerceau en cerceau." },
      { icon: "✊", text: "Face à face ? Pierre-feuille-ciseaux !" },
      { icon: "🔁", text: "Le perdant retourne au bout de sa file, le gagnant avance." },
      { icon: "🏆", text: "Arrive au bout = 1 point. Duel final gagné = 5 pièces !" }
    ],
    desc: "Les équipes s'affrontent en duel selon leur classement sur le plateau (le 1er contre le 6ème, le 2ème contre le 5ème, et le 3ème contre le 4ème) sur un parcours de cerceaux délimité par un plot à chaque extrémité. Chaque équipe se place en file indienne derrière son plot et, au signal, le premier joueur de chaque camp s'élance simultanément en sautant de cerceau en cerceau. Dès que les deux adversaires se retrouvent face à face sur le parcours, ils s'affrontent au shifumi (pierre-feuille-ciseaux) : le perdant doit quitter le chemin pour retourner à la fin de sa file, déclenchant immédiatement le départ de son coéquipier suivant, tandis que le gagnant continue d'avancer. Si un joueur réussit à traverser l'intégralité du parcours jusqu'au plot adverse, son équipe marque un point, et l'équipe qui remporte le duel final gagne un total de 5 pièces."
  },
  {
    name: "1, 2, 3 Boo", icon: "☀️",
    steps: [
      { icon: "🧱", text: "Tout le monde part dos au mur." },
      { icon: "🗣️", text: "Le maître du jeu dit « 1, 2, 3 Boo ! » puis se retourne." },
      { icon: "🛑", text: "Celui qui bouge retourne au mur." },
      { icon: "🏆", text: "Le premier qui touche le mur du maître du jeu gagne !" }
    ],
    desc: "C'est un 1, 2, 3 soleil : tous les enfants partent dos au mur, le maître du jeu compte « 1, 2, 3 soleil » et se retourne. Ceux qui bougent sont éliminés et retournent contre le mur. Le gagnant est celui qui touche le mur du maître du jeu."
  },
  {
    name: "Toad Explorateur", icon: "🔭", timer: 30,
    steps: [
      { icon: "🎈", text: "4 ballons sont donnés au hasard. Tout le monde se déplace." },
      { icon: "👉", text: "Passe ton ballon en touchant un joueur avec. Ne le lance pas !" },
      { icon: "⏱️", text: "Toutes les 30 secondes : ballon dans les mains = éliminé !" },
      { icon: "⭐", text: "Les 4 derniers gagnent 1 point chacun pour leur équipe." }
    ],
    desc: "Tous les enfants jouent simultanément et peuvent se déplacer librement dans l'espace de jeu, à l'exception du plateau et des zones hors de la vue des animateurs. Au début de la manche, quatre ballons sont distribués au hasard parmi les joueurs. L'objectif est de se débarrasser du ballon en touchant simplement un adversaire avec, sans jamais le lancer ou le jeter, pour lui transmettre la balle. Toutes les 30 secondes, le maître du jeu donne un signal : les joueurs qui tiennent un ballon entre leurs mains à cet instant précis sont immédiatement éliminés. La partie se poursuit sur ce rythme effréné jusqu'à ce qu'il ne reste plus que quatre survivants, qui remportent alors chacun un point pour leur équipe."
  }
];

const BONUSES: Item[] = [
  { name: "PIÈCES", icon: "🪙", desc: "L'équipe gagne tout de suite +10 pièces d'or !" },
  { name: "DOUBLE DÉ", icon: "🎲", desc: "Au prochain tour, l'équipe pourra lancer deux dés." },
  { name: "VOL DE PIÈCES", icon: "🧲", desc: "Vole 5 pièces à une autre équipe." },
  { name: "TUYAU DORÉ", icon: "🆙", desc: "Tu peux te placer où tu veux sur le plateau." },
  { name: "PROTECTION", icon: "🛡️", desc: "Tu ne subis pas les malus des cases rouges et noires." },
  { name: "REJOUER", icon: "🔙", desc: "Rejoue ton tour." },
  { name: "SUPER PROMO", icon: "🎟️", desc: "Ta prochaine étoile te coûte 5 pièces de moins." },
  { name: "TUYAU VOLEUR", icon: "🦹", desc: "Tu peux voler la place d'une autre équipe sur le plateau." },
  { name: "PETIT TRÉSOR", icon: "💰", desc: "Gagne 3 pièces." },
  { name: "TURBO AVANCE", icon: "🚀", desc: "Avance tout de suite de 5 cases sur le plateau." }
];

const MALUSES: Item[] = [
  { name: "PIÈCES PERDUES", icon: "💸", desc: "Tu perds 5 pièces d'or !" },
  { name: "GLISSADE", icon: "🐌", desc: "Recule de 3 cases sur le plateau." },
  { name: "CADEAU FORCÉ", icon: "🎁", desc: "Tu donnes 3 pièces à une autre équipe." },
  { name: "OBJET PERDU", icon: "👻", desc: "Tu ne gagnes pas de pièce sur ta prochaine case verte." },
  { name: "TÉLÉPORTATION", icon: "🌪️", desc: "Échange ta place sur le plateau avec l'équipe la plus proche du départ." },
  { name: "CASE KAMEK", icon: "🧙", desc: "Ta prochaine étoile te coûte 5 pièces de plus." }
];

const RULES_STEPS = [
  { title: "1. Matériel", desc: "Gros dés en mousse, un gros ballon, beaucoup de cerceaux (environ 35), des feuilles pour les puzzles et pour la course, plein de plots de 6 couleurs différentes, plein de balles en mousse et les cases du plateau. Ensuite, prépare le plateau grâce au bouton CARTE." },
  { title: "2. Début du jeu", desc: "Le maître du jeu choisit l'ordre de passage des équipes. Ensuite, le premier joueur lance le dé et on joue la phase de plateau normale. Dès que tout le monde est passé, on passe au mini-jeu." },
  { title: "3. Classement", desc: "L'équipe qui finit première gagne 5 pièces, la deuxième 3 pièces, la troisième 1 pièce." },
  { title: "4. Fin du jeu", desc: "Dès que le maître du jeu le décide, on passe à la fin du jeu. Il compte les pièces et les étoiles : l'équipe qui en a le plus gagne, mais les étoiles comptent plus que les pièces. Donc une équipe avec 1 étoile et 0 pièce bat une équipe avec 100 pièces et 0 étoile." }
];

// --- COMPONENT ---

const SuperMarioParty: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeItems, setActiveItems] = useState<Item[] | null>(null);
  const [remainingMiniGames, setRemainingMiniGames] = useState<Item[]>(() => {
    const saved = localStorage.getItem('mario_party_remaining_games');
    if (!saved) return MINI_GAMES;
    try {
      const names = new Set((JSON.parse(saved) as Item[]).map(g => g.name));
      const kept = MINI_GAMES.filter(g => names.has(g.name));
      return kept.length > 0 ? kept : MINI_GAMES;
    } catch {
      return MINI_GAMES;
    }
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDesc, setShowDesc] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [guideStep, setGuideStep] = useState<number | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<'games' | 'scores' | null>(null);
  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      return parseTeams(JSON.parse(localStorage.getItem('mario_party_teams') ?? 'null')) ?? defaultTeams();
    } catch {
      return defaultTeams();
    }
  });

  const spinTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem('mario_party_teams', JSON.stringify(teams));
  }, [teams]);

  const closeResult = () => {
    window.clearTimeout(spinTimer.current);
    setIsSpinning(false);
    setActiveItems(null);
    setSelectedItem(null);
  };

  // Clavier / télécommande : Échap ferme, flèches changent d'étape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (notice || confirmReset) return; // gérés par la fenêtre de message
      const steps = selectedItem?.steps;
      const stepsOpen = !!steps && showDesc && !showDetails && !isSpinning;
      if (e.key === 'Escape') {
        if (showScores) setShowScores(false);
        else if (showBoard) setShowBoard(false);
        else if (guideStep !== null) setGuideStep(null);
        else if (activeItems) closeResult();
      } else if (e.key === 'ArrowRight') {
        if (stepsOpen && steps) setStepIndex((i) => Math.min(i + 1, steps.length - 1));
        else if (guideStep !== null) setGuideStep((g) => (g === null ? g : Math.min(g + 1, RULES_STEPS.length - 1)));
      } else if (e.key === 'ArrowLeft') {
        if (stepsOpen) setStepIndex((i) => Math.max(i - 1, 0));
        else if (guideStep !== null) setGuideStep((g) => (g === null ? g : Math.max(g - 1, 0)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const resetMiniGames = () => {
    setRemainingMiniGames(MINI_GAMES);
    setConfirmReset(null);
  };

  const resetScores = () => {
    setTeams(defaultTeams());
    setConfirmReset(null);
  };

  const exportParty = () => {
    const data = { version: 1, teams, remainingMiniGames: remainingMiniGames.map((g) => g.name) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `mario_party_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importParty = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const loaded = parseTeams(data.teams);
        if (!loaded) throw new Error('format');
        setTeams(loaded);
        if (Array.isArray(data.remainingMiniGames)) {
          const names = new Set<string>(data.remainingMiniGames);
          setRemainingMiniGames(MINI_GAMES.filter((g) => names.has(g.name)));
        }
        setNotice('Partie chargée !');
      } catch {
        setNotice("Ce fichier n'est pas une partie valide.");
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => () => window.clearTimeout(spinTimer.current), []);

  useEffect(() => {
    localStorage.setItem('mario_party_remaining_games', JSON.stringify(remainingMiniGames));
  }, [remainingMiniGames]);

  const startSpin = (items: Item[], isMiniGame: boolean = false) => {
    const pool = isMiniGame ? remainingMiniGames : items;
    
    if (isMiniGame && pool.length === 0) {
      setNotice("Tous les mini-jeux ont été joués ! La liste est remise à zéro, tu peux relancer.");
      setRemainingMiniGames(MINI_GAMES);
      return;
    }

    setActiveItems(pool);
    setSelectedItem(null);
    setShowDesc(false);
    setIsSpinning(true);
    setCurrentIndex(0); // Reset index to avoid out-of-bounds error from previous spins
    
    // Le résultat est choisi d'avance : le défilement ralentit puis s'arrête dessus.
    const finalIndex = Math.floor(Math.random() * pool.length);
    const minSteps = 20;
    const totalSteps = minSteps + ((finalIndex - minSteps) % pool.length + pool.length) % pool.length;
    let step = 0;

    const tick = () => {
      step++;
      setCurrentIndex(step % pool.length);

      if (step >= totalSteps) {
        const result = pool[finalIndex];
        setSelectedItem(result);
        setIsSpinning(false);
        if (isMiniGame) {
          setRemainingMiniGames(prev => prev.filter(g => g.name !== result.name));
        }
        return;
      }

      // 60 ms au début, jusqu'à ~500 ms sur les derniers pas
      const progress = step / totalSteps;
      spinTimer.current = window.setTimeout(tick, 60 + 440 * progress ** 3);
    };
    spinTimer.current = window.setTimeout(tick, 60);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-emerald-500 to-yellow-400 p-4 sm:p-6 lg:p-12 font-kids flex flex-col items-center overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-7xl flex flex-col sm:flex-row justify-between items-center bg-white/30 backdrop-blur-xl p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border-4 border-white mb-6 sm:mb-10 gap-4">
        <button onClick={onBack} className="bg-white/90 px-6 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-2xl text-xl sm:text-3xl font-black text-blue-600 hover:scale-110 transition-all shadow-xl w-full sm:w-auto">
          ← ACCUEIL
        </button>
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white uppercase drop-shadow-[0_5px_0_rgba(0,0,0,0.2)] leading-none">
            Mario Party <span className="text-yellow-300">TV</span>
          </h1>
          {remainingMiniGames.length < MINI_GAMES.length && (
            <p className="text-white font-bold bg-black/20 px-4 py-1 rounded-full mt-2 text-base sm:text-lg">
              Jeux restants : {remainingMiniGames.length}/{MINI_GAMES.length}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
          <button onClick={() => setShowScores(true)} className="flex-1 sm:flex-none bg-purple-600 px-4 sm:px-8 py-3 sm:py-5 rounded-xl sm:rounded-2xl text-base sm:text-xl lg:text-3xl font-black text-white hover:scale-110 transition-all shadow-xl border-2 sm:border-4 border-white">
            SCORES 🏆
          </button>
          <button onClick={() => setConfirmReset('games')} aria-label="Remettre tous les mini-jeux dans la roue" title="Remettre tous les mini-jeux" className="bg-white/90 px-4 sm:px-6 py-3 sm:py-5 rounded-xl sm:rounded-2xl text-base sm:text-xl lg:text-3xl font-black text-blue-700 hover:scale-110 transition-all shadow-xl border-2 sm:border-4 border-white">
            ↺ JEUX
          </button>
          <button onClick={() => setShowBoard(true)} className="flex-1 sm:flex-none bg-sky-500 px-4 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-2xl text-sm sm:text-xl lg:text-3xl font-black text-white hover:scale-110 transition-all shadow-xl border-2 sm:border-4 border-white">
            CARTE 🗺️
          </button>
          <button onClick={() => setGuideStep(0)} className="flex-1 sm:flex-none bg-amber-400 px-4 sm:px-10 py-3 sm:py-5 rounded-xl sm:rounded-2xl text-sm sm:text-xl lg:text-3xl font-black text-white hover:scale-110 transition-all shadow-xl border-2 sm:border-4 border-white animate-pulse">
            GUIDE 📖
          </button>
        </div>
      </div>

      {/* Main Wheel Buttons - Bigger & Better Layout */}
      <div className="flex-1 w-full max-w-[90rem] grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-12 items-center overflow-y-auto sm:overflow-hidden p-4">
        <button 
          onClick={() => startSpin(MINI_GAMES, true)}
          className="group h-48 sm:h-64 lg:h-[35rem] bg-gradient-to-b from-pink-500 to-purple-700 rounded-[2rem] sm:rounded-[3rem] lg:rounded-[5rem] border-4 sm:border-[8px] lg:border-[12px] border-white shadow-[0_10px_0_rgba(0,0,0,0.3)] sm:shadow-[0_20px_0_rgba(0,0,0,0.3)] lg:shadow-[0_30px_0_rgba(0,0,0,0.3)] hover:translate-y-2 sm:hover:translate-y-6 hover:shadow-none transition-all flex flex-row lg:flex-col items-center justify-center p-6 lg:p-12 text-center relative overflow-hidden"
        >
          <div className="text-6xl sm:text-8xl lg:text-[12rem] group-hover:rotate-12 transition-transform drop-shadow-2xl">🎮</div>
          <h2 className="text-2xl sm:text-4xl lg:text-7xl font-black text-white uppercase ml-4 lg:ml-0 lg:mt-6 leading-[0.9] tracking-tighter">MINI JEUX</h2>
          {remainingMiniGames.length === 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl sm:text-4xl font-black rotate-12">VIDE !</div>}
        </button>

        <button 
          onClick={() => startSpin(BONUSES)}
          className="group h-48 sm:h-64 lg:h-[35rem] bg-gradient-to-b from-yellow-300 to-amber-600 rounded-[2rem] sm:rounded-[3rem] lg:rounded-[5rem] border-4 sm:border-[8px] lg:border-[12px] border-white shadow-[0_10px_0_rgba(0,0,0,0.3)] sm:shadow-[0_20px_0_rgba(0,0,0,0.3)] lg:shadow-[0_30px_0_rgba(0,0,0,0.3)] hover:translate-y-2 sm:hover:translate-y-6 hover:shadow-none transition-all flex flex-row lg:flex-col items-center justify-center p-6 lg:p-12 text-center"
        >
          <div className="text-6xl sm:text-8xl lg:text-[12rem] group-hover:scale-110 transition-transform drop-shadow-2xl">🎁</div>
          <h2 className="text-2xl sm:text-4xl lg:text-7xl font-black text-white uppercase ml-4 lg:ml-0 lg:mt-6 leading-[0.9] tracking-tighter">BONUS</h2>
        </button>

        <button 
          onClick={() => startSpin(MALUSES)}
          className="group h-48 sm:h-64 lg:h-[35rem] bg-gradient-to-b from-red-500 to-red-900 rounded-[2rem] sm:rounded-[3rem] lg:rounded-[5rem] border-4 sm:border-[8px] lg:border-[12px] border-white shadow-[0_10px_0_rgba(0,0,0,0.3)] sm:shadow-[0_20px_0_rgba(0,0,0,0.3)] lg:shadow-[0_30px_0_rgba(0,0,0,0.3)] hover:translate-y-2 sm:hover:translate-y-6 hover:shadow-none transition-all flex flex-row lg:flex-col items-center justify-center p-6 lg:p-12 text-center"
        >
          <div className="text-6xl sm:text-8xl lg:text-[12rem] group-hover:-rotate-12 transition-transform drop-shadow-2xl">💀</div>
          <h2 className="text-2xl sm:text-4xl lg:text-7xl font-black text-white uppercase ml-4 lg:ml-0 lg:mt-6 leading-[0.9] tracking-tighter">MALUS</h2>
        </button>
      </div>

      {/* Animation & Result Overlay */}
      {(isSpinning || selectedItem) && activeItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-2 sm:p-6">
          <div className="bg-white rounded-[2rem] sm:rounded-[4rem] lg:rounded-[6rem] p-6 sm:p-12 lg:p-20 w-full max-w-7xl text-center border-[10px] sm:border-[25px] border-blue-500 shadow-[0_0_150px_rgba(59,130,246,0.6)] animate-in zoom-in duration-300 overflow-y-auto max-h-[95vh]">
            
            {isSpinning ? (
              <div className="flex flex-col items-center gap-6 sm:gap-12">
                <div className="text-8xl sm:text-[12rem] lg:text-[15rem] animate-bounce">{activeItems[currentIndex]?.icon}</div>
                <div className="h-20 sm:h-40 flex items-center justify-center">
                  <p className="text-3xl sm:text-6xl lg:text-[9rem] font-black text-blue-600 uppercase tracking-tighter leading-none italic animate-pulse">
                    {activeItems[currentIndex]?.name}
                  </p>
                </div>
                <button onClick={closeResult} className="bg-gray-200 text-gray-800 px-8 sm:px-14 py-3 sm:py-5 rounded-2xl text-xl sm:text-3xl font-black hover:bg-gray-300 transition-all">
                  ✕ ANNULER
                </button>
              </div>
            ) : selectedItem && (
              <div className="flex flex-col items-center gap-6 sm:gap-10">
                {!showDesc ? (
                  <>
                    <p className="text-xl sm:text-4xl lg:text-5xl font-black text-gray-600 uppercase tracking-widest mb-2 sm:mb-4 italic">Le destin a choisi :</p>
                    <div className="text-8xl sm:text-[12rem] lg:text-[15rem] drop-shadow-2xl">{selectedItem.icon}</div>
                    <h3 className="text-4xl sm:text-7xl lg:text-[11rem] font-black text-blue-700 leading-none uppercase tracking-tighter mb-4 sm:mb-10">
                      {selectedItem.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full">
                      <button 
                        onClick={() => { setStepIndex(0); setShowDetails(false); setShowDesc(true); }}
                        className="flex-1 bg-amber-400 text-white py-6 sm:py-10 rounded-2xl sm:rounded-[3rem] text-2xl sm:text-5xl font-black shadow-[0_10px_0_rgb(180,83,9)] sm:shadow-[0_15px_0_rgb(180,83,9)] hover:scale-105 active:translate-y-4 active:shadow-none transition-all"
                      >
                        CONSIGNES 📋
                      </button>
                      <button 
                        onClick={() => { setActiveItems(null); setSelectedItem(null); }}
                        className="flex-1 bg-emerald-500 text-white py-6 sm:py-10 rounded-2xl sm:rounded-[3rem] text-2xl sm:text-5xl font-black shadow-[0_10px_0_rgb(5,150,105)] sm:shadow-[0_15px_0_rgb(5,150,105)] hover:scale-105 active:translate-y-4 active:shadow-none transition-all"
                      >
                        C'EST PARTI ! 👍
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-6 sm:gap-10 animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center justify-center gap-4 sm:gap-6">
                      <span className="text-4xl sm:text-8xl">{selectedItem.icon}</span>
                      <h3 className="text-3xl sm:text-7xl font-black text-blue-700 uppercase tracking-tighter">{selectedItem.name}</h3>
                    </div>
                    {selectedItem.steps && !showDetails ? (
                      <>
                        <div className="flex justify-center gap-2 sm:gap-4">
                          {selectedItem.steps.map((_, i) => (
                            <span key={i} className={`h-3 sm:h-5 w-10 sm:w-20 rounded-full ${i <= stepIndex ? 'bg-blue-500' : 'bg-blue-100'}`} />
                          ))}
                        </div>
                        <div className="bg-blue-50 p-6 sm:p-12 rounded-[2rem] sm:rounded-[4rem] border-4 sm:border-[12px] border-dashed border-blue-200 flex flex-col items-center gap-4 sm:gap-8 min-h-[14rem] sm:min-h-[26rem] justify-center">
                          <span className="text-7xl sm:text-[10rem]">{selectedItem.steps[stepIndex].icon}</span>
                          <p className="text-2xl sm:text-5xl lg:text-7xl font-black text-blue-900 leading-tight">
                            {selectedItem.steps[stepIndex].text}
                          </p>
                        </div>
                        <div className="flex gap-4 sm:gap-8">
                          <button
                            disabled={stepIndex === 0}
                            onClick={() => setStepIndex(stepIndex - 1)}
                            className={`flex-1 py-4 sm:py-10 rounded-2xl sm:rounded-[3rem] text-2xl sm:text-5xl font-black transition-all ${stepIndex === 0 ? 'bg-gray-200 text-gray-400' : 'bg-amber-400 text-white shadow-[0_10px_0_rgb(180,83,9)] hover:scale-105 active:translate-y-4 active:shadow-none'}`}
                          >
                            ⬅
                          </button>
                          {stepIndex < selectedItem.steps.length - 1 ? (
                            <button
                              onClick={() => setStepIndex(stepIndex + 1)}
                              className="flex-[3] bg-blue-500 text-white py-4 sm:py-10 rounded-2xl sm:rounded-[3rem] text-2xl sm:text-5xl font-black shadow-[0_10px_0_rgb(29,78,216)] hover:scale-105 active:translate-y-4 active:shadow-none transition-all"
                            >
                              SUIVANT ➜
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowDesc(false)}
                              className="flex-[3] bg-emerald-500 text-white py-4 sm:py-10 rounded-2xl sm:rounded-[3rem] text-2xl sm:text-5xl font-black shadow-[0_10px_0_rgb(5,150,105)] hover:scale-105 active:translate-y-4 active:shadow-none transition-all"
                            >
                              OK, J'AI COMPRIS !
                            </button>
                          )}
                        </div>
                        {selectedItem.timer && <CountdownTimer key={selectedItem.name} seconds={selectedItem.timer} />}
                        <button
                          onClick={() => setShowDetails(true)}
                          className="text-base sm:text-2xl font-bold text-blue-700 underline"
                        >
                          Détails pour l'animateur 🧑‍🏫
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="bg-blue-50 p-6 sm:p-16 rounded-[2rem] sm:rounded-[4rem] border-4 sm:border-[12px] border-dashed border-blue-200">
                          <p className={`font-black text-blue-900 leading-tight ${selectedItem.steps ? 'text-lg sm:text-2xl lg:text-3xl text-left' : 'text-2xl sm:text-5xl lg:text-7xl'}`}>
                            {selectedItem.desc}
                          </p>
                        </div>
                        <button
                          onClick={() => selectedItem.steps ? setShowDetails(false) : setShowDesc(false)}
                          className="bg-emerald-500 text-white py-6 sm:py-12 rounded-2xl sm:rounded-[3rem] text-2xl sm:text-6xl font-black shadow-[0_10px_0_rgb(5,150,105)] sm:shadow-[0_20px_0_rgb(5,150,105)] hover:scale-110 active:translate-y-4 active:shadow-none transition-all"
                        >
                          {selectedItem.steps ? '⬅ RETOUR AUX ÉTAPES' : "OK, J'AI COMPRIS !"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guide Steps Modal */}
      {guideStep !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-amber-950/95 backdrop-blur-xl p-2 sm:p-6">
          <div className="bg-white rounded-[2rem] sm:rounded-[5rem] p-6 sm:p-12 lg:p-16 w-full max-w-6xl border-[10px] sm:border-[20px] border-amber-400 shadow-2xl relative overflow-y-auto max-h-[95vh]">
            <button onClick={() => setGuideStep(null)} aria-label="Fermer le guide" className="absolute top-4 sm:top-10 right-4 sm:right-10 text-3xl sm:text-6xl font-black text-red-600 hover:text-red-700 p-2">✕</button>
            <div className="flex flex-col gap-6 sm:gap-12">
              <div className="text-center">
                <p className="text-xl sm:text-4xl font-black text-amber-500 mb-2 sm:mb-4 uppercase">Le manuel du MJ</p>
                <h2 className="text-3xl sm:text-5xl lg:text-[7rem] font-black text-amber-600 leading-none tracking-tighter">
                  {RULES_STEPS[guideStep].title}
                </h2>
              </div>
              <div className="bg-amber-50 p-6 sm:p-16 rounded-3xl sm:rounded-[4rem] border-4 sm:border-8 border-dashed border-amber-200 min-h-[10rem] sm:min-h-[20rem] flex items-center justify-center">
                <p className="text-xl sm:text-4xl lg:text-6xl font-black text-amber-900 text-center leading-[1.1]">
                  {RULES_STEPS[guideStep].desc}
                </p>
              </div>
              <div className="flex gap-4 sm:gap-8">
                <button disabled={guideStep === 0} onClick={() => setGuideStep(guideStep - 1)} className={`flex-1 py-4 sm:py-10 rounded-xl sm:rounded-[2.5rem] text-xl sm:text-5xl font-black shadow-xl transition-all ${guideStep === 0 ? 'bg-gray-200 text-gray-400 shadow-none' : 'bg-white text-amber-600 border-2 sm:border-4 border-amber-400 hover:bg-amber-50'}`}>RETOUR</button>
                <button onClick={() => guideStep === RULES_STEPS.length - 1 ? setGuideStep(null) : setGuideStep(guideStep + 1)} className="flex-[2] py-4 sm:py-10 rounded-xl sm:rounded-[2.5rem] text-xl sm:text-5xl font-black shadow-[0_10px_0_rgb(180,83,9)] sm:shadow-[0_15px_0_rgb(180,83,9)] bg-amber-500 text-white hover:scale-105 active:translate-y-4 active:shadow-none transition-all">
                  {guideStep === RULES_STEPS.length - 1 ? "C'EST PARTI !" : "SUIVANT ➜"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Board Viewer Modal */}
      {showBoard && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-2 sm:p-6">
          <div className="relative w-full h-full flex flex-col items-center">
            <button 
              onClick={() => setShowBoard(false)} 
              aria-label="Fermer la carte" className="absolute top-0 right-0 z-[80] bg-red-500 text-white w-12 h-12 sm:w-24 sm:h-24 rounded-full text-2xl sm:text-5xl font-black shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
            >
              ✕
            </button>
            
            <h2 className="text-3xl sm:text-6xl font-black text-white uppercase mb-4 sm:mb-6 tracking-tighter italic text-center">Carte du Plateau 🗺️</h2>
            
            <div className="flex-1 w-full bg-white/10 rounded-3xl sm:rounded-[4rem] border-4 sm:border-[10px] border-white/20 overflow-hidden relative flex items-center justify-center">
              {BOARD_IMAGE ? (
                <img src={BOARD_IMAGE} alt="Plateau de jeu" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-white text-center p-6 sm:p-20">
                  <p className="text-6xl sm:text-9xl mb-4">🚧</p>
                  <p className="text-2xl sm:text-5xl font-black">Le plateau arrive bientôt !</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowBoard(false)}
              className="mt-4 sm:mt-8 bg-emerald-500 text-white px-10 sm:px-20 py-4 sm:py-8 rounded-xl sm:rounded-[2.5rem] text-2xl sm:text-4xl font-black shadow-[0_10px_0_rgb(5,150,105)] sm:shadow-[0_15px_0_rgb(5,150,105)]"
            >
              RETOURNER
            </button>
          </div>
        </div>
      )}
      {showScores && (
        <ScoreBoard
          teams={teams} onChange={setTeams} onClose={() => setShowScores(false)}
          onExport={exportParty} onImport={importParty} onReset={() => setConfirmReset('scores')}
        />
      )}
      {notice && (
        <MessageModal title="Information" message={notice} buttons={[{ label: 'OK', onClick: () => setNotice(null) }]} onClose={() => setNotice(null)} />
      )}
      {confirmReset && (
        <MessageModal
          title="Tu es sûr ?"
          message={confirmReset === 'games' ? 'Tous les mini-jeux reviennent dans la roue.' : 'Les pièces et les étoiles de toutes les équipes repartent à zéro.'}
          buttons={[
            { label: 'OUI', tone: 'red', onClick: confirmReset === 'games' ? resetMiniGames : resetScores },
            { label: 'NON, ANNULER', tone: 'gray', onClick: () => setConfirmReset(null) },
          ]}
          onClose={() => setConfirmReset(null)}
        />
      )}
    </div>
  );
};

export default SuperMarioParty;

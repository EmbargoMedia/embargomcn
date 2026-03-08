import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  X, 
  Play, 
  Trophy, 
  Music, 
  Zap, 
  Ear,
  RotateCcw,
  Pause,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Activity,
  Star,
  Brain,
  Info
} from 'lucide-react';
import { cn } from '../utils/cn';

// --- Constants & Types ---

const COLS = 10;
const ROWS = 20;
const INITIAL_SPEED = 1000;

type BlockType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z' | 'U' | 'P' | 'X';

const SHAPES: Record<BlockType, number[][]> = {
  I: [[1, 1, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  T: [[0, 1, 0], [1, 1, 1]],
  Z: [[1, 1, 0], [0, 1, 1]],
  U: [[1, 0, 1], [1, 1, 1]], // U-shape (Level 3+)
  P: [[1, 1], [1, 0]],       // Small L (Level 3+)
  X: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], // Cross (Level 4+)
};

const COLORS: Record<BlockType, string> = {
  I: 'bg-cyan-400 shadow-cyan-400/50',
  J: 'bg-blue-500 shadow-blue-500/50',
  L: 'bg-orange-500 shadow-orange-500/50',
  O: 'bg-yellow-400 shadow-yellow-400/50',
  S: 'bg-green-500 shadow-green-500/50',
  T: 'bg-purple-500 shadow-purple-500/50',
  Z: 'bg-red-500 shadow-red-500/50',
  U: 'bg-pink-500 shadow-pink-500/50',
  P: 'bg-indigo-400 shadow-indigo-400/50',
  X: 'bg-emerald-400 shadow-emerald-400/50',
};

const FREQUENCIES: Record<BlockType, number> = {
  I: 261.63, // C4
  J: 293.66, // D4
  L: 329.63, // E4
  O: 349.23, // F4
  S: 392.00, // G4
  T: 440.00, // A4
  Z: 493.88, // B4
  U: 523.25, // C5
  P: 587.33, // D5
  X: 659.25, // E5
};

interface Piece {
  shape: number[][];
  color: string;
  type: BlockType;
  x: number;
  y: number;
  isRhythm?: boolean;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'rhythm' | 'sequence' | 'pitch';
  target: any;
  reward: number;
  progress: number;
}

// --- Components ---

const Waveform = ({ active }: { active: boolean }) => (
  <div className="flex items-end gap-[1px] h-3 w-full px-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={i}
        animate={active ? { height: [2, 8, 4, 10, 2] } : { height: 2 }}
        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
        className="flex-1 bg-white/60 rounded-full"
      />
    ))}
  </div>
);

export default function SoundBlockTetris({ onClose, language, translations: t }: { onClose: () => void, language: string, translations: any }) {
  const [grid, setGrid] = useState<(BlockType | '')[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
  const [activePiece, setActivePiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover' | 'mission'>('start');
  const [volume, setVolume] = useState(0.5);
  const [pitchShift, setPitchShift] = useState(1);
  
  // Cognitive/Auditory States
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [sequenceHistory, setSequenceHistory] = useState<BlockType[]>([]);
  const [successRate, setSuccessRate] = useState(100);
  const [combo, setCombo] = useState(0);

  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const audioCtx = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);

  // --- Audio Engine ---

  const initAudio = async () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNode.current = audioCtx.current.createGain();
      gainNode.current.connect(audioCtx.current.destination);
    }
    
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    // Play a silent buffer to unlock audio on mobile
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    // Play a confirmation tone
    await playTone(880, 0.1, 'sine', 0.5);
  };

  const playTone = useCallback(async (freq: number, duration: number = 0.2, type: OscillatorType = 'sine', volumeMult: number = 1) => {
    if (!audioCtx.current || !gainNode.current) return;
    if (audioCtx.current.state === 'suspended') {
      await audioCtx.current.resume();
    }
    const osc = audioCtx.current.createOscillator();
    const g = audioCtx.current.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq * pitchShift, audioCtx.current.currentTime);
    
    g.gain.setValueAtTime(0, audioCtx.current.currentTime);
    g.gain.linearRampToValueAtTime(volume * 0.4 * volumeMult, audioCtx.current.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + duration);
    
    osc.connect(g);
    g.connect(gainNode.current);
    
    osc.start();
    osc.stop(audioCtx.current.currentTime + duration);
  }, [volume, pitchShift]);

  // --- Game Logic ---

  const createPiece = useCallback((): Piece => {
    const availableTypes: BlockType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    if (level >= 2) availableTypes.push('U');
    if (level >= 3) availableTypes.push('P');
    if (level >= 4) availableTypes.push('X');

    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const shape = SHAPES[type];
    return {
      shape,
      type,
      color: COLORS[type],
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
      isRhythm: Math.random() > 0.8 && level >= 3,
    };
  }, [level]);

  const isValidMove = (piece: Piece, grid: (BlockType | '')[][], dx: number, dy: number, newShape?: number[][]) => {
    const shape = newShape || piece.shape;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = piece.x + x + dx;
          const newY = piece.y + y + dy;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && grid[newY][newX])) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const generateMission = (lvl: number) => {
    const missions: Mission[] = [
      {
        id: 'm1',
        title: 'Sequence Memory',
        description: 'Place blocks in this order: I, O, T',
        type: 'sequence',
        target: ['I', 'O', 'T'],
        reward: 500,
        progress: 0
      },
      {
        id: 'm2',
        title: 'Pitch Match',
        description: 'Clear a line using only high-pitch blocks (U, P, X)',
        type: 'pitch',
        target: ['U', 'P', 'X'],
        reward: 800,
        progress: 0
      }
    ];
    setActiveMission(missions[Math.floor(Math.random() * missions.length)]);
  };

  const lockPiece = () => {
    if (!activePiece) return;
    const newGrid = [...grid.map(row => [...row])];
    activePiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const gridY = activePiece.y + y;
          const gridX = activePiece.x + x;
          if (gridY >= 0) newGrid[gridY][gridX] = activePiece.type;
        }
      });
    });

    playTone(FREQUENCIES[activePiece.type], 0.3, 'sine', 1.2);
    
    // Mission Check: Sequence Memory
    if (activeMission?.type === 'sequence') {
      const targetSeq = activeMission.target as BlockType[];
      const currentIdx = sequenceHistory.length;
      if (activePiece.type === targetSeq[currentIdx]) {
        const newHist = [...sequenceHistory, activePiece.type];
        setSequenceHistory(newHist);
        if (newHist.length === targetSeq.length) {
          setScore(s => s + activeMission.reward);
          setActiveMission(null);
          setSequenceHistory([]);
          playTone(880, 0.5, 'sine', 1.5); // Success sound
        }
      } else {
        setSequenceHistory([]);
        setSuccessRate(r => Math.max(0, r - 5));
      }
    }

    // Clear lines
    let cleared = 0;
    const finalGrid = newGrid.filter(row => {
      const isFull = row.every(cell => cell !== '');
      if (isFull) cleared++;
      return !isFull;
    });
    
    while (finalGrid.length < ROWS) {
      finalGrid.unshift(Array(COLS).fill(''));
    }

    if (cleared > 0) {
      const bonus = combo * 50;
      setScore(s => s + ([0, 100, 300, 500, 800][cleared] + bonus) * level);
      setLines(l => l + cleared);
      setCombo(c => c + 1);
      
      // Level Up Logic
      const newLevel = Math.floor((lines + cleared) / 10) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
        generateMission(newLevel);
      }
      
      // Line clear sound (chord)
      [FREQUENCIES.I, FREQUENCIES.L, FREQUENCIES.S].forEach((f, i) => {
        setTimeout(() => playTone(f, 0.4, 'triangle'), i * 50);
      });
    } else {
      setCombo(0);
    }

    setGrid(finalGrid);
    
    if (activePiece.y <= 0) {
      setGameState('gameover');
    } else {
      setActivePiece(nextPiece);
      setNextPiece(createPiece());
    }
  };

  const movePiece = (dx: number, dy: number) => {
    if (!activePiece || gameState !== 'playing') return false;
    if (isValidMove(activePiece, grid, dx, dy)) {
      setActivePiece({ ...activePiece, x: activePiece.x + dx, y: activePiece.y + dy });
      if (dx !== 0) playTone(150, 0.05, 'square', 0.3);
      return true;
    }
    if (dy > 0) lockPiece();
    return false;
  };

  const rotatePiece = () => {
    if (!activePiece || gameState !== 'playing') return;
    const newShape = activePiece.shape[0].map((_, i) => activePiece.shape.map(row => row[i]).reverse());
    if (isValidMove(activePiece, grid, 0, 0, newShape)) {
      setActivePiece({ ...activePiece, shape: newShape });
      playTone(300, 0.08, 'triangle', 0.5);
    }
  };

  // --- Game Loop ---

  const update = (time: number) => {
    if (gameState !== 'playing') return;
    const deltaTime = time - lastTimeRef.current;
    
    // Adaptive Speed: Based on level and success rate
    const baseSpeed = INITIAL_SPEED - (level - 1) * 150;
    const adaptiveModifier = (100 - successRate) * 2;
    const speed = Math.max(150, baseSpeed + adaptiveModifier);

    if (deltaTime > speed) {
      movePiece(0, 1);
      lastTimeRef.current = time;
    }
    gameLoopRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(update);
    } else {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, activePiece, grid, level, successRate]);

  const startGame = async () => {
    await initAudio(); // Call this FIRST for iOS
    setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill('')));
    setActivePiece(createPiece());
    setNextPiece(createPiece());
    setScore(0);
    setLevel(1);
    setLines(0);
    setCombo(0);
    setSuccessRate(100);
    setGameState('playing');
  };

  // --- Keyboard Controls ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      switch (e.key) {
        case 'ArrowLeft': movePiece(-1, 0); break;
        case 'ArrowRight': movePiece(1, 0); break;
        case 'ArrowDown': movePiece(0, 1); break;
        case 'ArrowUp': rotatePiece(); break;
        case ' ': while(movePiece(0, 1)); break;
        case 'p': setGameState('paused'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activePiece, grid]);

  const displayGrid = useMemo(() => {
    const g = grid.map(row => [...row]);
    if (activePiece) {
      activePiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            const gridY = activePiece.y + y;
            const gridX = activePiece.x + x;
            if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
              g[gridY][gridX] = activePiece.type;
            }
          }
        });
      });
    }
    return g;
  }, [grid, activePiece]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col overflow-hidden font-sans text-white">
      {/* Header: Technical Dashboard Style */}
      <div className="p-4 flex justify-between items-center border-b border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em]">Auditory Rehab</span>
            <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
              SOUND BLOCK <span className="text-brand-gold">v2.0</span>
            </h2>
          </div>
          
          <div className="h-8 w-[1px] bg-white/10" />
          
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Level</span>
              <span className="text-lg font-black text-white">{level}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Score</span>
              <span className="text-lg font-black text-brand-gold">{score.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Success</span>
              <span className="text-lg font-black text-emerald-400">{successRate}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input 
              type="range" min="0" max="1" step="0.1" value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 accent-brand-gold"
            />
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Game Interface */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 gap-4 lg:gap-12 relative overflow-hidden">
        
        {/* Left Sidebar: Missions & Info (Hidden on mobile) */}
        <div className="hidden xl:flex flex-col gap-6 w-64 shrink-0">
          <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-brand-gold" />
              <h3 className="text-sm font-black uppercase tracking-widest">Active Mission</h3>
            </div>
            {activeMission ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-white">{activeMission.title}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{activeMission.description}</p>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(sequenceHistory.length / (activeMission.target as any[]).length) * 100}%` }}
                    className="h-full bg-brand-gold"
                  />
                </div>
                {activeMission.type === 'sequence' && (
                  <div className="flex gap-2 mt-2">
                    {(activeMission.target as BlockType[]).map((t, i) => (
                      <div key={i} className={cn(
                        "w-6 h-6 rounded-md border border-white/20 flex items-center justify-center text-[10px] font-black",
                        sequenceHistory[i] === t ? COLORS[t] : "bg-white/5"
                      )}>
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No active mission. Level up to unlock.</p>
            )}
          </div>

          <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black uppercase tracking-widest">Auditory Feed</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(FREQUENCIES).slice(0, 5).map(([type, freq]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", COLORS[type as BlockType])} />
                    <span className="text-[10px] font-bold text-slate-400">{type} Block</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{freq}Hz</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Tetris Board */}
        <div className="relative">
          {/* Waveform Visualization on top */}
          <div className="absolute -top-12 left-0 right-0 flex justify-center gap-4 px-4">
             <div className="flex-1 h-8 bg-white/5 rounded-t-2xl border-x border-t border-white/10 flex items-center justify-center overflow-hidden">
                <Waveform active={gameState === 'playing'} />
             </div>
          </div>

          <div className="bg-[#111] p-1.5 sm:p-3 rounded-[24px] sm:rounded-[40px] border-[3px] sm:border-[8px] border-white/5 shadow-2xl shadow-brand-gold/5">
            <div className="grid grid-cols-10 gap-[1px] sm:gap-1 bg-black p-0.5 rounded-[18px] sm:rounded-[28px] overflow-hidden">
              {displayGrid.map((row, y) => (
                row.map((cell, x) => (
                  <div 
                    key={`${y}-${x}`} 
                    className={cn(
                      "w-[5.5vw] h-[5.5vw] max-w-[24px] max-h-[24px] sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-[2px] sm:rounded-lg transition-all duration-150 relative overflow-hidden",
                      cell ? COLORS[cell] : "bg-white/[0.03]"
                    )}
                  >
                    {cell && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        <motion.div 
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute top-1 left-1 right-1 h-[2px] bg-white/40 rounded-full"
                        />
                        {/* Vibration Effect for active piece */}
                        {activePiece && y >= activePiece.y && y < activePiece.y + activePiece.shape.length && x >= activePiece.x && x < activePiece.x + activePiece.shape[0].length && (
                           <motion.div 
                            animate={{ y: [0, -1, 0] }}
                            transition={{ duration: 0.1, repeat: Infinity }}
                            className="absolute inset-0 border border-white/20 rounded-lg"
                           />
                        )}
                      </>
                    )}
                  </div>
                ))
              ))}
            </div>
          </div>

          {/* Overlays */}
          <AnimatePresence>
            {gameState === 'start' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center rounded-[40px]"
              >
                <div className="w-24 h-24 rounded-[40px] bg-brand-gold/20 flex items-center justify-center border border-brand-gold/40 mb-8 shadow-2xl shadow-brand-gold/20">
                  <Music className="w-12 h-12 text-brand-gold" />
                </div>
                <h3 className="text-4xl font-black text-white mb-4 tracking-tighter">SOUND BLOCK REHAB</h3>
                <p className="text-slate-400 mb-10 max-w-xs text-sm leading-relaxed">
                  Train your auditory focus and cognitive memory through musical patterns.
                </p>
                
                <div className="grid grid-cols-2 gap-4 w-full mb-10">
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                    <Ear className="w-5 h-5 text-brand-gold mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase text-slate-400">Auditory</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                    <Brain className="w-5 h-5 text-brand-gold mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase text-slate-400">Cognitive</p>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full py-5 rounded-[24px] bg-brand-gold text-brand-black font-black text-xl shadow-2xl shadow-brand-gold/30 hover:scale-105 active:scale-95 transition-all mb-4"
                >
                  INITIALIZE SESSION
                </button>

                <button 
                  onClick={initAudio}
                  className="text-slate-500 text-xs font-bold flex items-center gap-2 hover:text-brand-gold transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  {language === 'ko' ? '사운드 테스트' : 'Sound Test'}
                </button>
              </motion.div>
            )}

            {gameState === 'gameover' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-10 text-center rounded-[40px]"
              >
                <Trophy className="w-20 h-20 text-brand-gold mb-8 animate-bounce" />
                <h3 className="text-4xl font-black text-white mb-2 tracking-tighter">SESSION COMPLETE</h3>
                <div className="space-y-1 mb-10">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Final Performance</p>
                  <p className="text-5xl font-black text-brand-gold">{score.toLocaleString()}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full mb-10">
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Lines</p>
                    <p className="text-xl font-black">{lines}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Accuracy</p>
                    <p className="text-xl font-black text-emerald-400">{successRate}%</p>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full py-5 rounded-[24px] bg-brand-gold text-brand-black font-black text-xl shadow-2xl shadow-brand-gold/30"
                >
                  RESTART TRAINING
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar: Next Piece & Controls */}
        <div className="hidden xl:flex flex-col gap-6 w-64">
          <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Next Block</span>
            <div className="h-24 flex items-center justify-center">
              {nextPiece && (
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 1fr)` }}>
                  {nextPiece.shape.flat().map((v, i) => (
                    <div key={i} className={cn("w-7 h-7 rounded-lg", v ? COLORS[nextPiece.type] : "bg-transparent")} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-gold" />
              <h3 className="text-sm font-black uppercase tracking-widest">Controls</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Move</span>
                <span className="font-bold text-white">Arrow Keys</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Rotate</span>
                <span className="font-bold text-white">Up Arrow</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Hard Drop</span>
                <span className="font-bold text-white">Space</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Pause</span>
                <span className="font-bold text-white">P Key</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Controls Overlay */}
        <div className="flex flex-col items-center gap-4 lg:hidden px-4 mb-4 shrink-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div />
            <button 
              onPointerDown={(e) => { e.preventDefault(); rotatePiece(); }} 
              className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/10 active:scale-90 active:bg-white/20 transition-all"
            >
              <ArrowUp className="w-6 h-6 sm:w-8 h-8 text-white" />
            </button>
            <div />
            
            <button 
              onPointerDown={(e) => { e.preventDefault(); movePiece(-1, 0); }} 
              className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/10 active:scale-90 active:bg-white/20 transition-all"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 h-8 text-white" />
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); movePiece(0, 1); }} 
              className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/10 active:scale-90 active:bg-white/20 transition-all"
            >
              <ChevronDown className="w-6 h-6 sm:w-8 h-8 text-white" />
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); movePiece(1, 0); }} 
              className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/10 active:scale-90 active:bg-white/20 transition-all"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 h-8 text-white" />
            </button>

            <div />
            <button 
              onPointerDown={(e) => { e.preventDefault(); while(movePiece(0, 1)); }} 
              className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-gold/20 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-brand-gold/30 active:scale-90 active:bg-brand-gold/40 transition-all"
            >
              <Zap className="w-6 h-6 sm:w-8 h-8 text-brand-gold" />
            </button>
            <div />
          </div>
        </div>
      </div>

      {/* Footer: Diagnostic Status (Hidden on small mobile) */}
      <div className="hidden sm:flex p-4 bg-black/60 border-t border-white/10 items-center justify-between px-10 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Sync: Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adaptive Learning: ON</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <Star className="w-3 h-3 text-brand-gold fill-current" />
             <span className="text-[10px] font-black text-white">{combo}x COMBO</span>
           </div>
        </div>
      </div>
    </div>
  );
}

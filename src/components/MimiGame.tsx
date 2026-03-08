import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, RotateCcw, Trophy, Music, Zap, Heart, Star, ArrowRight, ArrowLeft, Volume2, Eye } from 'lucide-react';

interface MimiGameProps {
  onClose: () => void;
  t: any;
}

const MimiGame: React.FC<MimiGameProps> = ({ onClose, t }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover' | 'levelclear'>('start');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [showVisualAid, setShowVisualAid] = useState(true);
  const [missionText, setMissionText] = useState('');
  
  // Game constants
  const GRAVITY = 0.5;
  const JUMP_FORCE = -12;
  const SPEED = 5;
  
  // Audio context for missions
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const initAudio = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    // Play a silent buffer to unlock audio on mobile
    const buffer = audioCtxRef.current.createBuffer(1, 1, 22050);
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxRef.current.destination);
    source.start(0);
  };

  const playSound = async (freq: number, type: OscillatorType = 'sine', duration: number = 0.3) => {
    if (!audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + duration);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Responsive canvas sizing
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = Math.min(container.clientHeight, 400);
      }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Game objects
    const player = {
      x: 50,
      y: 200,
      width: 32,
      height: 32,
      dy: 0,
      isGrounded: false,
      color: '#F27D26' // Mimi's orange
    };

    const platforms = [
      { x: 0, y: 350, width: 2000, height: 100, type: 'normal' },
      { x: 300, y: 250, width: 150, height: 20, type: 'rhythm', freq: 440 },
      { x: 550, y: 150, width: 150, height: 20, type: 'pitch', freq: 660 },
      { x: 800, y: 250, width: 200, height: 20, type: 'normal' },
      { x: 1100, y: 200, width: 150, height: 20, type: 'sequence', freq: 880, id: 1 },
      { x: 1350, y: 100, width: 150, height: 20, type: 'sequence', freq: 1100, id: 2 },
    ];

    const items = [
      { x: 400, y: 300, width: 20, height: 20, collected: false, type: 'timbre', freq: 440 },
      { x: 650, y: 200, width: 20, height: 20, collected: false, type: 'score' },
      { x: 1200, y: 250, width: 20, height: 20, collected: false, type: 'score' },
    ];

    let cameraX = 0;
    const keys: { [key: string]: boolean } = {};
    const touchState: { [key: string]: boolean } = { left: false, right: false, jump: false };

    const handleKeyDown = (e: KeyboardEvent) => keys[e.code] = true;
    const handleKeyUp = (e: KeyboardEvent) => keys[e.code] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Expose touch controls to window for the UI buttons
    (window as any).mimiControls = {
      setLeft: (v: boolean) => touchState.left = v,
      setRight: (v: boolean) => touchState.right = v,
      setJump: (v: boolean) => touchState.jump = v,
    };

    const update = () => {
      // Player movement
      if (keys['ArrowRight'] || touchState.right) player.x += SPEED;
      if (keys['ArrowLeft'] || touchState.left) player.x -= SPEED;
      
      if ((keys['Space'] || touchState.jump) && player.isGrounded) {
        player.dy = JUMP_FORCE;
        player.isGrounded = false;
        playSound(300, 'square', 0.1);
        touchState.jump = false; // Reset jump touch
      }

      // Gravity
      player.dy += GRAVITY;
      player.y += player.dy;

      // Collision detection with platforms
      player.isGrounded = false;
      platforms.forEach(p => {
        if (
          player.x < p.x + p.width &&
          player.x + player.width > p.x &&
          player.y + player.height > p.y &&
          player.y + player.height < p.y + p.height &&
          player.dy >= 0
        ) {
          player.y = p.y - player.height;
          player.dy = 0;
          player.isGrounded = true;
          
          // Mission interactions
          if (p.type === 'rhythm' && Math.random() < 0.05) {
            playSound(p.freq || 440);
            if (showVisualAid) setMissionText("Rhythm Match!");
          }
        }
      });

      // Item collection
      items.forEach(item => {
        if (!item.collected && 
            player.x < item.x + item.width &&
            player.x + player.width > item.x &&
            player.y < item.y + item.height &&
            player.y + player.height > item.y) {
          item.collected = true;
          setScore(s => s + 100);
          if (item.type === 'timbre') {
            playSound(item.freq || 440, 'triangle');
            setMissionText("Timbre Found!");
          } else {
            playSound(1000, 'sine', 0.1);
          }
        }
      });

      // Camera follow
      const targetCameraX = player.x - canvas.width / 3;
      cameraX += (targetCameraX - cameraX) * 0.1;
      if (cameraX < 0) cameraX = 0;

      // Game over condition
      if (player.y > canvas.height) {
        setLives(l => {
          if (l <= 1) {
            setGameState('gameover');
            return 0;
          }
          player.x = cameraX + 50;
          player.y = 100;
          player.dy = 0;
          return l - 1;
        });
      }

      // Level clear condition
      if (player.x > 1800) {
        setGameState('levelclear');
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.translate(-cameraX, 0);

      // Draw background elements (simple)
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(0, 0, 2000, canvas.height);

      // Draw platforms
      platforms.forEach(p => {
        ctx.fillStyle = p.type === 'normal' ? '#333' : '#F27D26';
        if (p.type === 'rhythm' && showVisualAid) {
          // Pulse effect for visual aid
          const pulse = Math.sin(Date.now() / 200) * 5;
          ctx.shadowBlur = 15 + pulse;
          ctx.shadowColor = '#F27D26';
        }
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.shadowBlur = 0;
      });

      // Draw items
      items.forEach(item => {
        if (!item.collected) {
          ctx.fillStyle = item.type === 'timbre' ? '#00FF00' : '#FFD700';
          ctx.beginPath();
          ctx.arc(item.x + item.width/2, item.y + item.height/2, item.width/2, 0, Math.PI * 2);
          ctx.fill();
          
          if (showVisualAid) {
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      });

      // Draw player (Mimi)
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      
      // Draw Mimi's ears
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.x + 8, player.y - 12);
      ctx.lineTo(player.x + 16, player.y);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(player.x + player.width - 16, player.y);
      ctx.lineTo(player.x + player.width - 8, player.y - 12);
      ctx.lineTo(player.x + player.width, player.y);
      ctx.fill();
 
      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [gameState, showVisualAid]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-brand-black flex flex-col items-center justify-start overflow-y-auto"
    >
      {/* Header */}
      <div className="w-full p-4 sm:p-6 flex justify-between items-center bg-gradient-to-b from-brand-black to-transparent z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-gold/20 flex items-center justify-center border border-brand-gold/30">
            <Music className="w-5 h-5 sm:w-6 sm:h-6 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">Mimi's Sound Adventure</h1>
            <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brand-gold fill-current" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-400">Level {level}</span>
              </div>
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-slate-700" />
              <span className="text-[10px] sm:text-xs font-bold text-brand-gold">{score} pts</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setShowVisualAid(!showVisualAid)}
            className={`p-2 sm:p-3 rounded-xl border transition-all ${showVisualAid ? 'bg-brand-gold/20 border-brand-gold/50 text-brand-gold' : 'bg-brand-dark-gray/40 border-brand-border text-slate-500'}`}
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 sm:p-3 rounded-xl bg-brand-dark-gray/40 border border-brand-border text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative w-full max-w-4xl aspect-[16/9] bg-brand-dark-gray/20 sm:rounded-[40px] border border-brand-border overflow-hidden shadow-2xl">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={450} 
          className="w-full h-full"
        />

        {/* HUD - Lives & Waveform */}
        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i} 
                className={`w-6 h-6 ${i < lives ? 'text-red-500 fill-current' : 'text-slate-700'}`} 
              />
            ))}
          </div>

          {showVisualAid && (
            <div className="flex items-end gap-1 h-12 px-6 py-3 bg-brand-gold/10 backdrop-blur-md rounded-2xl border border-brand-gold/20">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: [
                      '20%', 
                      `${20 + Math.random() * 80}%`, 
                      `${20 + Math.random() * 40}%`, 
                      '20%'
                    ] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.5 + Math.random(),
                    ease: "easeInOut"
                  }}
                  className="w-1 bg-brand-gold rounded-full"
                />
              ))}
              <span className="ml-3 text-[10px] font-black text-brand-gold uppercase tracking-widest">Audio Visualizer</span>
            </div>
          )}
        </div>

        {/* Mission Overlay */}
        <AnimatePresence>
          {missionText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onAnimationComplete={() => setTimeout(() => setMissionText(''), 2000)}
              className="absolute top-1/4 left-1/2 -translate-x-1/2 px-6 py-3 bg-brand-gold/20 backdrop-blur-md border border-brand-gold/40 rounded-full"
            >
              <p className="text-brand-gold font-black text-lg tracking-widest uppercase">{missionText}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game State Overlays */}
        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-24 h-24 rounded-[32px] bg-brand-gold flex items-center justify-center mb-6 shadow-2xl shadow-brand-gold/20">
                <Play className="w-12 h-12 text-brand-black fill-current" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">Ready for Adventure?</h2>
              <p className="text-slate-400 max-w-sm sm:max-w-md mb-8 leading-relaxed text-sm sm:text-base">
                Help Mimi explore the world by listening to sounds. 
                Jump on rhythm blocks and collect matching timbres!
              </p>
              <button 
                onClick={async () => {
                  await initAudio();
                  setGameState('playing');
                }}
                className="px-10 py-4 sm:px-12 sm:py-5 bg-brand-gold text-brand-black font-black text-lg sm:text-xl rounded-2xl shadow-xl shadow-brand-gold/20 hover:scale-105 active:scale-95 transition-all"
              >
                START MISSION
              </button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-brand-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/40">
                <RotateCcw className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-4xl font-black text-white mb-2">Mission Failed</h2>
              <p className="text-slate-500 mb-8">Don't worry, Mimi is ready to try again!</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setLives(3);
                    setScore(0);
                    setGameState('playing');
                  }}
                  className="px-8 py-4 bg-white text-brand-black font-black rounded-xl hover:bg-slate-100 transition-all"
                >
                  RETRY
                </button>
                <button 
                  onClick={onClose}
                  className="px-8 py-4 bg-brand-dark-gray text-white font-black rounded-xl border border-brand-border hover:bg-brand-border transition-all"
                >
                  QUIT
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'levelclear' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-brand-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-brand-gold/20 flex items-center justify-center mb-6 border border-brand-gold/40 animate-bounce">
                <Trophy className="w-12 h-12 text-brand-gold" />
              </div>
              <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Level {level} Complete!</h2>
              <p className="text-brand-gold font-bold text-xl mb-8">Score: {score}</p>
              <button 
                onClick={() => {
                  setLevel(l => l + 1);
                  setGameState('playing');
                }}
                className="px-12 py-5 bg-brand-gold text-brand-black font-black text-xl rounded-2xl shadow-xl shadow-brand-gold/20 flex items-center gap-3"
              >
                NEXT LEVEL
                <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-12 left-4 right-4 flex justify-between items-center lg:hidden z-20">
        <div className="flex gap-3">
          <button 
            onPointerDown={(e) => { e.preventDefault(); (window as any).mimiControls?.setLeft(true); }}
            onPointerUp={(e) => { e.preventDefault(); (window as any).mimiControls?.setLeft(false); }}
            onPointerLeave={(e) => { e.preventDefault(); (window as any).mimiControls?.setLeft(false); }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-dark-gray/60 backdrop-blur-md border border-brand-border flex items-center justify-center active:bg-brand-gold/20 transition-all touch-none"
          >
            <ArrowLeft className="w-7 h-7 sm:w-8 h-8 text-white" />
          </button>
          <button 
            onPointerDown={(e) => { e.preventDefault(); (window as any).mimiControls?.setRight(true); }}
            onPointerUp={(e) => { e.preventDefault(); (window as any).mimiControls?.setRight(false); }}
            onPointerLeave={(e) => { e.preventDefault(); (window as any).mimiControls?.setRight(false); }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-dark-gray/60 backdrop-blur-md border border-brand-border flex items-center justify-center active:bg-brand-gold/20 transition-all touch-none"
          >
            <ArrowRight className="w-7 h-7 sm:w-8 h-8 text-white" />
          </button>
        </div>
        <button 
          onPointerDown={(e) => { e.preventDefault(); (window as any).mimiControls?.setJump(true); }}
          onPointerUp={(e) => { e.preventDefault(); (window as any).mimiControls?.setJump(false); }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-gold text-brand-black flex items-center justify-center shadow-xl shadow-brand-gold/20 active:scale-90 transition-all touch-none"
        >
          <Zap className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
        </button>
      </div>

      {/* Controls Help (Hidden on mobile) */}
      <div className="hidden md:grid mt-12 grid-cols-3 gap-8 max-w-2xl w-full">
        <div className="flex items-center gap-4 bg-brand-dark-gray/20 p-4 rounded-2xl border border-brand-border">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-black">←</div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-black">→</div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Move</p>
        </div>
        <div className="flex items-center gap-4 bg-brand-dark-gray/20 p-4 rounded-2xl border border-brand-border">
          <div className="px-4 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-black text-xs">SPACE</div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jump</p>
        </div>
        <div className="flex items-center gap-4 bg-brand-dark-gray/20 p-4 rounded-2xl border border-brand-border">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-brand-gold" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Listen</p>
        </div>
      </div>
    </motion.div>
  );
};

export default MimiGame;

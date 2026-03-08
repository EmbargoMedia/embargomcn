import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Volume2, 
  Pencil, 
  Eraser, 
  RotateCcw, 
  CheckCircle2, 
  Trophy, 
  Clock, 
  Play, 
  Home,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Star,
  Mic2,
  Sparkles
} from 'lucide-react';

interface SoundAndSketchProps {
  onClose: () => void;
  lang: string;
}

type GameMode = 'home' | 'draw_guess' | 'listen_match' | 'memory' | 'association';

const WORDS = [
  { word: '사과', hint: 'ㅅㄱ', category: '과일' },
  { word: '자동차', hint: 'ㅈㄷㅊ', category: '교통' },
  { word: '고양이', hint: 'ㄱㅇㅇ', category: '동물' },
  { word: '소방차', hint: 'ㅅㅂㅊ', category: '교통' },
  { word: '해바라기', hint: 'ㅎㅂㄹㄱ', category: '식물' },
  { word: '코끼리', hint: 'ㅋㄲㄹ', category: '동물' },
  { word: '비행기', hint: 'ㅂㅎㄱ', category: '교통' },
  { word: '포도', hint: 'ㅍㄷ', category: '과일' },
];

const SoundAndSketch: React.FC<SoundAndSketchProps> = ({ onClose, lang }) => {
  const [mode, setMode] = useState<GameMode>('home');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentWord, setCurrentWord] = useState(WORDS[0]);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'result'>('ready');
  const [aiGuesses, setAiGuesses] = useState<string[]>([]);
  const [showMemoryImage, setShowMemoryImage] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(8);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');

  // TTS Function
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ko' ? 'ko-KR' : 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Mimi's Guidance
  const mimiSpeak = (text: string) => {
    speak(text);
  };

  useEffect(() => {
    if (mode === 'home') {
      mimiSpeak(lang === 'ko' ? "안녕하세요! 사운드 앤 스케치에 오신 것을 환영해요. 저와 함께 재미있는 인지 게임을 시작해볼까요?" : "Hello! Welcome to Sound & Sketch. Shall we start a fun cognitive game together?");
    }
  }, [mode]);

  // Canvas Logic
  useEffect(() => {
    if (mode !== 'home' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [mode, gameState]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.lineWidth = brushSize;
    ctx.strokeStyle = tool === 'eraser' ? 'white' : '#1a1a1a';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Game Logic
  const startNewRound = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setGameState('playing');
    setTimeLeft(60);
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(randomWord);

    if (selectedMode === 'draw_guess') {
      mimiSpeak(lang === 'ko' ? `${randomWord.word}를 그려보세요. 힌트는 ${randomWord.hint}입니다.` : `Draw a ${randomWord.word}. The hint is ${randomWord.hint}.`);
    } else if (selectedMode === 'listen_match') {
      const otherWords = WORDS.filter(w => w.word !== randomWord.word).sort(() => 0.5 - Math.random()).slice(0, 3).map(w => w.word);
      setOptions([randomWord.word, ...otherWords].sort(() => 0.5 - Math.random()));
      mimiSpeak(lang === 'ko' ? "들려주는 단어를 맞춰보세요." : "Listen and match the word.");
      setTimeout(() => speak(randomWord.word), 1000);
    } else if (selectedMode === 'memory') {
      setShowMemoryImage(true);
      mimiSpeak(lang === 'ko' ? "5초 동안 그림을 기억하세요!" : "Remember the image for 5 seconds!");
      setTimeout(() => {
        setShowMemoryImage(false);
        mimiSpeak(lang === 'ko' ? "이제 기억한 그림을 그려보세요." : "Now draw the image you remembered.");
      }, 5000);
    } else if (selectedMode === 'association') {
      mimiSpeak(lang === 'ko' ? `${randomWord.category}와 관련된 것을 그려보세요.` : `Draw something related to ${randomWord.category}.`);
    }
  };

  const handleFinishDrawing = () => {
    // Simulated AI Guessing
    const guesses = [
      currentWord.word,
      WORDS[Math.floor(Math.random() * WORDS.length)].word,
      WORDS[Math.floor(Math.random() * WORDS.length)].word
    ].sort(() => 0.5 - Math.random());
    
    setAiGuesses(guesses);
    setGameState('result');
    
    if (guesses.includes(currentWord.word)) {
      setScore(prev => prev + 100 + (timeLeft > 30 ? 50 : 0));
      mimiSpeak(lang === 'ko' ? "우와! 정말 잘 그리셨어요. 정답이에요!" : "Wow! You drew it so well. That's correct!");
    } else {
      mimiSpeak(lang === 'ko' ? "음, 조금 어렵네요. 다시 한번 시도해볼까요?" : "Hmm, it's a bit hard. Shall we try again?");
    }
  };

  const handleOptionSelect = (option: string) => {
    if (option === currentWord.word) {
      setScore(prev => prev + 100);
      setGameState('result');
      mimiSpeak(lang === 'ko' ? "정답입니다! 귀가 정말 밝으시네요." : "Correct! Your hearing is excellent.");
    } else {
      mimiSpeak(lang === 'ko' ? "아쉬워요. 다시 한번 들어볼까요?" : "Too bad. Shall we listen again?");
      speak(currentWord.word);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#FFF9F0] flex flex-col font-sans overflow-hidden"
    >
      {/* Header */}
      <div className="bg-white border-b-4 border-[#FFD9A0] p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => mode === 'home' ? onClose() : setMode('home')}
            className="w-16 h-16 rounded-2xl bg-[#F5F5F5] flex items-center justify-center hover:bg-gray-100 transition-all active:scale-95"
          >
            {mode === 'home' ? <X className="w-8 h-8 text-gray-600" /> : <Home className="w-8 h-8 text-gray-600" />}
          </button>
          <div>
            <h1 className="text-3xl font-black text-[#4A342E] leading-none">
              {lang === 'ko' ? '사운드 앤 스케치' : 'Sound & Sketch'}
            </h1>
            <p className="text-[#A68B7C] font-bold mt-1">Cognitive Rehabilitation</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-[#FFF0D9] px-6 py-3 rounded-2xl border-2 border-[#FFD9A0] flex items-center gap-3">
            <Star className="w-8 h-8 text-[#FFB800] fill-current" />
            <span className="text-3xl font-black text-[#4A342E]">{score}</span>
          </div>
          {mode !== 'home' && (
            <div className="bg-white px-6 py-3 rounded-2xl border-2 border-gray-200 flex items-center gap-3">
              <Clock className="w-8 h-8 text-gray-400" />
              <span className="text-3xl font-black text-gray-600">{timeLeft}</span>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 flex relative overflow-hidden">
        {mode === 'home' ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-10 space-y-12">
            {/* Mimi Character */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="w-64 h-64 bg-white rounded-full border-8 border-[#FFD9A0] flex items-center justify-center shadow-xl overflow-hidden">
                <img 
                  src="https://storage.googleapis.com/static-content-ais/images/5w6d5kcggzo2iwp6uckqtl/177491424081/1741469000000_mimi.png" 
                  alt="Mimi the Cat"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/bottts/svg?seed=Mimi&backgroundColor=ffd9a0";
                  }}
                />
              </div>
              <div className="absolute -top-10 -right-20 bg-white p-6 rounded-3xl border-4 border-[#FFD9A0] shadow-xl max-w-xs">
                <p className="text-xl font-bold text-[#4A342E] leading-tight">
                  {lang === 'ko' ? "어떤 게임을 해볼까요? 제가 도와드릴게요!" : "Which game shall we play? I'll help you!"}
                </p>
                <div className="absolute -bottom-4 left-10 w-8 h-8 bg-white border-r-4 border-b-4 border-[#FFD9A0] rotate-45" />
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-5xl">
              {[
                { id: 'draw_guess', title: '그림 그리고 맞추기', sub: 'Draw & Guess', color: 'bg-[#FF7E67]', icon: <Pencil className="w-10 h-10" /> },
                { id: 'listen_match', title: '듣고 맞추기', sub: 'Listen & Match', color: 'bg-[#67B7FF]', icon: <Volume2 className="w-10 h-10" /> },
                { id: 'memory', title: '기억력 그림', sub: 'Memory Drawing', color: 'bg-[#FFB800]', icon: <Clock className="w-10 h-10" /> },
                { id: 'association', title: '단어 연상 그림', sub: 'Word Association', color: 'bg-[#4CAF50]', icon: <Sparkles className="w-10 h-10" /> }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => startNewRound(item.id as GameMode)}
                  className={`${item.color} p-8 rounded-[40px] text-white shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-left flex items-center justify-between group`}
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black">{lang === 'ko' ? item.title : item.sub}</h2>
                    <p className="text-xl font-bold opacity-80">{item.sub}</p>
                  </div>
                  <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                    {item.icon}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex">
            {/* Left Panel: Hint & Info */}
            <div className="w-1/4 bg-white border-r-4 border-[#FFD9A0] p-8 flex flex-col space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-[#A68B7C] uppercase tracking-widest">
                  {lang === 'ko' ? '현재 힌트' : 'Current Hint'}
                </h3>
                <div className="bg-[#FFF9F0] p-8 rounded-3xl border-4 border-dashed border-[#FFD9A0] flex flex-col items-center justify-center space-y-4">
                  {mode === 'listen_match' ? (
                    <button 
                      onClick={() => speak(currentWord.word)}
                      className="w-24 h-24 rounded-full bg-[#67B7FF] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all"
                    >
                      <Volume2 className="w-12 h-12" />
                    </button>
                  ) : (
                    <span className="text-7xl font-black text-[#4A342E] tracking-[0.2em]">
                      {currentWord.hint}
                    </span>
                  )}
                  <p className="text-xl font-bold text-[#A68B7C]">
                    {mode === 'draw_guess' ? (lang === 'ko' ? '초성을 보고 그려보세요' : 'Draw based on initials') : 
                     mode === 'listen_match' ? (lang === 'ko' ? '소리를 다시 들으려면 클릭' : 'Click to hear again') :
                     (lang === 'ko' ? '상상력을 발휘하세요' : 'Use your imagination')}
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-end">
                <div className="bg-[#FFF0D9] p-6 rounded-3xl border-2 border-[#FFD9A0] space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-[#FFD9A0] overflow-hidden">
                      <img 
                        src="https://api.dicebear.com/7.x/bottts/svg?seed=Mimi&backgroundColor=ffd9a0" 
                        alt="Mimi"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-lg font-bold text-[#4A342E] leading-tight">
                      {gameState === 'playing' ? 
                        (lang === 'ko' ? "천천히 그려보세요. 제가 지켜보고 있어요!" : "Take your time. I'm watching!") :
                        (lang === 'ko' ? "정말 멋진 그림이에요!" : "What a wonderful drawing!")
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Canvas */}
            <div className="flex-1 p-8 flex flex-col space-y-6">
              <div className="flex-1 bg-white rounded-[40px] border-8 border-[#FFD9A0] shadow-inner relative overflow-hidden touch-none">
                {showMemoryImage && mode === 'memory' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                    <div className="text-center space-y-8">
                      <div className="w-64 h-64 bg-[#FFF9F0] rounded-[40px] border-4 border-[#FFD9A0] flex items-center justify-center">
                        <img 
                          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${currentWord.word}`} 
                          alt="Memory Target"
                          className="w-48 h-48"
                        />
                      </div>
                      <h2 className="text-4xl font-black text-[#4A342E]">{currentWord.word}</h2>
                    </div>
                  </div>
                ) : null}

                {mode === 'listen_match' ? (
                  <div className="w-full h-full grid grid-cols-2 gap-8 p-8">
                    {options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleOptionSelect(opt)}
                        className="bg-[#FFF9F0] rounded-[40px] border-4 border-[#FFD9A0] hover:bg-[#FFD9A0] hover:text-white transition-all text-5xl font-black text-[#4A342E] flex flex-col items-center justify-center gap-6 group"
                      >
                        <img 
                          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${opt}`} 
                          alt={opt}
                          className="w-32 h-32 group-hover:scale-110 transition-transform"
                        />
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair"
                  />
                )}
              </div>

              {/* Drawing Controls */}
              {mode !== 'listen_match' && (
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4 bg-white p-3 rounded-3xl border-4 border-[#FFD9A0]">
                    <button 
                      onClick={() => setTool('pencil')}
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${tool === 'pencil' ? 'bg-[#FF7E67] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      <Pencil className="w-10 h-10" />
                    </button>
                    <button 
                      onClick={() => setTool('eraser')}
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${tool === 'eraser' ? 'bg-[#FF7E67] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      <Eraser className="w-10 h-10" />
                    </button>
                    <div className="w-px h-12 bg-gray-200 mx-2" />
                    <button 
                      onClick={clearCanvas}
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <RotateCcw className="w-10 h-10" />
                    </button>
                  </div>

                  <button 
                    onClick={handleFinishDrawing}
                    className="flex-1 h-24 bg-[#4CAF50] text-white rounded-[32px] text-4xl font-black shadow-xl hover:bg-[#43A047] active:scale-95 transition-all flex items-center justify-center gap-4"
                  >
                    <CheckCircle2 className="w-12 h-12" />
                    {lang === 'ko' ? '그림 완료!' : 'Finish Drawing!'}
                  </button>
                </div>
              )}
            </div>

            {/* Right Panel: AI Guessing */}
            <div className="w-1/4 bg-white border-l-4 border-[#FFD9A0] p-8 flex flex-col space-y-8">
              <h3 className="text-2xl font-black text-[#A68B7C] uppercase tracking-widest">
                {lang === 'ko' ? 'AI의 추측' : 'AI Guesses'}
              </h3>
              
              <div className="flex-1 space-y-6">
                <AnimatePresence mode="wait">
                  {gameState === 'result' ? (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      {aiGuesses.map((guess, idx) => (
                        <div 
                          key={idx}
                          className={`p-6 rounded-3xl border-4 flex items-center justify-between ${guess === currentWord.word ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                        >
                          <span className="text-3xl font-black">{guess}</span>
                          {guess === currentWord.word && <CheckCircle2 className="w-10 h-10" />}
                        </div>
                      ))}
                      
                      <button
                        onClick={() => startNewRound(mode)}
                        className="w-full py-6 bg-[#FFB800] text-white rounded-3xl text-2xl font-black shadow-lg hover:bg-[#FFA000] transition-all flex items-center justify-center gap-3"
                      >
                        <Play className="w-8 h-8 fill-current" />
                        {lang === 'ko' ? '다음 라운드' : 'Next Round'}
                      </button>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                      <div className="w-32 h-32 rounded-full border-8 border-dashed border-gray-300 animate-spin-slow" />
                      <p className="text-2xl font-bold text-gray-400">
                        {lang === 'ko' ? '그림을 그리면\nAI가 분석합니다' : 'Draw to let\nAI analyze'}
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}} />
    </motion.div>
  );
};

export default SoundAndSketch;

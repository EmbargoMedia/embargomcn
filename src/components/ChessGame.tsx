import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RotateCcw, 
  Trophy, 
  History,
  ChevronRight,
  Play,
  Info,
  Lightbulb,
  Settings,
  Brain,
  User,
  AlertCircle
} from 'lucide-react';
import { Chess, Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';

const ChessboardAny = Chessboard as any;

// Types
type Difficulty = 'easy' | 'medium' | 'hard';

interface ChessGameProps {
  onClose: () => void;
  lang: string;
}

export default function ChessGame({ onClose, lang }: ChessGameProps) {
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const t = {
    ko: {
      title: '체스 전략 훈련',
      subtitle: 'Auditory Cognitive Strategy',
      difficulty: '난이도 선택',
      easy: '쉬움',
      medium: '보통',
      hard: '어려움',
      start: '게임 시작',
      reset: '다시 시작',
      hint: '힌트 보기',
      history: '기록',
      check: '체크!',
      checkmate: '체크메이트!',
      draw: '무승부',
      win: '승리!',
      loss: '패배...',
      thinking: 'AI가 생각 중...',
      yourTurn: '당신의 차례입니다',
      aiTurn: 'AI의 차례입니다'
    },
    en: {
      title: 'Chess Strategy Training',
      subtitle: 'Auditory Cognitive Strategy',
      difficulty: 'Select Difficulty',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      start: 'Start Game',
      reset: 'Reset Game',
      hint: 'Get Hint',
      history: 'History',
      check: 'Check!',
      checkmate: 'Checkmate!',
      draw: 'Draw',
      win: 'You Win!',
      loss: 'AI Wins',
      thinking: 'AI is thinking...',
      yourTurn: 'Your Turn',
      aiTurn: 'AI Turn'
    }
  }[lang === 'ko' ? 'ko' : 'en'];

  // Piece values for evaluation
  const pieceValues: Record<string, number> = {
    p: 10,
    n: 30,
    b: 30,
    r: 50,
    q: 90,
    k: 900
  };

  // Basic evaluation function
  const evaluateBoard = (chess: Chess) => {
    let totalEvaluation = 0;
    const board = chess.board();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = pieceValues[piece.type] || 0;
          totalEvaluation += piece.color === 'w' ? value : -value;
        }
      }
    }
    return totalEvaluation;
  };

  // Minimax with Alpha-Beta Pruning
  const minimax = (chess: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
    if (depth === 0 || chess.isGameOver()) {
      return -evaluateBoard(chess);
    }

    const moves = chess.moves();
    if (isMaximizing) {
      let bestEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();
        bestEval = Math.max(bestEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return bestEval;
    } else {
      let bestEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const evaluation = minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();
        bestEval = Math.min(bestEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return bestEval;
    }
  };

  const findBestMove = (chess: Chess, depth: number) => {
    const moves = chess.moves();
    let bestMove = null;
    let bestValue = -Infinity;

    for (const move of moves) {
      chess.move(move);
      const boardValue = minimax(chess, depth - 1, -Infinity, Infinity, false);
      chess.undo();
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    }
    return bestMove;
  };

  const makeAMove = useCallback((move: any) => {
    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
        setMoveHistory(prev => [...prev, result.san]);
        setHint(null);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game]);

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (game.turn() !== 'w' || winner) return false;

    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // always promote to queen for simplicity
    });

    return move;
  };

  // AI Turn
  useEffect(() => {
    if (game.turn() === 'b' && !game.isGameOver() && !winner) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const depth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
        const bestMove = findBestMove(game, depth);
        if (bestMove) {
          makeAMove(bestMove);
        }
        setIsThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game, difficulty, makeAMove, winner]);

  // Game Status
  useEffect(() => {
    if (game.isCheckmate()) {
      setWinner(game.turn() === 'w' ? 'AI' : 'Player');
      setStatus(t.checkmate);
    } else if (game.isDraw()) {
      setWinner('Draw');
      setStatus(t.draw);
    } else if (game.isCheck()) {
      setStatus(t.check);
    } else {
      setStatus(game.turn() === 'w' ? t.yourTurn : t.aiTurn);
    }
  }, [game, t]);

  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setWinner(null);
    setStatus('');
    setHint(null);
    setShowDifficultySelect(true);
  };

  const getHint = () => {
    if (game.turn() !== 'w' || game.isGameOver()) return;
    const bestMove = findBestMove(game, 2);
    if (bestMove) {
      setHint(bestMove);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-brand-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md h-full flex flex-col bg-slate-900/60 rounded-[40px] border border-slate-700/50 overflow-hidden relative">
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-slate-700/30 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center">
              <Trophy className="w-5 h-5 text-brand-black" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg leading-none uppercase tracking-tight">{t.title}</h2>
              <p className="text-brand-gold text-[10px] font-bold uppercase tracking-widest mt-1">{t.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Difficulty Selection Overlay */}
        <AnimatePresence>
          {showDifficultySelect && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 space-y-8"
            >
              <div className="text-center space-y-2">
                <Brain className="w-16 h-16 text-brand-gold mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white">{t.difficulty}</h3>
                <p className="text-slate-500 text-sm">Choose your opponent's level</p>
              </div>

              <div className="w-full space-y-3">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      setDifficulty(level);
                      setShowDifficultySelect(false);
                    }}
                    className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-between px-8 border ${
                      difficulty === level 
                        ? "bg-brand-gold text-brand-black border-brand-gold" 
                        : "bg-slate-900 text-white border-slate-700 hover:border-brand-gold/50"
                    }`}
                  >
                    <span>{t[level]}</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Game Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {/* Status Bar */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-white shadow-[0_0_10px_white]' : 'bg-slate-600'}`} />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                {isThinking ? t.thinking : status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-brand-gold uppercase tracking-widest">
                {t[difficulty]}
              </span>
            </div>
          </div>

          {/* Chessboard Container */}
          <div className="aspect-square w-full max-w-[360px] mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800">
            <ChessboardAny 
              id="BasicBoard"
              position={game.fen()} 
              onPieceDrop={onDrop}
              boardOrientation="white"
              customDarkSquareStyle={{ backgroundColor: '#1e293b' }}
              customLightSquareStyle={{ backgroundColor: '#334155' }}
              animationDuration={300}
            />
          </div>

          {/* Hint Display */}
          {hint && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-gold/10 border border-brand-gold/30 p-4 rounded-2xl flex items-center gap-3"
            >
              <Lightbulb className="w-5 h-5 text-brand-gold" />
              <p className="text-sm font-bold text-white">
                {lang === 'ko' ? `추천 수: ${hint}` : `Suggested move: ${hint}`}
              </p>
            </motion.div>
          )}

          {/* History & Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/40 rounded-3xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-slate-500">
                <History className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.history}</span>
              </div>
              <div className="h-20 overflow-y-auto scrollbar-hide space-y-1">
                {moveHistory.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic">No moves yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                      <React.Fragment key={i}>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {i + 1}. {moveHistory[i * 2]}
                        </p>
                        {moveHistory[i * 2 + 1] && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            {moveHistory[i * 2 + 1]}
                          </p>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-3xl p-5 border border-slate-800 flex flex-col justify-center items-center space-y-2">
              {winner ? (
                <>
                  <Trophy className="w-8 h-8 text-brand-gold" />
                  <p className="text-lg font-black text-white">
                    {winner === 'Player' ? t.win : winner === 'AI' ? t.loss : t.draw}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <User className="w-6 h-6 text-white mb-1" />
                      <span className="text-[8px] font-bold text-slate-500">YOU</span>
                    </div>
                    <div className="w-px h-8 bg-slate-800" />
                    <div className="flex flex-col items-center">
                      <Cpu className="w-6 h-6 text-brand-gold mb-1" />
                      <span className="text-[8px] font-bold text-slate-500">AI</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Progress</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-6 bg-slate-900/80 border-t border-slate-800 flex gap-3">
          <button 
            onClick={resetGame}
            className="flex-1 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-700 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            {t.reset}
          </button>
          <button 
            onClick={getHint}
            disabled={game.turn() !== 'w' || game.isGameOver()}
            className="flex-1 py-4 rounded-2xl bg-brand-gold text-brand-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20 disabled:opacity-50 transition-all"
          >
            <Lightbulb className="w-5 h-5" />
            {t.hint}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Cpu({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>
    </svg>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Cpu, 
  Coins, 
  RotateCcw, 
  Trophy, 
  History,
  ChevronRight,
  MessageSquare,
  Play,
  Pause,
  Info
} from 'lucide-react';
import * as PokerSolver from 'pokersolver';
const { Hand } = PokerSolver;

// Types
type Suit = 's' | 'h' | 'd' | 'c';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

interface Card {
  rank: Rank;
  suit: Suit;
}

interface Player {
  id: number;
  name: string;
  isAI: boolean;
  chips: number;
  cards: Card[];
  currentBet: number;
  isFolded: boolean;
  isDealer: boolean;
  lastAction: string;
}

type GamePhase = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown' | 'ended';

interface PokerGameProps {
  onClose: () => void;
  lang: string;
}

const SUITS: Suit[] = ['s', 'h', 'd', 'c'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

const SUIT_SYMBOLS: Record<Suit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣'
};

const SUIT_COLORS: Record<Suit, string> = {
  s: 'text-slate-900',
  h: 'text-rose-600',
  d: 'text-blue-600',
  c: 'text-emerald-700'
};

const INITIAL_CHIPS = 1000;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;

export default function PokerGame({ onClose, lang }: PokerGameProps) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([
    { id: 0, name: lang === 'ko' ? '나' : 'Me', isAI: false, chips: INITIAL_CHIPS, cards: [], currentBet: 0, isFolded: false, isDealer: true, lastAction: '' },
    { id: 1, name: 'AI Alpha', isAI: true, chips: INITIAL_CHIPS, cards: [], currentBet: 0, isFolded: false, isDealer: false, lastAction: '' },
    { id: 2, name: 'AI Beta', isAI: true, chips: INITIAL_CHIPS, cards: [], currentBet: 0, isFolded: false, isDealer: false, lastAction: '' },
  ]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('pre-flop');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [dealerIndex, setDealerIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningHand, setWinningHand] = useState<string>('');
  const [minRaise, setMinRaise] = useState(BIG_BLIND);
  const [currentCallAmount, setCurrentCallAmount] = useState(BIG_BLIND);

  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-19), msg]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Initialize Game
  const initRound = useCallback(() => {
    const newDeck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        newDeck.push({ rank, suit });
      }
    }
    // Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    const nextDealerIndex = (dealerIndex + 1) % 3;
    setDealerIndex(nextDealerIndex);

    const sbIndex = (nextDealerIndex + 1) % 3;
    const bbIndex = (nextDealerIndex + 2) % 3;

    const updatedPlayers = players.map((p, idx) => ({
      ...p,
      cards: [newDeck.pop()!, newDeck.pop()!],
      currentBet: idx === sbIndex ? SMALL_BLIND : idx === bbIndex ? BIG_BLIND : 0,
      isFolded: false,
      isDealer: idx === nextDealerIndex,
      lastAction: idx === sbIndex ? 'SB' : idx === bbIndex ? 'BB' : ''
    }));

    setDeck(newDeck);
    setPlayers(updatedPlayers);
    setCommunityCards([]);
    setPot(SMALL_BLIND + BIG_BLIND);
    setPhase('pre-flop');
    setCurrentPlayerIndex((bbIndex + 1) % 3);
    setWinner(null);
    setWinningHand('');
    setCurrentCallAmount(BIG_BLIND);
    setMinRaise(BIG_BLIND);
    addLog(lang === 'ko' ? '새 라운드 시작!' : 'New round started!');
  }, [dealerIndex, players, lang]);

  useEffect(() => {
    initRound();
  }, []);

  const nextPhase = () => {
    const activePlayers = players.filter(p => !p.isFolded);
    if (activePlayers.length === 1) {
      handleShowdown(activePlayers[0]);
      return;
    }

    if (phase === 'pre-flop') {
      const flop = [deck.pop()!, deck.pop()!, deck.pop()!];
      setCommunityCards(flop);
      setPhase('flop');
      addLog('Flop revealed');
    } else if (phase === 'flop') {
      setCommunityCards(prev => [...prev, deck.pop()!]);
      setPhase('turn');
      addLog('Turn revealed');
    } else if (phase === 'turn') {
      setCommunityCards(prev => [...prev, deck.pop()!]);
      setPhase('river');
      addLog('River revealed');
    } else if (phase === 'river') {
      setPhase('showdown');
      handleShowdown();
    }

    // Reset bets for next phase
    setPlayers(prev => prev.map(p => ({ ...p, currentBet: 0, lastAction: p.isFolded ? 'Fold' : '' })));
    setCurrentCallAmount(0);
    setCurrentPlayerIndex((dealerIndex + 1) % 3);
  };

  const handleShowdown = (loneWinner?: Player) => {
    if (loneWinner) {
      setWinner(loneWinner);
      setPlayers(prev => prev.map(p => p.id === loneWinner.id ? { ...p, chips: p.chips + pot } : p));
      addLog(`${loneWinner.name} wins ${pot} chips!`);
      setPhase('ended');
      return;
    }

    const activePlayers = players.filter(p => !p.isFolded);
    const hands = activePlayers.map(p => {
      const cardStrings = [...p.cards, ...communityCards].map(c => `${c.rank}${c.suit}`);
      return { player: p, hand: Hand.solve(cardStrings) };
    });

    const winners = Hand.winners(hands.map(h => h.hand));
    const winningHandInfo = winners[0];
    const winningPlayerIds = hands.filter(h => winners.includes(h.hand)).map(h => h.player.id);
    
    const share = Math.floor(pot / winningPlayerIds.length);
    setPlayers(prev => prev.map(p => winningPlayerIds.includes(p.id) ? { ...p, chips: p.chips + share } : p));
    
    const winningNames = winningPlayerIds.map(id => players.find(p => p.id === id)?.name).join(', ');
    setWinner(players.find(p => p.id === winningPlayerIds[0]) || null);
    setWinningHand(winningHandInfo.descr);
    addLog(`${winningNames} wins with ${winningHandInfo.descr}!`);
    setPhase('ended');
  };

  const handleAction = (action: 'fold' | 'check' | 'call' | 'raise', amount: number = 0) => {
    const player = players[currentPlayerIndex];
    let updatedPlayers = [...players];
    let newPot = pot;
    let newCallAmount = currentCallAmount;
    let actionText = '';

    if (action === 'fold') {
      updatedPlayers[currentPlayerIndex].isFolded = true;
      updatedPlayers[currentPlayerIndex].lastAction = 'Fold';
      actionText = 'Folded';
    } else if (action === 'check') {
      updatedPlayers[currentPlayerIndex].lastAction = 'Check';
      actionText = 'Checked';
    } else if (action === 'call') {
      const callNeeded = currentCallAmount - player.currentBet;
      const actualCall = Math.min(callNeeded, player.chips);
      updatedPlayers[currentPlayerIndex].chips -= actualCall;
      updatedPlayers[currentPlayerIndex].currentBet += actualCall;
      updatedPlayers[currentPlayerIndex].lastAction = 'Call';
      newPot += actualCall;
      actionText = 'Called';
    } else if (action === 'raise') {
      const totalBet = amount;
      const additionalBet = totalBet - player.currentBet;
      updatedPlayers[currentPlayerIndex].chips -= additionalBet;
      updatedPlayers[currentPlayerIndex].currentBet = totalBet;
      updatedPlayers[currentPlayerIndex].lastAction = 'Raise';
      newPot += additionalBet;
      newCallAmount = totalBet;
      actionText = `Raised to ${totalBet}`;
    }

    addLog(`${player.name}: ${actionText}`);
    setPlayers(updatedPlayers);
    setPot(newPot);
    setCurrentCallAmount(newCallAmount);

    // Check if round phase is over
    const activePlayers = updatedPlayers.filter(p => !p.isFolded);
    const allActed = updatedPlayers.every(p => p.isFolded || p.lastAction !== '');
    const betsEqual = activePlayers.every(p => p.currentBet === newCallAmount || p.chips === 0);

    if (activePlayers.length === 1) {
      handleShowdown(activePlayers[0]);
    } else if (allActed && betsEqual) {
      setTimeout(nextPhase, 1000);
    } else {
      setCurrentPlayerIndex((currentPlayerIndex + 1) % 3);
    }
  };

  // AI Logic
  useEffect(() => {
    if (phase !== 'ended' && phase !== 'showdown' && players[currentPlayerIndex].isAI && !players[currentPlayerIndex].isFolded) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const player = players[currentPlayerIndex];
        const callAmount = currentCallAmount - player.currentBet;
        
        // Simple AI decision
        const rand = Math.random();
        if (callAmount === 0) {
          if (rand > 0.8) handleAction('raise', currentCallAmount + BIG_BLIND);
          else handleAction('check');
        } else {
          if (rand > 0.9) handleAction('raise', currentCallAmount + BIG_BLIND);
          else if (rand > 0.2) handleAction('call');
          else handleAction('fold');
        }
        setIsThinking(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayerIndex, phase, currentCallAmount]);

  const renderCard = (card: Card, hidden: boolean = false) => {
    if (hidden) {
      return (
        <div className="w-12 h-16 bg-brand-gold rounded-md border-2 border-white flex items-center justify-center shadow-md">
          <div className="w-8 h-12 border border-white/30 rounded-sm flex items-center justify-center">
            <span className="text-white font-black text-xs">P</span>
          </div>
        </div>
      );
    }
    return (
      <motion.div 
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        className="w-12 h-16 bg-white rounded-md border border-slate-200 flex flex-col items-center justify-between p-1 shadow-md relative overflow-hidden"
      >
        <div className={`self-start text-[10px] font-black leading-none ${SUIT_COLORS[card.suit]}`}>
          {card.rank}
        </div>
        <div className={`text-xl leading-none ${SUIT_COLORS[card.suit]}`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
        <div className={`self-end text-[10px] font-black leading-none rotate-180 ${SUIT_COLORS[card.suit]}`}>
          {card.rank}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-brand-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md h-full flex flex-col bg-emerald-900/40 rounded-[40px] border border-emerald-500/30 overflow-hidden relative">
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-emerald-500/20 bg-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center">
              <Trophy className="w-5 h-5 text-brand-black" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg leading-none">TEXAS HOLD'EM</h2>
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-1">MVP Edition</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Table Area */}
        <div className="flex-1 relative p-4 flex flex-col items-center justify-center">
          {/* AI Player 1 (Top Left) */}
          <div className="absolute top-10 left-10 flex flex-col items-center gap-2">
            <div className={cn(
              "w-16 h-16 rounded-full bg-slate-800 border-2 flex items-center justify-center relative",
              currentPlayerIndex === 1 ? "border-brand-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]" : "border-slate-700",
              players[1].isFolded && "opacity-50 grayscale"
            )}>
              <Cpu className="w-8 h-8 text-slate-400" />
              {players[1].isDealer && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-black text-slate-900 shadow-sm">D</div>
              )}
              {currentPlayerIndex === 1 && isThinking && (
                <div className="absolute -top-1 -right-1 w-4 h-4">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gold"></span>
                  </span>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-white text-[10px] font-black">{players[1].name}</p>
              <p className="text-brand-gold text-[10px] font-bold flex items-center gap-1"><Coins className="w-3 h-3" /> {players[1].chips}</p>
              {players[1].lastAction && <p className="text-emerald-400 text-[8px] font-black uppercase mt-1">{players[1].lastAction}</p>}
            </div>
            <div className="flex gap-1 mt-1">
              {players[1].cards.map((_, i) => renderCard({ rank: '2', suit: 's' }, phase !== 'showdown' || players[1].isFolded))}
            </div>
          </div>

          {/* AI Player 2 (Top Right) */}
          <div className="absolute top-10 right-10 flex flex-col items-center gap-2">
            <div className={cn(
              "w-16 h-16 rounded-full bg-slate-800 border-2 flex items-center justify-center relative",
              currentPlayerIndex === 2 ? "border-brand-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]" : "border-slate-700",
              players[2].isFolded && "opacity-50 grayscale"
            )}>
              <Cpu className="w-8 h-8 text-slate-400" />
              {players[2].isDealer && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-black text-slate-900 shadow-sm">D</div>
              )}
              {currentPlayerIndex === 2 && isThinking && (
                <div className="absolute -top-1 -right-1 w-4 h-4">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gold"></span>
                  </span>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-white text-[10px] font-black">{players[2].name}</p>
              <p className="text-brand-gold text-[10px] font-bold flex items-center gap-1"><Coins className="w-3 h-3" /> {players[2].chips}</p>
              {players[2].lastAction && <p className="text-emerald-400 text-[8px] font-black uppercase mt-1">{players[2].lastAction}</p>}
            </div>
            <div className="flex gap-1 mt-1">
              {players[2].cards.map((_, i) => renderCard({ rank: '2', suit: 's' }, phase !== 'showdown' || players[2].isFolded))}
            </div>
          </div>

          {/* Community Cards & Pot */}
          <div className="flex flex-col items-center gap-6">
            <div className="bg-emerald-950/60 backdrop-blur-md px-6 py-3 rounded-full border border-emerald-500/30 flex items-center gap-3">
              <Coins className="w-5 h-5 text-brand-gold" />
              <span className="text-white font-black text-xl">POT: {pot}</span>
            </div>
            
            <div className="flex gap-2 min-h-[64px]">
              {communityCards.map((card, i) => renderCard(card))}
              {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                <div key={i} className="w-12 h-16 rounded-md border-2 border-emerald-500/20 bg-emerald-900/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                </div>
              ))}
            </div>

            {phase === 'ended' && winner && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-brand-gold p-4 rounded-2xl text-brand-black text-center shadow-2xl"
              >
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Winner</p>
                <p className="text-lg font-black">{winner.name}</p>
                <p className="text-xs font-bold">{winningHand}</p>
              </motion.div>
            )}
          </div>

          {/* Human Player (Bottom) */}
          <div className="absolute bottom-10 flex flex-col items-center gap-4">
            <div className="flex gap-3">
              {players[0].cards.map((card, i) => renderCard(card, players[0].isFolded))}
            </div>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-full bg-brand-gold/10 border-2 flex items-center justify-center relative",
                currentPlayerIndex === 0 ? "border-brand-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]" : "border-brand-gold/30",
                players[0].isFolded && "opacity-50 grayscale"
              )}>
                <User className="w-8 h-8 text-brand-gold" />
                {players[0].isDealer && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-black text-slate-900 shadow-sm">D</div>
                )}
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-black">{players[0].name}</p>
                <p className="text-brand-gold text-sm font-bold flex items-center gap-1"><Coins className="w-4 h-4" /> {players[0].chips}</p>
                {players[0].lastAction && <p className="text-emerald-400 text-[10px] font-black uppercase mt-1">{players[0].lastAction}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Game Logs (Side/Bottom) */}
        <div className="h-24 bg-brand-black/40 border-t border-emerald-500/20 p-3 overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-3 h-3 text-emerald-500" />
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Game Log</span>
          </div>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <p key={i} className="text-[10px] text-slate-400 font-medium leading-tight">{log}</p>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 bg-emerald-950/60 border-t border-emerald-500/20">
          {phase === 'ended' ? (
            <button 
              onClick={initRound}
              className="w-full py-4 rounded-2xl bg-brand-gold text-brand-black font-black text-lg shadow-xl flex items-center justify-center gap-3 hover:brightness-110 transition-all"
            >
              <RotateCcw className="w-6 h-6" />
              {lang === 'ko' ? '다음 라운드' : 'Next Round'}
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <button 
                disabled={currentPlayerIndex !== 0 || isThinking}
                onClick={() => handleAction('fold')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 disabled:opacity-30 transition-all"
              >
                <X className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-black uppercase">Fold</span>
              </button>
              
              <button 
                disabled={currentPlayerIndex !== 0 || isThinking || currentCallAmount > players[0].currentBet}
                onClick={() => handleAction('check')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 disabled:opacity-30 transition-all"
              >
                <Pause className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-black uppercase">Check</span>
              </button>

              <button 
                disabled={currentPlayerIndex !== 0 || isThinking || currentCallAmount <= players[0].currentBet}
                onClick={() => handleAction('call')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-black uppercase">Call</span>
              </button>

              <button 
                disabled={currentPlayerIndex !== 0 || isThinking}
                onClick={() => handleAction('raise', currentCallAmount + BIG_BLIND)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-brand-gold disabled:opacity-30 transition-all"
              >
                <RotateCcw className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-black uppercase">Raise</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

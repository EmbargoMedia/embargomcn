import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, RefreshCcw, ArrowRight } from 'lucide-react';

interface TarotCard {
  id: number;
  name: string;
  nameKo: string;
  image: string;
  description: string;
}

const TAROT_CARDS: TarotCard[] = [
  { id: 0, name: "The Fool", nameKo: "광대", image: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?q=80&w=800", description: "새로운 시작, 모험, 순수함" },
  { id: 1, name: "The Magician", nameKo: "마법사", image: "https://images.unsplash.com/photo-1514894780063-58a98a8b832d?q=80&w=800", description: "창조력, 기술, 의지력" },
  { id: 2, name: "The High Priestess", nameKo: "고위 여사제", image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800", description: "직관, 신비, 내면의 목소리" },
  { id: 3, name: "The Empress", nameKo: "여황제", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800", description: "풍요, 모성, 자연" },
  { id: 4, name: "The Emperor", nameKo: "황제", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800", description: "권위, 구조, 통제" },
  { id: 6, name: "The Lovers", nameKo: "연인", image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800", description: "사랑, 조화, 선택" },
  { id: 10, name: "Wheel of Fortune", nameKo: "운명의 수레바퀴", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800", description: "운명, 변화, 행운" },
  { id: 17, name: "The Star", nameKo: "별", image: "https://images.unsplash.com/photo-1464802686167-b939a67e06a1?q=80&w=800", description: "희망, 영감, 평온" },
  { id: 18, name: "The Moon", nameKo: "달", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800", description: "환상, 불안, 무의식" },
  { id: 19, name: "The Sun", nameKo: "태양", image: "https://images.unsplash.com/photo-1444333509404-840238a4625a?q=80&w=800", description: "성공, 활력, 기쁨" },
];

interface TarotGameProps {
  onClose: () => void;
  onSelectCard: (cardName: string) => void;
  lang: string;
}

const TarotGame: React.FC<TarotGameProps> = ({ onClose, onSelectCard, lang }) => {
  const [deck, setDeck] = useState<number[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [revealedCard, setRevealedCard] = useState<TarotCard | null>(null);
  const [isShuffling, setIsShuffling] = useState(true);

  useEffect(() => {
    shuffleDeck();
  }, []);

  const shuffleDeck = () => {
    setIsShuffling(true);
    setSelectedIdx(null);
    setRevealedCard(null);
    
    setTimeout(() => {
      const newDeck = Array.from({ length: 5 }, () => Math.floor(Math.random() * TAROT_CARDS.length));
      setDeck(newDeck);
      setIsShuffling(false);
    }, 1500);
  };

  const handlePickCard = (idx: number) => {
    if (selectedIdx !== null || isShuffling) return;
    
    setSelectedIdx(idx);
    const card = TAROT_CARDS[deck[idx]];
    
    setTimeout(() => {
      setRevealedCard(card);
    }, 600);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-brand-black flex flex-col items-center justify-center p-6"
    >
      <div className="w-full max-w-md h-full flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">TAROT READING</h1>
            <p className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em]">
              {lang === 'ko' ? '운명의 카드를 선택하세요' : 'Choose your destiny'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-12">
          <AnimatePresence mode="wait">
            {!revealedCard ? (
              <motion.div 
                key="deck"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-wrap justify-center gap-4"
              >
                {deck.map((cardId, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ rotateY: 0 }}
                    animate={{ 
                      rotateY: selectedIdx === idx ? 180 : 0,
                      scale: selectedIdx === idx ? 1.1 : 1,
                      y: isShuffling ? [0, -20, 0] : 0,
                      opacity: selectedIdx !== null && selectedIdx !== idx ? 0.3 : 1
                    }}
                    transition={{ 
                      duration: 0.6,
                      delay: isShuffling ? idx * 0.1 : 0
                    }}
                    onClick={() => handlePickCard(idx)}
                    className={`relative w-24 h-40 rounded-xl cursor-pointer preserve-3d transition-shadow ${
                      selectedIdx === idx ? 'shadow-[0_0_30px_rgba(197,160,89,0.5)]' : 'hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                    }`}
                  >
                    {/* Card Back */}
                    <div className="absolute inset-0 bg-brand-dark-gray border-2 border-brand-gold/30 rounded-xl flex items-center justify-center overflow-hidden backface-hidden">
                      <div className="absolute inset-2 border border-brand-gold/10 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-brand-gold/20" />
                      </div>
                      <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-gold/5 via-transparent to-transparent" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.8, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full flex flex-col items-center text-center space-y-8"
              >
                <div className="relative w-64 h-96 rounded-3xl overflow-hidden border-4 border-brand-gold shadow-[0_0_50px_rgba(197,160,89,0.4)]">
                  <img 
                    src={revealedCard.image} 
                    alt={revealedCard.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-0 right-0">
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
                      {lang === 'ko' ? revealedCard.nameKo : revealedCard.name}
                    </h2>
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <p className="text-brand-gold font-black text-lg uppercase tracking-widest">
                    {revealedCard.description}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {lang === 'ko' 
                      ? "이 카드는 당신의 현재 상황에 대한 중요한 메시지를 담고 있습니다." 
                      : "This card holds an important message for your current situation."}
                  </p>
                </div>

                <div className="flex gap-4 w-full">
                  <button 
                    onClick={shuffleDeck}
                    className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                  >
                    <RefreshCcw className="w-5 h-5" />
                    {lang === 'ko' ? '다시 뽑기' : 'Retry'}
                  </button>
                  <button 
                    onClick={() => onSelectCard(lang === 'ko' ? revealedCard.nameKo : revealedCard.name)}
                    className="flex-[2] py-4 rounded-2xl bg-brand-gold text-brand-black font-black flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
                  >
                    {lang === 'ko' ? '룬에게 해석 듣기' : 'Ask LUNE'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="py-8 text-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-bold">
            Trust your intuition and the universe
          </p>
        </div>
      </div>

      <style>{`
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </motion.div>
  );
};

export default TarotGame;

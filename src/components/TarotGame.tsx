import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, RefreshCcw, ArrowRight, LayoutGrid } from 'lucide-react';
import { cn } from '../utils/cn';

interface TarotCard {
  id: number;
  name: string;
  nameKo: string;
  image: string;
  description: string;
  meaning: string;
  meaningKo: string;
}

const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, name: "The Fool", nameKo: "광대", image: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?q=80&w=800", description: "새로운 시작, 모험, 순수함", meaning: "A new journey begins. Trust your intuition and take a leap of faith.", meaningKo: "새로운 여정이 시작됩니다. 당신의 직관을 믿고 용기 있게 나아가세요." },
  { id: 1, name: "The Magician", nameKo: "마법사", image: "https://images.unsplash.com/photo-1514894780063-58a98a8b832d?q=80&w=800", description: "창조력, 기술, 의지력", meaning: "You have all the tools you need to succeed. Manifest your desires.", meaningKo: "당신은 성공에 필요한 모든 능력을 갖추고 있습니다. 원하는 바를 실현하세요." },
  { id: 2, name: "The High Priestess", nameKo: "고위 여사제", image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800", description: "직관, 신비, 내면의 목소리", meaning: "Listen to your inner voice. The answers you seek are within you.", meaningKo: "내면의 목소리에 귀를 기울이세요. 당신이 찾는 답은 이미 당신 안에 있습니다." },
  { id: 3, name: "The Empress", nameKo: "여황제", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800", description: "풍요, 모성, 자연", meaning: "Abundance and creativity surround you. Nurture your projects and relationships.", meaningKo: "풍요와 창조성이 당신을 감싸고 있습니다. 당신의 프로젝트와 관계를 소중히 가꾸세요." },
  { id: 4, name: "The Emperor", nameKo: "황제", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800", description: "권위, 구조, 통제", meaning: "Establish order and structure. Your leadership will bring stability.", meaningKo: "질서와 구조를 확립하세요. 당신의 리더십이 안정을 가져다줄 것입니다." },
  { id: 5, name: "The Hierophant", nameKo: "교황", image: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?q=80&w=800", description: "전통, 교육, 영적 지혜", meaning: "Seek wisdom from tradition or a mentor. Follow established paths.", meaningKo: "전통이나 멘토로부터 지혜를 구하세요. 검증된 길을 따르는 것이 좋습니다." },
  { id: 6, name: "The Lovers", nameKo: "연인", image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800", description: "사랑, 조화, 선택", meaning: "A significant choice or relationship is highlighted. Follow your heart.", meaningKo: "중요한 선택이나 관계가 강조됩니다. 당신의 마음이 이끄는 대로 따르세요." },
  { id: 7, name: "The Chariot", nameKo: "전차", image: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?q=80&w=800", description: "승리, 의지, 전진", meaning: "Victory through determination. Stay focused and overcome obstacles.", meaningKo: "결단력을 통해 승리할 것입니다. 집중력을 유지하고 장애물을 극복하세요." },
  { id: 8, name: "Strength", nameKo: "힘", image: "https://images.unsplash.com/photo-1504006833117-8886a355efbf?q=80&w=800", description: "용기, 인내, 내면의 힘", meaning: "Gentle strength and patience will prevail. Tame your inner passions.", meaningKo: "부드러운 힘과 인내가 승리할 것입니다. 내면의 열정을 다스리세요." },
  { id: 9, name: "The Hermit", nameKo: "은둔자", image: "https://images.unsplash.com/photo-1500622397099-335e97303267?q=80&w=800", description: "성찰, 고독, 진리 탐구", meaning: "Take time for introspection. Seek the truth within yourself.", meaningKo: "자기 성찰의 시간을 가지세요. 당신 안에서 진실을 찾으십시오." },
  { id: 10, name: "Wheel of Fortune", nameKo: "운명의 수레바퀴", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800", description: "운명, 변화, 행운", meaning: "Change is coming. Embrace the cycles of life and trust the universe.", meaningKo: "변화가 다가오고 있습니다. 삶의 순환을 받아들이고 우주를 믿으세요." },
  { id: 11, name: "Justice", nameKo: "정의", image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800", description: "공정, 진실, 인과응보", meaning: "Fairness and truth will be revealed. Balance your actions.", meaningKo: "공정함과 진실이 밝혀질 것입니다. 당신의 행동에 균형을 맞추세요." },
  { id: 12, name: "The Hanged Man", nameKo: "매달린 사람", image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=800", description: "희생, 새로운 관점, 정지", meaning: "Let go of old patterns. See things from a different perspective.", meaningKo: "오래된 패턴을 버리세요. 사물을 다른 관점에서 바라보아야 할 때입니다." },
  { id: 13, name: "Death", nameKo: "죽음", image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800", description: "종결, 변화, 재생", meaning: "An end brings a new beginning. Embrace transformation.", meaningKo: "끝은 새로운 시작을 의미합니다. 변화를 기꺼이 받아들이세요." },
  { id: 14, name: "Temperance", nameKo: "절제", image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800", description: "조화, 균형, 인내", meaning: "Find balance and moderation. Blend different aspects of your life.", meaningKo: "균형과 절제를 찾으세요. 삶의 다양한 측면을 조화롭게 융합하십시오." },
  { id: 15, name: "The Devil", nameKo: "악마", image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800", description: "속박, 중독, 물질주의", meaning: "Break free from self-imposed chains. Face your shadows.", meaningKo: "스스로 만든 속박에서 벗어나세요. 당신의 어두운 면을 직시하십시오." },
  { id: 16, name: "The Tower", nameKo: "탑", image: "https://images.unsplash.com/photo-1516410529446-2c777cb7366d?q=80&w=800", description: "격변, 붕괴, 깨달음", meaning: "Sudden change brings clarity. Rebuild on a stronger foundation.", meaningKo: "갑작스러운 변화가 명확함을 가져옵니다. 더 튼튼한 토대 위에 다시 세우세요." },
  { id: 17, name: "The Star", nameKo: "별", image: "https://images.unsplash.com/photo-1464802686167-b939a67e06a1?q=80&w=800", description: "희망, 영감, 평온", meaning: "Hope and healing are present. Trust in a bright future.", meaningKo: "희망과 치유가 함께합니다. 밝은 미래를 믿고 나아가세요." },
  { id: 18, name: "The Moon", nameKo: "달", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800", description: "환상, 불안, 무의식", meaning: "Navigate through uncertainty. Trust your intuition in the dark.", meaningKo: "불확실성 속에서 길을 찾으세요. 어둠 속에서도 당신의 직관을 믿으십시오." },
  { id: 19, name: "The Sun", nameKo: "태양", image: "https://images.unsplash.com/photo-1444333509404-840238a4625a?q=80&w=800", description: "성공, 활력, 기쁨", meaning: "Success and happiness are yours. Shine your light brightly.", meaningKo: "성공과 행복이 당신의 것입니다. 당신의 빛을 밝게 비추세요." },
  { id: 20, name: "Judgement", nameKo: "심판", image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800", description: "부활, 결단, 소명", meaning: "A time for self-evaluation. Answer your higher calling.", meaningKo: "자기 평가의 시간입니다. 당신의 더 높은 소명에 응답하세요." },
  { id: 21, name: "The World", nameKo: "세계", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800", description: "완성, 통합, 여행", meaning: "Completion and fulfillment. You have achieved your goals.", meaningKo: "완성과 성취의 단계입니다. 당신은 목표를 달성했습니다." },
];

// Generate Minor Arcana (simplified for this turn)
const SUITS = [
  { name: 'Wands', nameKo: '지팡이', color: 'text-orange-400' },
  { name: 'Cups', nameKo: '컵', color: 'text-blue-400' },
  { name: 'Swords', nameKo: '검', color: 'text-slate-400' },
  { name: 'Pentacles', nameKo: '펜타클', color: 'text-yellow-400' }
];

const MINOR_ARCANA: TarotCard[] = [];
SUITS.forEach((suit, sIdx) => {
  for (let i = 1; i <= 14; i++) {
    const rank = i === 1 ? 'Ace' : i === 11 ? 'Page' : i === 12 ? 'Knight' : i === 13 ? 'Queen' : i === 14 ? 'King' : i.toString();
    const rankKo = i === 1 ? '에이스' : i === 11 ? '페이지' : i === 12 ? '나이트' : i === 13 ? '퀸' : i === 14 ? '킹' : i.toString();
    MINOR_ARCANA.push({
      id: 22 + sIdx * 14 + (i - 1),
      name: `${rank} of ${suit.name}`,
      nameKo: `${suit.nameKo} ${rankKo}`,
      image: `https://picsum.photos/seed/tarot-${suit.name}-${i}/800/1200`,
      description: `${suit.nameKo}의 에너지를 담은 카드`,
      meaning: `This card represents the energy of ${suit.name} in your life.`,
      meaningKo: `이 카드는 당신의 삶에서 ${suit.nameKo}의 에너지를 나타냅니다.`
    });
  }
});

const ALL_CARDS = [...MAJOR_ARCANA, ...MINOR_ARCANA];

interface TarotGameProps {
  onClose: () => void;
  lang: string;
}

const TarotGame: React.FC<TarotGameProps> = ({ onClose, lang }) => {
  const [gameState, setGameState] = useState<'idle' | 'shuffling' | 'picking' | 'result'>('idle');
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  useEffect(() => {
    // Initial shuffle
    const indices = Array.from({ length: 78 }, (_, i) => i);
    setShuffledIndices(indices.sort(() => Math.random() - 0.5));
  }, []);

  const handleStartShuffle = () => {
    setGameState('shuffling');
    setSelectedCards([]);
    
    // Animate shuffle
    setTimeout(() => {
      const indices = Array.from({ length: 78 }, (_, i) => i);
      setShuffledIndices(indices.sort(() => Math.random() - 0.5));
      setGameState('picking');
    }, 2000);
  };

  const handlePickCard = (card: TarotCard) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
      return;
    }
    if (selectedCards.length >= 3) return;
    
    setSelectedCards([...selectedCards, card]);
  };

  const handleConfirmSelection = () => {
    if (selectedCards.length === 0) return;
    setGameState('result');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-brand-black flex flex-col items-center justify-start overflow-y-auto"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20 pointer-events-none fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-4xl min-h-screen flex flex-col relative z-10 p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter flex items-center gap-2 sm:gap-3">
              <Sparkles className="w-6 h-6 sm:w-8 h-8 text-brand-gold" />
              TAROT AUDITORY GAME
            </h1>
            <p className="text-brand-gold text-[10px] font-bold uppercase tracking-[0.4em] mt-1">
              {lang === 'ko' ? '운명의 목소리를 들으세요' : 'Listen to the voice of destiny'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all hover:bg-white/10"
          >
            <X className="w-5 h-5 sm:w-6 h-6" />
          </button>
        </div>

        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {gameState === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center space-y-8"
              >
                <div className="relative group cursor-pointer" onClick={handleStartShuffle}>
                  <div className="absolute inset-0 bg-brand-gold/20 blur-3xl group-hover:bg-brand-gold/40 transition-all" />
                  <div className="relative w-48 h-72 bg-brand-dark-gray border-4 border-brand-gold/50 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl">
                    <div className="absolute inset-4 border border-brand-gold/20 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-16 h-16 text-brand-gold/30" />
                    </div>
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-gold/10 via-transparent to-transparent" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-white">
                    {lang === 'ko' ? '당신의 운명을 섞어보세요' : 'Shuffle your destiny'}
                  </h2>
                  <p className="text-slate-400 max-w-sm mx-auto">
                    {lang === 'ko' 
                      ? '78장의 카드가 당신의 질문에 답하기 위해 기다리고 있습니다. 카드를 눌러 셔플을 시작하세요.' 
                      : '78 cards are waiting to answer your questions. Click the deck to start shuffling.'}
                  </p>
                  <button 
                    onClick={handleStartShuffle}
                    className="px-12 py-5 bg-brand-gold text-brand-black font-black text-xl rounded-full shadow-[0_0_30px_rgba(197,160,89,0.4)] hover:scale-105 transition-all active:scale-95"
                  >
                    {lang === 'ko' ? '셔플 시작' : 'Start Shuffle'}
                  </button>
                </div>
              </motion.div>
            )}

            {gameState === 'shuffling' && (
              <motion.div 
                key="shuffling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-12"
              >
                <div className="relative w-64 h-64 flex items-center justify-center">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        rotate: [i * 30, i * 30 + 360],
                        x: [0, Math.cos(i * 30 * Math.PI / 180) * 100, 0],
                        y: [0, Math.sin(i * 30 * Math.PI / 180) * 100, 0],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1
                      }}
                      className="absolute w-12 h-20 bg-brand-gold/20 border border-brand-gold/40 rounded-lg"
                    />
                  ))}
                  <RefreshCcw className="w-12 h-12 text-brand-gold animate-spin" />
                </div>
                <p className="text-brand-gold font-black text-2xl tracking-widest animate-pulse">
                  SHUFFLING...
                </p>
              </motion.div>
            )}

            {gameState === 'picking' && (
              <motion.div 
                key="picking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex flex-col items-center gap-8"
              >
                <div className="text-center space-y-2 shrink-0">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {lang === 'ko' ? '최대 3장의 카드를 선택하세요' : 'Pick up to 3 Cards'}
                  </h2>
                  <p className="text-brand-gold font-bold">
                    {selectedCards.length} / 3
                  </p>
                </div>

                <div className="flex-1 w-full overflow-y-auto p-4 custom-scrollbar touch-pan-y relative z-20 min-h-[300px]">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-3">
                    {shuffledIndices.map((idx) => {
                      const card = ALL_CARDS[idx];
                      const isSelected = selectedCards.find(c => c.id === card.id);
                      const selectionIndex = selectedCards.findIndex(c => c.id === card.id);
                      return (
                        <motion.div
                          key={card.id}
                          whileHover={{ y: -5, scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onTap={() => handlePickCard(card)}
                          className={cn(
                            "relative aspect-[2/3] rounded-xl cursor-pointer transition-all active:opacity-70 z-30 pointer-events-auto select-none touch-manipulation",
                            isSelected 
                              ? 'ring-4 ring-brand-gold shadow-[0_0_20px_rgba(197,160,89,0.4)]' 
                              : 'bg-brand-dark-gray border border-white/10 hover:border-brand-gold/50 shadow-lg'
                          )}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isSelected ? (
                              <span className="text-brand-gold font-black text-xl">{selectionIndex + 1}</span>
                            ) : (
                              <Sparkles className="w-6 h-6 text-white/10" />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6 shrink-0 py-4">
                  <div className="flex gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={cn(
                          "w-16 h-24 rounded-xl flex items-center justify-center transition-all border",
                          selectedCards[i] 
                            ? "bg-brand-gold/20 border-brand-gold shadow-[0_0_15px_rgba(197,160,89,0.2)]" 
                            : "bg-white/5 border-white/10"
                        )}
                      >
                        {selectedCards[i] ? (
                          <span className="text-brand-gold font-black text-xl">{i + 1}</span>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-white/10" />
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <button 
                    onClick={handleConfirmSelection}
                    disabled={selectedCards.length === 0}
                    className={cn(
                      "px-12 py-5 font-black text-xl rounded-full transition-all flex items-center gap-3",
                      selectedCards.length > 0
                        ? "bg-brand-gold text-brand-black shadow-[0_0_30px_rgba(197,160,89,0.4)] hover:scale-105 active:scale-95"
                        : "bg-white/5 text-slate-600 cursor-not-allowed"
                    )}
                  >
                    {lang === 'ko' ? '결과 보기' : 'See Results'}
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}

            {gameState === 'result' && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-8 pb-20"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {selectedCards.map((card, i) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.3 }}
                      className="bg-brand-dark-gray/40 border border-white/10 rounded-[32px] overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-[3/4]">
                        <img 
                          src={card.image} 
                          alt={card.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 w-10 h-10 bg-brand-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                          <span className="text-brand-gold font-black">{i + 1}</span>
                        </div>
                        <div className="absolute bottom-4 left-6 right-6">
                          <p className="text-brand-gold text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                            {selectedCards.length === 3 ? (
                              i === 0 ? (lang === 'ko' ? '과거' : 'Past') : 
                              i === 1 ? (lang === 'ko' ? '현재' : 'Present') : 
                              (lang === 'ko' ? '미래' : 'Future')
                            ) : (
                              lang === 'ko' ? `카드 ${i + 1}` : `Card ${i + 1}`
                            )}
                          </p>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">
                            {lang === 'ko' ? card.nameKo : card.name}
                          </h3>
                        </div>
                      </div>
                      <div className="p-6 space-y-4 flex-1">
                        <div className="space-y-1">
                          <p className="text-brand-gold font-bold text-xs uppercase tracking-widest">Description</p>
                          <p className="text-white font-medium">{card.description}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-brand-gold font-bold text-xs uppercase tracking-widest">Interpretation</p>
                          <p className="text-slate-400 text-sm leading-relaxed">
                            {lang === 'ko' ? card.meaningKo : card.meaning}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="p-6 bg-brand-gold/5 border border-brand-gold/20 rounded-3xl text-center max-w-2xl">
                    <p className="text-slate-300 italic leading-relaxed">
                      {lang === 'ko' 
                        ? "이 세 장의 카드는 당신의 여정에서 중요한 흐름을 보여줍니다. 과거의 경험이 현재를 만들었고, 지금의 선택이 당신의 미래를 비출 것입니다. 당신의 직관을 믿으세요." 
                        : "These three cards reveal the significant flow of your journey. Past experiences have shaped your present, and today's choices will illuminate your future. Trust your intuition."}
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleStartShuffle}
                    className="flex items-center gap-3 px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-full hover:bg-white/10 transition-all"
                  >
                    <RefreshCcw className="w-6 h-6" />
                    {lang === 'ko' ? '다시 시작하기' : 'Try Again'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="py-6 text-center border-t border-white/5 mt-auto">
          <p className="text-[10px] text-slate-600 uppercase tracking-[0.4em] font-bold">
            The universe speaks through symbols and sound
          </p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(197, 160, 89, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(197, 160, 89, 0.5);
        }
      `}</style>
    </motion.div>
  );
};

export default TarotGame;

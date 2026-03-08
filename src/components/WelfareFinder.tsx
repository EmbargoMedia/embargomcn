import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ChevronDown, 
  RotateCcw, 
  X, 
  Heart, 
  ChevronLeft, 
  Share2, 
  MessageCircle, 
  ArrowRight,
  Info,
  Calendar,
  FileText,
  User,
  Building2,
  Phone,
  CheckCircle2,
  Sparkles,
  Zap,
  Star,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Language } from '../constants';

interface WelfareItem {
  id: string;
  title: string;
  amount: string;
  type: string;
  dDay: string;
  purpose: string;
  content: string;
  conditions: string[];
  additionalPoints?: string[];
  period: string;
  documents: string[];
  exclusions: string[];
  img: string;
}

const WELFARE_DATA: WelfareItem[] = [
  {
    id: '1',
    title: '2026년 보건복지부 장애인 자립자금 대출 지원사업 공고',
    amount: '최대 5,000만원',
    type: '무상지원제도',
    dDay: 'D-1',
    purpose: '장애인의 경제적 자립을 돕기 위해 생업 자금, 기술 훈련비, 기능 습득비 지원',
    content: '저금리 대출 지원 (연 2.0% 고정금리), 최대 5년 거치 5년 분할 상환',
    conditions: [
      '등록 장애인 중 기초생활수급자 또는 차상위계층',
      '사업자 등록이 되어 있거나 창업 예정인 자',
      '가구당 소득인정액이 기준 중위소득 50% 이하'
    ],
    additionalPoints: [
      '장애인 고용 우수 사업장 가점 부여',
      '청년 장애인 창업자 (만 39세 이하) 우대'
    ],
    period: '2026년 1월 30일 ~ 2026년 3월 9일',
    documents: [
      '장애인 등록증 사본',
      '자립자금 대출 신청서 및 사업계획서',
      '소득 및 재산 증빙 서류',
      '임대차 계약서 (사업장 확보 시)'
    ],
    exclusions: [
      '이미 동일한 목적으로 정부 지원금을 받은 자',
      '금융기관 연체 중이거나 신용불량 정보 등록자',
      '사치/향락 업종 창업 및 운영자'
    ],
    img: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    title: '2026년 장애인 보조기기 교부 지원사업 공고',
    amount: '최대 200만원',
    type: '무상지원제도',
    dDay: 'D-1',
    purpose: '일상생활 및 사회생활이 어려운 장애인에게 보조기기 교부 및 대여 지원',
    content: '청각 보조기기, 휠체어, 점자 출력기 등 필요 기기 구매 비용 지원',
    conditions: [
      '등록 장애인 중 저소득층 (기초/차상위) 우선 지원',
      '최근 3년 이내 동일 품목 지원을 받지 않은 자'
    ],
    period: '2026년 2월 12일 09:00 ~ 2026년 3월 9일 16:00',
    documents: [
      '보조기기 처방전 (의사 발행)',
      '장애인 증명서',
      '건강보험료 납입 증명서'
    ],
    exclusions: [
      '건강보험공단에서 이미 지원받은 품목'
    ],
    img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '3',
    title: '2026년 장애인 고용촉진 및 직업재활 지원사업 공고',
    amount: '최대 2억원',
    type: '인증지원제도',
    dDay: 'D-1',
    purpose: '장애인을 고용하는 사업주에게 고용 장려금 및 시설 장비비 지원',
    content: '장애인 근로자 1인당 고용 수준에 따라 차등 지급',
    conditions: [
      '장애인을 고용한 상시 근로자 5인 이상 사업장',
      '최저임금 이상을 지급하는 사업주'
    ],
    period: '2026년 1월 30일 ~ 2026년 3월 9일',
    documents: [
      '장애인 근로자 명부',
      '임금 대장 사본',
      '근로계약서'
    ],
    exclusions: [
      '공공기관 및 지방공기업'
    ],
    img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800'
  }
];

interface WelfareFinderProps {
  onClose?: () => void;
  lang: Language;
  isTab?: boolean;
}

const WelfareFinder: React.FC<WelfareFinderProps> = ({ onClose, lang, isTab = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<WelfareItem | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'prep'>('summary');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    phone: '',
    company: ''
  });

  const filteredData = WELFARE_DATA.filter(item => 
    item.title.includes(searchTerm) || item.type.includes(searchTerm)
  );

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('문의가 접수되었습니다. 담당자가 곧 연락드리겠습니다.');
    setShowInquiryModal(false);
  };

  const containerClasses = isTab 
    ? "w-full h-full bg-transparent flex flex-col relative"
    : "fixed inset-0 z-[150] bg-transparent flex flex-col items-center justify-start overflow-y-auto";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={containerClasses}
    >
      <div className={cn("w-full bg-transparent flex flex-col relative", !isTab && "max-w-2xl min-h-screen")}>
        {/* Header */}
        <div className="sticky top-0 z-20 bg-brand-dark-gray/40 backdrop-blur-md p-4 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-3">
            {(selectedItem || !isTab) && (
              <button 
                onClick={selectedItem ? () => setSelectedItem(null) : onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}
            <h1 className="text-xl font-bold text-white tracking-tight">
              {selectedItem ? '지원제도 상세' : '지원제도 검색'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Share2 className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Heart className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {!selectedItem ? (
          <div className="p-6 space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">복지금 찾기</h2>
              <p className="text-slate-500 text-sm">나에게 꼭 필요한 정부 지원금과 복지 혜택을 확인하세요.</p>
            </div>

            {/* List */}
            <div className="grid gap-4">
              {filteredData.map((item) => (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-brand-dark-gray/40 backdrop-blur-md rounded-3xl overflow-hidden border border-brand-border group cursor-pointer hover:border-brand-gold/50 transition-all"
                >
                  <div className="h-32 w-full relative">
                    <img 
                      src={item.img} 
                      alt={item.title} 
                      className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-brand-gold/20 backdrop-blur-md rounded-full border border-brand-gold/30">
                      <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">{item.type}</span>
                    </div>
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full border border-blue-500 flex items-center justify-center bg-brand-black/40 backdrop-blur-sm text-blue-500 text-[10px] font-black">
                      {item.dDay}
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-gold transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-brand-gold font-black text-sm">{item.amount} 지원</p>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                      {item.purpose}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Detail Content */}
            <div className="p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    selectedItem.type === '무상지원제도' ? "bg-blue-500 text-white" : 
                    selectedItem.type === '인증지원제도' ? "bg-emerald-500 text-white" :
                    "bg-brand-gold text-brand-black"
                  )}>
                    {selectedItem.type}
                  </span>
                  <span className="w-10 h-10 rounded-full border border-blue-500 flex items-center justify-center text-blue-500 text-[10px] font-black">
                    {selectedItem.dDay}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white leading-tight">
                  {selectedItem.title}
                </h2>
                <div className="flex justify-between items-end bg-brand-dark-gray/20 rounded-3xl p-6 border border-white/5">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500">받을 수 있는 지원금액은</p>
                    <p className="text-2xl font-black text-brand-gold">{selectedItem.amount}</p>
                  </div>
                  <button 
                    onClick={() => setShowInquiryModal(true)}
                    className="bg-brand-gold text-brand-black px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-brand-gold/20 hover:scale-105 transition-all"
                  >
                    서비스 문의
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button 
                  onClick={() => setActiveTab('summary')}
                  className={cn(
                    "flex-1 py-4 text-sm font-bold transition-all relative",
                    activeTab === 'summary' ? "text-brand-gold" : "text-slate-500"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI 공고 요약
                  </div>
                  {activeTab === 'summary' && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-gold" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('prep')}
                  className={cn(
                    "flex-1 py-4 text-sm font-bold transition-all relative",
                    activeTab === 'prep' ? "text-brand-gold" : "text-slate-500"
                  )}
                >
                  신청 준비
                  {activeTab === 'prep' && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-gold" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="space-y-8 pb-24">
                {activeTab === 'summary' ? (
                  <>
                    <section className="space-y-3">
                      <h4 className="text-brand-gold font-black flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        지원목적
                      </h4>
                      <p className="text-slate-300 leading-relaxed text-sm">
                        {selectedItem.purpose}
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-brand-gold font-black flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        지원금액
                      </h4>
                      <p className="text-slate-300 leading-relaxed text-sm">
                        {selectedItem.amount} ({selectedItem.content})
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-brand-gold font-black flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        지원조건
                      </h4>
                      <ul className="space-y-2">
                        {selectedItem.conditions.map((c, i) => (
                          <li key={i} className="text-slate-300 text-sm flex gap-2">
                            <span className="text-brand-gold">•</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </section>

                    {selectedItem.additionalPoints && (
                      <section className="space-y-3">
                        <h4 className="text-brand-gold font-black flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          가점사항
                        </h4>
                        <ul className="space-y-2">
                          {selectedItem.additionalPoints.map((p, i) => (
                            <li key={i} className="text-slate-300 text-sm flex gap-2">
                              <span className="text-brand-gold">•</span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </>
                ) : (
                  <>
                    <section className="space-y-3">
                      <h4 className="text-brand-gold font-black flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        신청기간
                      </h4>
                      <p className="text-slate-300 leading-relaxed text-sm">
                        {selectedItem.period}
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-brand-gold font-black flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        제출서류
                      </h4>
                      <ul className="space-y-2">
                        {selectedItem.documents.map((d, i) => (
                          <li key={i} className="text-slate-300 text-sm flex gap-2">
                            <span className="text-brand-gold">•</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-brand-gold font-black flex items-center gap-2">
                        <X className="w-4 h-4" />
                        제외대상
                      </h4>
                      <ul className="space-y-2">
                        {selectedItem.exclusions.map((e, i) => (
                          <li key={i} className="text-slate-300 text-sm flex gap-2">
                            <span className="text-brand-gold">•</span>
                            {e}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Modal */}
      <AnimatePresence>
        {showInquiryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 1 }}
              className="w-full max-w-md bg-brand-dark-gray rounded-[40px] p-8 border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-gold to-brand-gold/20" />
              
              <button 
                onClick={() => setShowInquiryModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-white mb-2">서비스 문의하기</h3>
                <p className="text-slate-400 text-sm">내가 받을 수 있는 지원제도가 궁금하신가요?</p>
              </div>

              <div className="bg-brand-gold/10 rounded-3xl p-6 mb-8 border border-brand-gold/20 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-brand-gold text-sm font-black mb-1">지원사업 맞춤 추천부터 행정까지 👋</p>
                  <p className="text-white text-xs">비즈큐브와 함께 <span className="text-brand-gold font-black">1.4억의 지원사업 확보</span> 완료!</p>
                </div>
                <div className="w-12 h-12 bg-brand-gold rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-brand-black" />
                </div>
              </div>

              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">문의 지원제도</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={selectedItem?.title}
                    className="w-full bg-brand-black/50 border border-white/10 rounded-2xl py-4 px-4 text-slate-400 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">대표자명</label>
                  <input 
                    type="text" 
                    required
                    placeholder="대표자명을 입력해주세요"
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">연락처</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="010-0000-0000"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">상호명</label>
                  <input 
                    type="text" 
                    required
                    placeholder="상호명을 입력해주세요"
                    value={inquiryForm.company}
                    onChange={(e) => setInquiryForm({...inquiryForm, company: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-gold text-brand-black font-black py-5 rounded-2xl shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                >
                  입력 완료
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WelfareFinder;

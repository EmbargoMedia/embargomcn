import React from 'react';

const HumanBodyDiagram: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-3xl border border-slate-200">
      {/* Front View */}
      <div className="flex flex-col items-center space-y-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Front View (전면 에너지 흐름)</p>
        <div className="relative w-48 h-96">
          <svg viewBox="0 0 100 200" className="w-full h-full text-slate-300 fill-current opacity-60">
            {/* Simple Human Outline Front */}
            <circle cx="50" cy="20" r="15" /> {/* Head */}
            <rect x="35" y="35" width="30" height="60" rx="10" /> {/* Torso */}
            <rect x="20" y="40" width="10" height="50" rx="5" /> {/* Left Arm */}
            <rect x="70" y="40" width="10" height="50" rx="5" /> {/* Right Arm */}
            <rect x="35" y="95" width="12" height="70" rx="6" /> {/* Left Leg */}
            <rect x="53" y="95" width="12" height="70" rx="6" /> {/* Right Leg */}
          </svg>
          
          {/* Analysis Points - Front */}
          <div className="absolute top-[10%] left-[45%] w-3 h-3 bg-brand-gold/40 rounded-full border border-brand-gold animate-pulse cursor-help" title="Head/Brain Energy" />
          <div className="absolute top-[15%] left-[30%] w-2 h-2 bg-red-400/40 rounded-full border border-red-500" title="Right Ear" />
          <div className="absolute top-[15%] left-[65%] w-2 h-2 bg-red-400/40 rounded-full border border-red-500" title="Left Ear" />
          <div className="absolute top-[35%] left-[45%] w-4 h-4 bg-blue-400/40 rounded-full border border-blue-500" title="Heart/Chest" />
          <div className="absolute top-[55%] left-[45%] w-5 h-5 bg-green-400/40 rounded-full border border-green-500" title="Abdomen/Digestion" />
          <div className="absolute top-[85%] left-[35%] w-3 h-3 bg-orange-400/40 rounded-full border border-orange-500" title="Knees" />
          <div className="absolute top-[85%] left-[58%] w-3 h-3 bg-orange-400/40 rounded-full border border-orange-500" title="Knees" />
          
          {/* Labels */}
          <div className="absolute top-[10%] left-[-20%] text-[8px] font-bold text-slate-400 border-b border-slate-200 pr-2">뇌/신경계</div>
          <div className="absolute top-[15%] left-[75%] text-[8px] font-bold text-slate-400 border-b border-slate-200 pl-2">청각/평형</div>
          <div className="absolute top-[35%] left-[-20%] text-[8px] font-bold text-slate-400 border-b border-slate-200 pr-2">심장/순환</div>
          <div className="absolute top-[55%] left-[75%] text-[8px] font-bold text-slate-400 border-b border-slate-200 pl-2">비위/소화</div>
        </div>
      </div>

      {/* Back View */}
      <div className="flex flex-col items-center space-y-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Back View (후면 에너지 흐름)</p>
        <div className="relative w-48 h-96">
          <svg viewBox="0 0 100 200" className="w-full h-full text-slate-200 fill-current opacity-60">
            {/* Simple Human Outline Back */}
            <circle cx="50" cy="20" r="15" />
            <rect x="35" y="35" width="30" height="60" rx="10" />
            <rect x="20" y="40" width="10" height="50" rx="5" />
            <rect x="70" y="40" width="10" height="50" rx="5" />
            <rect x="35" y="95" width="12" height="70" rx="6" />
            <rect x="53" y="95" width="12" height="70" rx="6" />
            {/* Spine line */}
            <line x1="50" y1="35" x2="50" y2="95" stroke="#cbd5e1" strokeWidth="2" />
          </svg>

          {/* Analysis Points - Back */}
          <div className="absolute top-[25%] left-[47%] w-3 h-3 bg-purple-400/40 rounded-full border border-purple-500" title="Neck/Cervical" />
          <div className="absolute top-[50%] left-[47%] w-3 h-3 bg-purple-400/40 rounded-full border border-purple-500" title="Lower Back/Lumbar" />
          <div className="absolute top-[65%] left-[40%] w-4 h-4 bg-indigo-400/40 rounded-full border border-indigo-500" title="Kidneys" />
          <div className="absolute top-[65%] left-[55%] w-4 h-4 bg-indigo-400/40 rounded-full border border-indigo-500" title="Kidneys" />

          {/* Labels */}
          <div className="absolute top-[25%] left-[75%] text-[8px] font-bold text-slate-400 border-b border-slate-200 pl-2">경추/목</div>
          <div className="absolute top-[50%] left-[-20%] text-[8px] font-bold text-slate-400 border-b border-slate-200 pr-2">요추/허리</div>
          <div className="absolute top-[65%] left-[75%] text-[8px] font-bold text-slate-400 border-b border-slate-200 pl-2">신장/원기</div>
        </div>
      </div>

      {/* Consultant Checklist Area */}
      <div className="md:col-span-2 mt-4 p-6 bg-white rounded-2xl border border-slate-200">
        <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-4 bg-brand-gold rounded-full" />
          상담사 분석 체크리스트 (Consultant Checklist)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['순환 정체', '염증 반응', '에너지 과부하', '기력 저하', '신경 긴장', '수분 부족', '독소 축적', '근육 경직'].map((item) => (
            <label key={item} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-gold focus:ring-brand-gold" />
              <span className="text-xs text-slate-600 font-medium">{item}</span>
            </label>
          ))}
        </div>
        <div className="mt-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">상담사 종합 소견 (Consultant Notes)</p>
          <div className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-400 italic">
            상담사가 직접 작성하는 공간입니다...
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanBodyDiagram;

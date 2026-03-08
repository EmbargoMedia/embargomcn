/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Volume2, 
  Ear, 
  Share2,
  RefreshCcw,
  Info,
  Send,
  Globe,
  Stethoscope,
  Music,
  MoreHorizontal,
  Home,
  Map as MapIcon,
  MessageSquare,
  Users,
  Search,
  User as UserIcon,
  ArrowLeft,
  MessageCircle,
  Link as LinkIcon,
  Heart,
  Eye,
  Share,
  X,
  Printer,
  Download,
  Play,
  Zap,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import Markdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { predictHearingRisk, HearingData } from './services/aiService';
import MimiGame from './components/MimiGame';
import { generateLandingImage } from './services/imageService';
import SoundBlockTetris from './components/SoundBlockTetris';
import TarotGame from './components/TarotGame';
import { cn } from './utils/cn';
import { translations, Language, healthTips, questionnaireQuestions } from './constants';

const FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000];

interface Message {
  id: string;
  type: 'bot' | 'user';
  text?: string;
  component?: React.ReactNode;
}

export default function App() {
  const [landingImage, setLandingImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      const img = await generateLandingImage();
      if (img) setLandingImage(img);
    };
    fetchImage();
  }, []);

  const [lang, setLang] = useState<Language>('ko');
  const t = translations[lang];

  const [showLanguageSelection, setShowLanguageSelection] = useState(true);
  const [showLanding, setShowLanding] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState<string>('welcome');
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    phone: '',
    email: '',
    ageGroup: '' as 'youth' | 'adult' | 'senior' | '',
    noiseExposure: false,
    tinnitus: false,
    existingHearingIssues: false,
  });
  
  const [ptaIndex, setPtaIndex] = useState(0);
  const [currentDb, setCurrentDb] = useState(40);
  const [ptaResults, setPtaResults] = useState<{ frequency: number; threshold: number }[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [testLog, setTestLog] = useState<{ heard: boolean; db: number }[]>([]);
  const [activeTab, setActiveTab] = useState('hearing');
  const [selectedArticle, setSelectedArticle] = useState<typeof healthTips[0] | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [comments, setComments] = useState<Record<string, { id: string; user: string; text: string; date: string }[]>>({});
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const [views, setViews] = useState<Record<string, number>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<number[]>([]);
  const [showWelfareResults, setShowWelfareResults] = useState(false);
  const [isAnalyzingReport, setIsAnalyzingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTetrisGame, setShowTetrisGame] = useState(false);
  const [showMimiGame, setShowMimiGame] = useState(false);
  const [showTarotGame, setShowTarotGame] = useState(false);
  const [reportChartImage, setReportChartImage] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    agreed: false
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleLike = (articleId: string) => {
    const isLiked = userLiked[articleId];
    setUserLiked(prev => ({ ...prev, [articleId]: !isLiked }));
    setLikes(prev => ({
      ...prev,
      [articleId]: (prev[articleId] || 0) + (isLiked ? -1 : 1)
    }));
  };

  const handleArticleClick = (article: typeof healthTips[0]) => {
    setSelectedArticle(article);
    setViews(prev => ({
      ...prev,
      [article.id]: (prev[article.id] || 0) + 1
    }));
  };

  const handleAddComment = (articleId: string) => {
    if (!newComment.trim()) return;
    const comment = {
      id: Math.random().toString(),
      user: formData.name || '익명 사용자',
      text: newComment,
      date: new Date().toLocaleDateString()
    };
    setComments(prev => ({
      ...prev,
      [articleId]: [...(prev[articleId] || []), comment]
    }));
    setNewComment('');
  };

  const handleShare = async (article: typeof healthTips[0]) => {
    const shareData = {
      title: article.title,
      text: article.desc,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${article.title}\n${article.desc}\n${window.location.href}`);
        alert('링크가 클립보드에 복사되었습니다.');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleShareResultsToChat = async () => {
    if (!prediction) return;
    
    // Add a "user" message saying they are sharing results
    addUserMessage((t as any).shareResults || "Share Results");
    
    setIsTyping(true);
    
    // Create a PDF-like component for the chat
    const PDFBox = (
      <div className="bg-brand-dark-gray/60 backdrop-blur-md rounded-2xl p-4 border border-brand-gold/30 space-y-3 w-full max-w-[280px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20">
            <Download className="w-6 h-6 text-brand-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">Hearing_Report_{formData.name || 'User'}.pdf</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{(t as any).aiReport || "AI Report"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-white/5">
          <div className="text-center">
            <p className="text-[8px] text-slate-500 font-bold uppercase">{(t as any).grade || "Grade"}</p>
            <p className="text-xs font-bold text-white truncate">{getGradeLabel(prediction.grade)}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-slate-500 font-bold uppercase">{(t as any).score || "Score"}</p>
            <p className="text-xs font-bold text-brand-gold">{Math.round(prediction.score)}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowReportModal(true)}
          className="w-full py-2 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold/20 transition-all"
        >
          {(t as any).viewReport || "View Report"}
        </button>
      </div>
    );

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Math.random().toString(), 
        type: 'bot', 
        component: PDFBox 
      }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-modal-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Hearing_Report_${formData.name || 'User'}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
    }
  };

  const audioContext = useRef<AudioContext | null>(null);
  const oscillator = useRef<OscillatorNode | null>(null);
  const gainNode = useRef<GainNode | null>(null);

  const initAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playTone = async (freq: number, db: number) => {
    if (!audioContext.current) return;
    
    if (audioContext.current.state === 'suspended') {
      await audioContext.current.resume();
    }

    if (oscillator.current) {
      oscillator.current.stop();
      oscillator.current.disconnect();
    }

    const ctx = audioContext.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Simplified dB to gain mapping
    // 0dB = 0.001, 100dB = 1.0
    const volume = Math.pow(10, (db - 100) / 40); 
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    oscillator.current = osc;
    gainNode.current = gain;

    setTimeout(() => {
      if (oscillator.current === osc) {
        osc.stop();
        osc.disconnect();
      }
    }, 1600);
  };

  const calculateHearingAge = (score: number, actualAge: number) => {
    const ageNum = parseInt(actualAge.toString()) || 30;
    // Simple logic: score 0 is 5 years younger than actual age (min 10)
    // score 100 is 90 years old
    const baseAge = Math.max(10, ageNum - 5);
    const maxAge = 90;
    const hearingAge = Math.round(baseAge + (score / 100) * (maxAge - baseAge));
    return hearingAge;
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addBotMessage = (text: string, delay = 500) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: `bot-${Date.now()}-${Math.random()}`, type: 'bot', text }]);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: `user-${Date.now()}-${Math.random()}`, type: 'user', text }]);
  };

  const getGradeLabel = (grade: string) => {
    const g = (grade || '').toLowerCase();
    if (g.includes('normal')) return (t as any).grade_Normal || grade;
    if (g.includes('mild')) return (t as any).grade_Mild || grade;
    if (g.includes('moderate')) return (t as any).grade_Moderate || grade;
    if (g.includes('severe')) return (t as any).grade_Severe || grade;
    if (g.includes('profound')) return (t as any).grade_Profound || grade;
    return grade;
  };

  const handleAnalyzeReport = async () => {
    if (!resultsRef.current) return;
    setIsAnalyzingReport(true);
    addBotMessage((t as any).analyzingReport);

    try {
      // Capture the chart specifically
      const chartElement = resultsRef.current.querySelector('.recharts-responsive-container');
      let chartImage = '';
      if (chartElement) {
        const chartCanvas = await html2canvas(chartElement as HTMLElement, {
          backgroundColor: '#0A0A0A',
          scale: 2
        });
        chartImage = chartCanvas.toDataURL('image/png');
      }

      setReportChartImage(chartImage);
      setShowReportModal(true);
      setIsAnalyzingReport(false);
      addBotMessage((t as any).reportReady);
    } catch (error) {
      console.error('Error analyzing report:', error);
      setIsAnalyzingReport(false);
      addBotMessage("An error occurred while analyzing the report.");
    }
  };

  // Initial Welcome
  useEffect(() => {
    if (!showLanding && messages.length === 0 && step === 'welcome') {
      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          { id: '1', type: 'bot', text: t.welcome },
          { id: '2', type: 'bot', text: t.intro }
        ]);
        setIsTyping(false);
      }, 1000);
    }
  }, [lang, showLanding, step, messages.length]);

  const handleAction = async (action: string, value?: any) => {
    switch (action) {
      case 'select-language':
        setLang(value);
        setShowLanguageSelection(false);
        setShowLanding(true);
        break;
      case 'start-test':
        initAudio();
        addUserMessage(t.startTest);
        setStep('ask-age-group');
        addBotMessage((t as any).askAgeGroup);
        break;
      
      case 'set-age-group':
        const groupLabel = value === 'youth' ? (t as any).youth : value === 'adult' ? (t as any).adult : (t as any).senior;
        addUserMessage(groupLabel);
        setFormData(prev => ({ ...prev, ageGroup: value }));
        setStep('ask-age');
        addBotMessage(t.askAge);
        break;

      case 'set-age':
        addUserMessage(`${formData.name}님 (${formData.age}세), ${formData.phone}, ${formData.email}`);
        setStep('ask-gender');
        addBotMessage(t.askGender);
        break;

      case 'set-gender':
        addUserMessage(value === 'male' ? t.male : t.female);
        setFormData(prev => ({ ...prev, gender: value }));
        setStep('questionnaire-intro');
        addBotMessage(`${formData.ageGroup === 'youth' ? (t as any).youth : formData.ageGroup === 'adult' ? (t as any).adult : (t as any).senior} 맞춤 문항검사를 시작할 수 있습니다.`);
        break;

      case 'start-questionnaire':
        setStep('questionnaire');
        setQuestionIndex(0);
        setQuestionnaireAnswers([]);
        break;

      case 'answer-questionnaire':
        const newAnswers = [...questionnaireAnswers, value as number];
        setQuestionnaireAnswers(newAnswers);
        
        const currentQuestions = (questionnaireQuestions as any)[lang][formData.ageGroup || 'adult'];
        if (questionIndex < currentQuestions.length - 1) {
          setQuestionIndex(prev => prev + 1);
        } else {
          setStep('pta-intro');
          addBotMessage(t.ptaIntro);
        }
        break;

      case 'pta-intro-next':
        setStep('pta-intro');
        addBotMessage(t.ptaIntro);
        break;

      case 'pta-start':
        addUserMessage(t.ptaStart);
        setStep('pta-test');
        // Play first tone
        setTimeout(() => playTone(FREQUENCIES[0], 40), 1000);
        break;

      case 'pta-response':
        const heard = value;
        const newLog = [...testLog, { heard, db: currentDb }];
        setTestLog(newLog);

        if (heard) {
          setCurrentDb(prev => Math.max(0, prev - 10));
        } else {
          setCurrentDb(prev => Math.min(100, prev + 5));
        }

        if (newLog.length >= 6) {
          const threshold = currentDb;
          const newResults = [...ptaResults, { frequency: FREQUENCIES[ptaIndex], threshold }];
          setPtaResults(newResults);
          
          if (ptaIndex < FREQUENCIES.length - 1) {
            const nextFreq = FREQUENCIES[ptaIndex + 1];
            setPtaIndex(prev => prev + 1);
            setCurrentDb(40);
            setTestLog([]);
            // Play next frequency tone
            setTimeout(() => playTone(nextFreq, 40), 1000);
          } else {
            setStep('calculating');
            addBotMessage(t.calculating);
            handleAction('finish-test');
          }
        } else {
          // Play next tone for the same frequency
          const nextDb = heard ? Math.max(0, currentDb - 10) : Math.min(100, currentDb + 5);
          setTimeout(() => playTone(FREQUENCIES[ptaIndex], nextDb), 500);
        }
        break;

      case 'finish-test':
        const fullData: HearingData = {
          ...formData,
          age: parseInt(formData.age) || 30,
          ptaResults: ptaResults,
        };
        const res = await predictHearingRisk(fullData);
        setPrediction(res);
        setStep('results');
        break;

      case 'retest':
        setStep('welcome');
        setPtaResults([]);
        setPtaIndex(0);
        setCurrentDb(40);
        setTestLog([]);
        setPrediction(null);
        setMessages([
          { id: '1', type: 'bot', text: t.welcome },
          { id: '2', type: 'bot', text: t.intro }
        ]);
        break;

      case 'others':
        addUserMessage(t.others);
        setStep('others-links');
        addBotMessage(`${(t as any).preparingTitle}. ${(t as any).preparingSub}`);
        break;
    }
  };

  const resetApp = () => {
    setShowLanguageSelection(true);
    setShowLanding(false);
    setStep('welcome');
    setMessages([]);
    setPtaResults([]);
    setPtaIndex(0);
    setCurrentDb(40);
    setTestLog([]);
    setPrediction(null);
    setQuestionIndex(0);
    setQuestionnaireAnswers([]);
    setFormData({
      name: '',
      age: '',
      gender: 'male',
      phone: '',
      email: '',
      ageGroup: '',
      noiseExposure: false,
      tinnitus: false,
      existingHearingIssues: false,
    });
  };

  if (showLanguageSelection) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-8 text-white overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-12 text-center"
        >
          <div className="space-y-6">
            <div className="flex flex-col items-center mb-4">
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-3xl font-black tracking-tighter text-white">EMBARGO MEDIA</h2>
                <p className="text-[10px] font-medium text-slate-500 tracking-[0.3em] uppercase">
                  Technology and Bio Healthcare
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight">Hearing Screening Test<br />Select Language</h1>
              <p className="text-slate-500 font-medium text-sm">Please choose your preferred language</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { code: 'ko', label: '한국어', native: 'Korean' },
              { code: 'en', label: 'English', native: 'English' },
              { code: 'ja', label: '日本語', native: 'Japanese' },
              { code: 'zh', label: '中文', native: 'Chinese' },
              { code: 'es', label: 'Español', native: 'Spanish' },
              { code: 'fr', label: 'Français', native: 'French' },
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => handleAction('select-language', l.code)}
                className="w-full py-5 px-8 rounded-2xl bg-brand-dark-gray/40 backdrop-blur-md border border-brand-border hover:border-brand-gold hover:bg-brand-gold/5 transition-all flex items-center justify-between group"
              >
                <div className="text-left">
                  <p className="text-xl font-bold text-white group-hover:text-brand-gold transition-colors">{l.label}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{l.native}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-black/40 backdrop-blur-sm border border-brand-border flex items-center justify-center group-hover:bg-brand-gold group-hover:border-brand-gold transition-all">
                  <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-brand-black rotate-180" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (showLanding) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-8 text-white overflow-hidden">
        <div className="w-full max-w-md space-y-8 pt-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-4xl font-black tracking-tighter text-white">EMBARGO MEDIA</h2>
                <p className="text-brand-gold font-black text-xl tracking-tight">
                  {lang === 'ko' ? '무료청력검사를 활용하세요!' : 'Take advantage of the free hearing test!'}
                </p>
              </div>
            </div>
            <h1 className="text-5xl font-black leading-tight tracking-tight text-white">
              {(t as any).landingTitle.split('\n').map((line: string, i: number) => (
                <React.Fragment key={i}>
                  {line}
                  {i === 0 && <br />}
                </React.Fragment>
              ))}
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative aspect-[3/4] max-h-[45vh] mx-auto rounded-[40px] overflow-hidden shadow-2xl shadow-brand-gold/10"
          >
            <img 
              src={landingImage || "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=800"} 
              alt="Hearing health profile" 
              className="w-full h-full object-cover opacity-90"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={() => {
            setShowLanding(false);
            setMessages([
              { id: '1', type: 'bot', text: t.welcome },
              { id: '2', type: 'bot', text: t.intro }
            ]);
            setStep('welcome');
            initAudio();
          }}
          className="w-full max-w-md py-6 rounded-full bg-brand-gold text-brand-black font-bold text-xl shadow-xl shadow-brand-gold/20 mt-8 mb-4 flex items-center justify-center gap-2"
        >
          <Ear className="w-7 h-7" />
          {(t as any).landingBtn}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-transparent text-white flex flex-col items-center justify-start overflow-hidden font-sans relative">
      {/* Header */}
      <header className="w-full max-w-md bg-brand-dark-gray/40 backdrop-blur-xl border-b border-brand-white/10 px-6 py-5 flex items-center justify-between sticky top-0 z-50">
        <button 
          onClick={resetApp}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity active:scale-95"
        >
          <span className="text-2xl font-black tracking-tighter text-brand-gold">OBLIGE</span>
        </button>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
            className="px-4 py-2 rounded-full bg-brand-black/40 backdrop-blur-sm text-brand-gold text-xs font-black uppercase tracking-tighter flex items-center gap-1 hover:bg-brand-gold/10 transition-all border border-brand-gold/30"
          >
            <Globe className="w-4 h-4" />
            {lang === 'ko' ? 'EN' : 'KO'}
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 w-full max-w-md overflow-y-auto p-6 space-y-6 scrollbar-hide pb-64">
        {activeTab === 'hearing' ? (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex w-full",
                  msg.type === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[85%] px-6 py-5 text-[16px] leading-relaxed shadow-sm",
                  msg.type === 'user' ? "chat-bubble-user" : "chat-bubble-bot"
                )}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="chat-bubble-bot px-5 py-4 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}

            {step === 'pta-test' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-4 pt-4"
              >
                <div className="bg-brand-dark-gray/40 backdrop-blur-md rounded-[32px] p-10 border border-brand-border shadow-xl space-y-10">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{(t as any).frequency}</span>
                      <p className="text-3xl font-black text-brand-gold">{FREQUENCIES[ptaIndex]} Hz</p>
                    </div>
                    <div className="text-right space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{(t as any).progress}</span>
                      <p className="text-base font-bold text-slate-400">{ptaIndex + 1} / {FREQUENCIES.length}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center py-8">
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-48 h-48 rounded-full bg-brand-black/40 backdrop-blur-md border border-brand-gold/20 flex items-center justify-center relative"
                    >
                      <Volume2 className="w-16 h-16 text-brand-gold" />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <button
                      onClick={() => handleAction('pta-response', false)}
                      className="py-6 rounded-2xl bg-brand-black/40 backdrop-blur-sm border border-brand-border text-slate-500 font-bold text-sm hover:bg-brand-gold/5 transition-all"
                    >
                      {t.ptaNotHeard}
                    </button>
                    <button
                      onClick={() => handleAction('pta-response', true)}
                      className="py-6 rounded-2xl bg-brand-gold text-brand-black font-bold text-sm shadow-lg shadow-brand-gold/20 hover:brightness-110 transition-all"
                    >
                      {t.ptaHeard}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}


            {step === 'results' && prediction && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-4 pt-4"
              >
                <div ref={resultsRef} className="bg-brand-dark-gray/40 backdrop-blur-md rounded-[32px] p-10 border border-brand-border shadow-xl space-y-10">
                  <div className="text-center space-y-3">
                    <h2 className="text-2xl font-bold text-white">{t.resultsTitle}</h2>
                    <p className="text-xs text-brand-gold font-bold uppercase tracking-[0.2em]">{(t as any).aiReport}</p>
                  </div>

                  <div className="bg-brand-black rounded-[24px] p-8 text-center border border-brand-gold/30 shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                    <p className="text-brand-gold text-lg font-bold mb-2">{(t as any).hearingAgeScreening}</p>
                    <h3 className="text-3xl font-black text-white">
                      {(t as any).hearingAgeResult.replace('{age}', calculateHearingAge(prediction.score, parseInt(formData.age) || 30))}
                    </h3>
                  </div>

                  {formData.ageGroup === 'senior' && questionnaireAnswers.length > 0 && (
                    <div className="bg-brand-black/40 backdrop-blur-md rounded-[24px] p-8 text-center border border-brand-gold/30 shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                      <p className="text-brand-gold text-sm font-bold mb-2 uppercase tracking-widest">{(t as any).keshhTitle}</p>
                      <div className="space-y-2">
                        <p className="text-3xl font-black text-white">
                          {questionnaireAnswers.reduce((a: number, b: number) => a + b, 0)}{(t as any).keshhPoints}
                        </p>
                        <p className="text-xl font-bold text-brand-gold">
                          {(() => {
                            const score = questionnaireAnswers.reduce((a: number, b: number) => a + b, 0);
                            if (score >= 86) return (t as any).keshhCat5;
                            if (score >= 77) return (t as any).keshhCat4;
                            if (score >= 67) return (t as any).keshhCat3;
                            if (score >= 55) return (t as any).keshhCat2;
                            if (score >= 24) return (t as any).keshhCat1;
                            return (t as any).keshhNormal;
                          })()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5">
                    <div className="bg-brand-black/40 backdrop-blur-md rounded-[24px] p-6 text-center border border-brand-border">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{t.grade}</span>
                      <span className="text-xl font-bold text-white">{getGradeLabel(prediction.grade)}</span>
                    </div>
                  </div>

                  <div className="bg-brand-black/40 backdrop-blur-md rounded-[24px] p-8 text-center border border-brand-border">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">{t.riskScore}</span>
                    <div className="relative h-4 bg-brand-dark-gray rounded-full overflow-hidden mb-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${prediction.score}%` }}
                        className={cn(
                          "h-full rounded-full",
                          prediction.score < 30 ? "bg-emerald-500" : prediction.score < 60 ? "bg-brand-gold" : "bg-rose-500"
                        )}
                      />
                    </div>
                    <span className="text-4xl font-black text-brand-gold">{Math.round(prediction.score)}</span>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ptaResults}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="frequency" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis reversed domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Line type="monotone" dataKey="threshold" stroke="#C5A059" strokeWidth={4} dot={{ fill: '#C5A059', r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="p-6 bg-brand-black/50 rounded-[24px] border-2 border-brand-gold/20 shadow-[0_0_15px_rgba(197,160,89,0.05)]">
                    <p className="text-[14px] text-slate-300 leading-relaxed text-center font-medium">
                      <span className="text-brand-gold font-black text-base block mb-2">※ {(t as any).cautionTitle}</span> 
                      {(t as any).cautionText}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-brand-gold/10 rounded-2xl p-6 border border-brand-gold/30 text-center">
                      <p className="text-brand-gold text-sm font-black mb-2 uppercase tracking-tight">청력 건강 상태 요약</p>
                      <p className="text-white font-bold leading-relaxed">
                        {prediction.score < 30 
                          ? "청력이 매우 건강한 상태입니다. 현재의 생활 습관을 유지하며 정기적인 검진을 권장합니다." 
                          : prediction.score < 60 
                          ? "약간의 청력 저하가 관찰됩니다. 소음 노출을 줄이고 전문가와의 상담을 고려해보세요." 
                          : "청력 손실 위험이 높습니다. 빠른 시일 내에 이비인후과 전문의의 정밀 검사를 받으시길 권장합니다."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">{(t as any).shareWithFriends}</p>
                      <div className="flex justify-center gap-6">
                        <button className="w-12 h-12 rounded-full bg-[#FEE500] flex items-center justify-center text-black hover:scale-110 transition-transform">
                          <MessageSquare className="w-6 h-6 fill-current" />
                        </button>
                        <button className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:scale-110 transition-transform">
                          <Users className="w-6 h-6" />
                        </button>
                        <button className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white hover:scale-110 transition-transform">
                          <Share2 className="w-6 h-6" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => handleAction('retest')} className="flex-1 py-5 rounded-2xl bg-brand-black/40 backdrop-blur-sm border border-brand-border text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <RefreshCcw className="w-4 h-4" /> {t.retest}
                      </button>
                      <button 
                        onClick={handleShareResultsToChat}
                        className="flex-1 py-5 rounded-2xl bg-brand-gold text-brand-black text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20"
                      >
                        <Share2 className="w-4 h-4" /> {t.share}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ) : activeTab === 'welfare' ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20"
          >
            <div className="w-24 h-24 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/30 animate-pulse">
              <Search className="w-12 h-12 text-brand-gold" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">{(t as any).navWelfare}</h2>
              <p className="text-slate-400 font-bold">{(t as any).preparingTitle}</p>
              <p className="text-slate-500 text-sm">{(t as any).preparingSub}</p>
            </div>
            <button 
              onClick={() => setActiveTab('hearing')}
              className="px-8 py-4 rounded-2xl bg-brand-dark-gray border border-brand-border text-white font-bold hover:bg-brand-gold/10 transition-all"
            >
              {(t as any).backToHome}
            </button>
          </motion.div>
        ) : activeTab === 'community' ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {selectedArticle ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                >
                  <ArrowLeft className="w-5 h-5" />
                  {(t as any).backToList}
                </button>

                <div className="rounded-[40px] overflow-hidden aspect-video relative">
                  <img src={selectedArticle.img} alt={selectedArticle.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <span className="px-3 py-1 bg-brand-gold text-brand-black text-[10px] font-black rounded-full uppercase tracking-widest mb-3 inline-block">
                      {selectedArticle.tag}
                    </span>
                    <h2 className="text-3xl font-black text-white leading-tight">{selectedArticle.title}</h2>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="markdown-body text-white leading-relaxed text-xl font-medium">
                    <Markdown>{selectedArticle.content}</Markdown>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-8 border-t border-brand-border">
                  <button 
                    onClick={() => handleLike(selectedArticle.id)}
                    className={cn(
                      "flex-1 py-4 rounded-2xl border flex items-center justify-center gap-2 font-bold transition-all",
                      userLiked[selectedArticle.id] 
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-500" 
                        : "bg-brand-dark-gray border-brand-border text-white hover:bg-brand-gold/10"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", userLiked[selectedArticle.id] && "fill-current")} />
                    {(t as any).like} {likes[selectedArticle.id] || 0}
                  </button>
                  <button 
                    onClick={() => handleShare(selectedArticle)}
                    className="flex-1 py-4 rounded-2xl bg-brand-dark-gray border border-brand-border flex items-center justify-center gap-2 text-white font-bold hover:bg-brand-gold/10 transition-all"
                  >
                    <Share2 className="w-5 h-5 text-brand-gold" />
                    {(t as any).shareBtn}
                  </button>
                  <button 
                    onClick={() => {
                      const el = document.getElementById('comment-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 py-4 rounded-2xl bg-brand-dark-gray border border-brand-border flex items-center justify-center gap-2 text-white font-bold hover:bg-brand-gold/10 transition-all"
                  >
                    <MessageCircle className="w-5 h-5 text-brand-gold" />
                    {(t as any).comment} {comments[selectedArticle.id]?.length || 0}
                  </button>
                </div>

                <div id="comment-section" className="space-y-6 pt-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-brand-gold" />
                    {(t as any).comment} ({comments[selectedArticle.id]?.length || 0})
                  </h3>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-gold flex items-center justify-center text-brand-black font-bold shrink-0">
                        {formData.name ? formData.name[0] : 'U'}
                      </div>
                      <div className="flex-1 space-y-3">
                        <textarea 
                          placeholder={(t as any).commentPlaceholder}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full bg-brand-black/40 backdrop-blur-sm border border-brand-border rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-brand-gold transition-all min-h-[100px] resize-none"
                        />
                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleAddComment(selectedArticle.id)}
                            className="px-6 py-2 bg-brand-gold text-brand-black font-bold rounded-full text-sm hover:brightness-110 transition-all"
                          >
                            {(t as any).register}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      {(comments[selectedArticle.id] || []).map((comment) => (
                        <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                          <div className="w-10 h-10 rounded-full bg-brand-dark-gray border border-brand-border flex items-center justify-center text-slate-400 font-bold shrink-0">
                            {comment.user[0]}
                          </div>
                          <div className="flex-1 bg-brand-dark-gray/50 rounded-2xl p-4 border border-brand-border">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-bold text-white">{comment.user}</span>
                              <span className="text-[10px] text-slate-500">{comment.date}</span>
                            </div>
                            <p className="text-sm text-slate-300">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                      {(!comments[selectedArticle.id] || comments[selectedArticle.id].length === 0) && (
                        <p className="text-center text-slate-500 py-8 text-sm">{(t as any).firstComment}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white">{(t as any).communityTitle}</h2>
                  <p className="text-slate-500 text-sm">{(t as any).communitySub}</p>
                </div>

                <div className="grid gap-4">
                  {healthTips.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleArticleClick(item)}
                      className="bg-brand-dark-gray/40 backdrop-blur-md rounded-3xl overflow-hidden border border-brand-border group cursor-pointer hover:border-brand-gold/50 transition-all"
                    >
                      <div className="h-32 w-full relative">
                        <img src={item.img} alt={item.title} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" referrerPolicy="no-referrer" />
                        <div className="absolute top-4 left-4 px-3 py-1 bg-brand-gold/20 backdrop-blur-md rounded-full border border-brand-gold/30">
                          <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">{item.tag}</span>
                        </div>
                        <div className="absolute bottom-4 right-4 flex items-center gap-3 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {views[item.id] || 0}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {likes[item.id] || 0}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {comments[item.id]?.length || 0}</span>
                        </div>
                      </div>
                      <div className="p-6 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-black/40 backdrop-blur-sm flex items-center justify-center border border-brand-border">
                            <Ear className="w-5 h-5 text-brand-gold" />
                          </div>
                          <h3 className="text-lg font-bold text-white">{item.title}</h3>
                        </div>
                        <p className="text-slate-400 text-base leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        ) : activeTab === 'game' ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col items-center justify-center h-full text-center space-y-8 py-20"
          >
            <div className="relative w-full aspect-video rounded-[40px] overflow-hidden shadow-2xl shadow-brand-gold/10 mb-4">
              <img 
                src="https://images.unsplash.com/photo-1559038910-281ce0f7eaa4?auto=format&fit=crop&q=80&w=800" 
                alt="Hearing Game" 
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-brand-gold/20 backdrop-blur-md flex items-center justify-center border border-brand-gold/40">
                  <Music className="w-10 h-10 text-brand-gold" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4 px-6">
              <span className="px-4 py-1 bg-brand-gold/10 text-brand-gold text-[10px] font-black rounded-full uppercase tracking-[0.3em] border border-brand-gold/20">
                Auditory Cognitive
              </span>
              <p className="text-slate-400 font-bold text-lg">Sound Block Tetris</p>
              <p className="text-slate-500 text-sm leading-relaxed">Train your hearing and focus with musical blocks and cognitive patterns.</p>
              <h2 className="text-2xl font-black text-white leading-tight">{(t as any).navGame}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full px-6">
              <div className="bg-brand-dark-gray/40 p-6 rounded-3xl border border-brand-border text-center space-y-2">
                <Music className="w-6 h-6 text-brand-gold mx-auto" />
                <p className="text-xs font-bold text-white">Musical Blocks</p>
              </div>
              <div className="bg-brand-dark-gray/40 p-6 rounded-3xl border border-brand-border text-center space-y-2">
                <Zap className="w-6 h-6 text-brand-gold mx-auto" />
                <p className="text-xs font-bold text-white">Cognitive Focus</p>
              </div>
            </div>

            <div className="w-full px-6 space-y-3">
              <button 
                onClick={() => {
                  setShowTarotGame(true);
                }}
                className="w-full py-6 rounded-[32px] bg-brand-gold/10 border border-brand-gold/40 text-brand-gold font-black text-xl shadow-xl hover:bg-brand-gold/20 transition-all flex items-center justify-center gap-4 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles className="w-8 h-8 animate-pulse" />
                <div className="text-left">
                  <p className="leading-none mb-1">{lang === 'ko' ? '타로 청각 게임' : 'Tarot Auditory Game'}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">AI Tarot + Hearing Mission</p>
                </div>
              </button>

              <button 
                onClick={() => setShowMimiGame(true)}
                className="w-full py-6 rounded-[32px] bg-brand-gold text-brand-black font-black text-2xl shadow-2xl shadow-brand-gold/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <div className="flex items-center gap-3 relative z-10">
                  <Play className="w-8 h-8 fill-current" />
                  <span>Mimi's Sound Adventure</span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] opacity-60 relative z-10">New 2D Exploration Game</span>
              </button>

              <button 
                onClick={() => setShowTetrisGame(true)}
                className="w-full py-5 rounded-3xl bg-brand-dark-gray/60 text-white font-black text-xl border border-brand-border hover:bg-brand-border transition-all flex items-center justify-center gap-3"
              >
                <Music className="w-6 h-6" />
                <span>Sound Block Tetris</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-brand-gold/10 mb-4">
              <img 
                src={landingImage || "https://storage.googleapis.com/static-content-ais/images/5w6d5kcggzo2iwp6uckqtl/177491424081/1741360352516_image.png"} 
                alt="Family using mobile phones" 
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/60 via-transparent to-transparent" />
            </div>
            <div className="w-20 h-20 rounded-full bg-slate-500/10 flex items-center justify-center border border-slate-500/20">
              <Info className="w-10 h-10 text-slate-500" />
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold">{(t as any).preparingTitle}</p>
              <p className="text-slate-500 text-sm">{(t as any).preparingSub}</p>
            </div>
            <button 
              onClick={() => setActiveTab('hearing')}
              className="mt-4 px-6 py-3 rounded-xl bg-brand-dark-gray border border-brand-border text-white text-sm font-bold hover:bg-brand-gold/10 transition-all"
            >
              {(t as any).backToHome}
            </button>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* Floating Action Area */}
      {activeTab === 'hearing' && (
        <div className="w-full max-w-md bg-brand-dark-gray/40 backdrop-blur-2xl border-t border-brand-white/10 p-8 space-y-6 absolute bottom-40 z-50 rounded-t-[40px] shadow-[0_-20px_40px_rgba(0,0,0,0.4)] max-h-[70vh] overflow-y-auto scrollbar-hide">
          <div className="flex flex-col gap-4">
            {step === 'welcome' && (
              <>
                <button 
                  onClick={() => handleAction('start-test')}
                  className="action-button-hospital py-5 text-lg"
                >
                  <Stethoscope className="w-6 h-6 text-brand-gold" />
                  {t.startTest}
                </button>
                <button 
                  onClick={() => setActiveTab('game')}
                  className="action-button-hospital py-5 text-lg"
                >
                  <Music className="w-6 h-6 text-brand-gold" />
                  {(t as any).navGame}
                </button>
                <button 
                  onClick={() => handleAction('others')}
                  className="action-button-hospital py-5 text-base w-full"
                >
                  <MoreHorizontal className="w-6 h-6 text-slate-500" />
                  {t.others}
                </button>
              </>
            )}

            {step === 'others-links' && (
              <div className="space-y-4">
                <button 
                  onClick={() => window.open('https://line.me', '_blank')}
                  className="w-full py-5 rounded-2xl bg-[#06C755] text-white font-black flex items-center justify-center gap-3 shadow-lg hover:brightness-110 transition-all"
                >
                  <MessageSquare className="w-6 h-6 fill-current" />
                  {(t as any).lineToConnect}
                </button>
                <button 
                  onClick={() => window.open('https://pf.kakao.com', '_blank')}
                  className="w-full py-5 rounded-2xl bg-[#FEE500] text-[#3C1E1E] font-black flex items-center justify-center gap-3 shadow-lg hover:brightness-110 transition-all"
                >
                  <MessageCircle className="w-6 h-6 fill-current" />
                  {(t as any).kakaoTalkToConnect}
                </button>
                <button 
                  onClick={() => setStep('welcome')}
                  className="w-full py-4 rounded-2xl bg-brand-black/40 backdrop-blur-sm border border-brand-border text-slate-500 font-bold text-sm hover:bg-brand-gold/5 transition-all"
                >
                  {t.backToList}
                </button>
              </div>
            )}

            {step === 'ask-age' && (
              <div className="space-y-4 w-full">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">{(t as any).nameLabel}</label>
                  <input 
                    type="text" 
                    placeholder={(t as any).namePlaceholder}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full py-5 px-6 rounded-2xl bg-brand-black border border-brand-border text-white font-bold text-lg focus:outline-none focus:border-brand-gold transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">{(t as any).ageLabel}</label>
                  <input 
                    type="number" 
                    placeholder={(t as any).agePlaceholder}
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full py-5 px-6 rounded-2xl bg-brand-black border border-brand-border text-white font-bold text-lg focus:outline-none focus:border-brand-gold transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">{(t as any).phoneLabel}</label>
                  <input 
                    type="tel" 
                    placeholder="010-0000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full py-5 px-6 rounded-2xl bg-brand-black border border-brand-border text-white font-bold text-lg focus:outline-none focus:border-brand-gold transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">{(t as any).emailLabel}</label>
                  <input 
                    type="email" 
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full py-5 px-6 rounded-2xl bg-brand-black border border-brand-border text-white font-bold text-lg focus:outline-none focus:border-brand-gold transition-all"
                  />
                </div>
                <button 
                  disabled={!formData.name || !formData.age || !formData.phone || !formData.email}
                  onClick={() => handleAction('set-age')}
                  className={cn(
                    "w-full py-6 rounded-2xl font-bold text-xl transition-all mt-4",
                    (!formData.name || !formData.age || !formData.phone || !formData.email)
                      ? "bg-brand-dark-gray text-slate-600 cursor-not-allowed"
                      : "bg-brand-gold text-brand-black shadow-lg shadow-brand-gold/20"
                  )}
                >
                  {(t as any).nextStep}
                </button>
              </div>
            )}

            {step === 'ask-gender' && (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleAction('set-gender', 'male')} className="action-button-hospital py-5 text-lg">{t.male}</button>
                <button onClick={() => handleAction('set-gender', 'female')} className="action-button-hospital py-5 text-lg">{t.female}</button>
              </div>
            )}

            {step === 'ask-age-group' && (
              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => handleAction('set-age-group', 'youth')} className="action-button-hospital py-5 text-lg">{(t as any).youth}</button>
                <button onClick={() => handleAction('set-age-group', 'adult')} className="action-button-hospital py-5 text-lg">{(t as any).adult}</button>
                <button onClick={() => handleAction('set-age-group', 'senior')} className="action-button-hospital py-5 text-lg">{(t as any).senior}</button>
              </div>
            )}

            {step === 'questionnaire-intro' && (
              <div className="space-y-4 w-full">
                <button 
                  onClick={() => handleAction('start-questionnaire')}
                  className="action-button-hospital w-full bg-brand-gold text-brand-black border-none py-6 text-xl"
                >
                  <Send className="w-6 h-6" />
                  {(t as any).startQuestionnaire}
                </button>
                <button 
                  onClick={() => handleAction('pta-intro-next')}
                  className="w-full py-4 text-slate-500 font-bold text-sm hover:text-white transition-colors"
                >
                  {(t as any).skipQuestionnaire}
                </button>
              </div>
            )}

            {step === 'questionnaire' && (
              <div className="bg-brand-black/40 backdrop-blur-md rounded-3xl p-8 border border-brand-gold/20 space-y-8">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-brand-gold uppercase tracking-widest">
                    {(t as any).questionnaireTitle} ({questionIndex + 1} / {(questionnaireQuestions as any)[lang][formData.ageGroup || 'adult'].length})
                  </span>
                  <p className="text-xl font-bold text-white leading-relaxed">
                    {(questionnaireQuestions as any)[lang][formData.ageGroup || 'adult'][questionIndex]}
                  </p>
                </div>
                {formData.ageGroup === 'senior' ? (
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => handleAction('answer-questionnaire', 4)}
                      className="py-4 rounded-2xl bg-brand-gold text-brand-black font-bold shadow-lg shadow-brand-gold/20 hover:brightness-110 transition-all text-lg"
                    >
                      {(t as any).always}
                    </button>
                    <button 
                      onClick={() => handleAction('answer-questionnaire', 2)}
                      className="py-4 rounded-2xl bg-brand-dark-gray border border-brand-border text-white font-bold hover:bg-brand-gold/10 transition-all text-lg"
                    >
                      {(t as any).sometimes}
                    </button>
                    <button 
                      onClick={() => handleAction('answer-questionnaire', 0)}
                      className="py-4 rounded-2xl bg-brand-dark-gray border border-brand-border text-white font-bold hover:bg-brand-gold/10 transition-all text-lg"
                    >
                      {(t as any).no}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleAction('answer-questionnaire', 0)}
                      className="py-5 rounded-2xl bg-brand-dark-gray border border-brand-border text-white font-bold hover:bg-brand-gold/10 transition-all"
                    >
                      {t.no}
                    </button>
                    <button 
                      onClick={() => handleAction('answer-questionnaire', 4)}
                      className="py-5 rounded-2xl bg-brand-gold text-brand-black font-bold shadow-lg shadow-brand-gold/20 hover:brightness-110 transition-all"
                    >
                      {t.yes}
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 'pta-intro' && (
              <div className="space-y-4 w-full">
                <button 
                  onClick={() => playTone(1000, 60)}
                  className="w-full py-4 rounded-2xl bg-brand-black border border-brand-gold/30 text-brand-gold text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-gold/5 transition-all"
                >
                  <Volume2 className="w-5 h-5" />
                  {(t as any).checkVolume}
                </button>
                <button 
                  onClick={() => handleAction('pta-start')}
                  className="action-button-hospital w-full bg-brand-gold text-brand-black border-none py-6 text-xl"
                >
                  {t.ptaStart}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Report Modal */}
      <AnimatePresence>
        {showTetrisGame && (
          <SoundBlockTetris 
            onClose={() => setShowTetrisGame(false)} 
            language={lang}
            translations={t}
          />
        )}
        {showMimiGame && (
          <MimiGame onClose={() => setShowMimiGame(false)} t={t} />
        )}

      <AnimatePresence>
        {showTarotGame && (
          <TarotGame 
            onClose={() => setShowTarotGame(false)}
            lang={lang}
          />
        )}
      </AnimatePresence>
        {showReportModal && prediction && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-sm no-print"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] bg-white shadow-2xl rounded-[32px] overflow-hidden border border-slate-200 flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 p-6 md:p-8 text-white flex justify-between items-center shrink-0">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">{(t as any).aiReport}</h1>
                  <p className="text-slate-400 text-sm">{(t as any).detailedAnalysis}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Date</p>
                    <p className="font-bold text-sm">{new Date().toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div id="report-modal-content" className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 bg-white print:p-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Name</p>
                    <p className="font-bold text-slate-900">{formData.name || 'User'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Age Group</p>
                    <p className="font-bold text-slate-900 uppercase">{formData.ageGroup || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grade</p>
                    <p className="font-bold text-slate-900">{getGradeLabel(prediction.grade)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Risk Score</p>
                    <p className="font-bold text-slate-900">{Math.round(prediction.score)}/100</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-slate-900 rounded-full"></span>
                    Audiogram Results
                  </h2>
                  <div className="bg-slate-900 rounded-3xl p-6 flex justify-center">
                    <img src={reportChartImage} className="max-w-full h-auto rounded-xl" alt="Audiogram" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-slate-900 rounded-full"></span>
                      Detailed Analysis
                    </h2>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-slate-600 leading-relaxed">{(t as any).analysisText}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-slate-900 rounded-full"></span>
                      Recommendations
                    </h2>
                    <div className="space-y-3">
                      {healthTips.slice(0, 3).map((tip, idx) => (
                        <div key={tip.id} className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{tip.title}</p>
                            <p className="text-slate-500 text-xs mt-1">{tip.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 text-center">
                  <p className="text-amber-800 text-sm font-medium">
                    <span className="font-black block mb-1">※ ${(t as any).cautionTitle}</span>
                    {(t as any).cautionText}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 no-print">
                <p className="text-slate-400 text-xs font-medium">© 2026 Hearing Health AI</p>
                <div className="flex gap-4 w-full md:w-auto">
                  <button 
                    onClick={handleDownloadPDF} 
                    className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {(t as any).saveAsPdf}
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    {(t as any).print}
                  </button>
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 md:flex-none px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                  >
                    {(t as any).close}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="w-full max-w-md bg-brand-dark-gray/60 backdrop-blur-xl border-t border-brand-border px-6 py-6 flex justify-between items-center z-50 sticky bottom-0">
        {[
          { id: 'welfare', icon: Search, label: (t as any).navWelfare },
          { id: 'hearing', icon: Ear, label: (t as any).navHearing },
          { id: 'community', icon: MessageSquare, label: (t as any).navCommunity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'hearing') {
                setStep('welcome');
                setMessages([
                  { id: 'welcome-1', type: 'bot', text: t.welcome },
                  { id: 'welcome-2', type: 'bot', text: t.intro }
                ]);
              }
            }}
            className={cn(
              "flex flex-col items-center gap-2 transition-all flex-1",
              activeTab === tab.id ? "text-brand-gold" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <tab.icon className={cn("w-8 h-8", activeTab === tab.id && "animate-pulse")} />
            <span className="text-[13px] font-bold tracking-tight">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Home Indicator Simulation */}
      <div className="w-full max-w-md bg-brand-dark-gray/60 backdrop-blur-xl pb-4 flex flex-col items-center gap-4 z-50">
        <div className="w-32 h-1 bg-brand-border rounded-full" />
        <div className="text-[10px] text-slate-600 font-medium tracking-tight">
          Copyright OBLIGE, INC 2026
        </div>
      </div>
    </div>
  );
}

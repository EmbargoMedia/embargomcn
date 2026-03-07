import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, Heart, MessageCircle, User, Bot, Key, RefreshCcw, Volume2, PlayCircle } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import Markdown from 'react-markdown';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  tts?: string;
}

interface LuneChatProps {
  onClose: () => void;
  lang: string;
  initialMessage?: string;
}

const LuneChat: React.FC<LuneChatProps> = ({ onClose, lang, initialMessage }) => {
  const LUNE_AVATAR = "https://storage.googleapis.com/static-content-ais/images/5w6d5kcggzo2iwp6uckqtl/177491424081/1741368904712_image.png";
  const LUNE_SMILING = "https://storage.googleapis.com/static-content-ais/images/5w6d5kcggzo2iwp6uckqtl/177491424081/1741368904712_image.png"; // Using the same for now as it's high quality
  const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800";
  
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-1',
      role: 'model',
      text: lang === 'ko' 
        ? "안녕! 나는 'Mimi’s Sound Adventure'의 가이드, 룬(LUNE)이야! 🐾 귀여운 고양이 Mimi와 함께 소리 모험을 떠날 준비 됐니? Mimi를 움직여서 장애물을 넘고, 신비로운 소리 미션을 해결해보자! ✨" 
        : "Hi! I'm LUNE, your guide for 'Mimi’s Sound Adventure'! 🐾 Are you ready for a sound adventure with the cute cat Mimi? Let's move Mimi, overcome obstacles, and solve mysterious sound missions! ✨"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (initialMessage) {
      handleSend(initialMessage);
    }
  }, []);

  const generateVideo = async (prompt: string) => {
    if (!hasApiKey) return;
    
    setIsVideoGenerating(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY!;
      const ai = new GoogleGenAI({ apiKey });
      
      // Fetch the image as base64 with CORS safety
      let imageBlob;
      try {
        const imageResponse = await fetch(LUNE_AVATAR, { mode: 'cors' });
        if (!imageResponse.ok) throw new Error("Avatar fetch failed");
        imageBlob = await imageResponse.blob();
      } catch (e) {
        console.warn("Primary avatar fetch failed, trying fallback for video generation", e);
        const fallbackRes = await fetch(FALLBACK_AVATAR, { mode: 'cors' });
        imageBlob = await fallbackRes.blob();
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(imageBlob);
      });
      const base64Image = await base64Promise;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `A high-quality video of this woman talking gently and smiling warmly. Cinematic lighting, realistic movement. ${prompt}`,
        image: {
          imageBytes: base64Image,
          mimeType: 'image/png',
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        try {
          const videoResponse = await fetch(downloadLink, {
            method: 'GET',
            headers: {
              'x-goog-api-key': apiKey,
            },
          });
          if (!videoResponse.ok) throw new Error(`Video download failed: ${videoResponse.statusText}`);
          const videoBlob = await videoResponse.blob();
          
          // Cleanup old URL before setting new one
          if (videoUrl) URL.revokeObjectURL(videoUrl);
          setVideoUrl(URL.createObjectURL(videoBlob));
        } catch (fetchError) {
          console.error("Failed to fetch video content:", fetchError);
          // If fetch fails (likely CORS), we can't do much but clear the state
          setVideoUrl(null);
        }
      }
    } catch (error: any) {
      console.error("Video generation error:", error);
      if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
        const quotaMsg = lang === 'ko' 
          ? "현재 AI 영상 생성 쿼터가 모두 소진되었습니다. 잠시 후 다시 시도하거나 일반 대화 모드를 이용해주세요. 🌿" 
          : "AI video generation quota exhausted. Please try again later or use standard chat mode. 🌿";
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: quotaMsg }]);
      }
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const playGeminiTts = async (text: string) => {
    if (!text) return;
    
    setIsTtsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `다정하고 친근한 목소리로 말해줘: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is typically a warm, friendly female voice
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioUrl = `data:audio/wav;base64,${base64Audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        } else {
          const audio = new Audio(audioUrl);
          audio.play();
          audioRef.current = audio;
        }
      }
    } catch (error) {
      console.error("Gemini TTS Error:", error);
      // Fallback to browser TTS if Gemini TTS fails
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ko' ? 'ko-KR' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    } finally {
      setIsTtsLoading(false);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      text: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const systemInstruction = lang === 'ko'
        ? `당신은 'Mimi’s Sound Adventure'라는 고양이 캐릭터 기반 청각인지 재활 게임의 AI 가이드 '룬(LUNE)'입니다. 다음 지침을 엄격히 준수하세요:

1. 게임 설정 및 캐릭터:
   - 주인공: Mimi (귀여운 고양이)
   - 스타일: 플랫폼 점프, 장애물 회피, 보상 수집 (슈퍼마리오 느낌)
   - 목표: 레벨 완료 + 청각 훈련 + 타로 심리 메시지 획득

2. 상호작용 방식:
   - 사용자가 Mimi의 행동(점프, 이동 등)을 입력하면, 게임 상황을 생생하게 묘사하고 반드시 '청각 미션'을 제공하세요.
   - 미션 유형: 소리 방향 맞추기 🔊, 음 높이 구분 ⬆️⬇️, 단어 반복 🗣️, 특정 소리 반응 ⚡.
   - 성공 시: 보상 포인트 지급 + 타로 카드 해석 메시지 제공.
   - 실패 시: 따뜻하고 친근한 동기 부여 피드백 제공.

3. 멀티모달 출력 형식:
   - 음성 안내: 반드시 [TTS] 내용 [/TTS] 형식 사용.
   - 시각 힌트: 이모지(⭐, ☁️, 🍄, 🐾), 색상, 화살표를 사용하여 플랫폼 위치나 미션 힌트 표시.

4. 게임 진행:
   - 레벨에 따라 청각 난이도를 점진적으로 높이세요.
   - 타로 카드는 게임 몰입과 심리적 보상 역할을 하며, 매 레벨마다 랜덤/맞춤 제공합니다.
   - 모든 메시지는 긍정적이고 친근하며 이해하기 쉽게 작성하세요.

예시 상황:
사용자: "Mimi 점프!"
AI: [TTS] Mimi가 힘차게 점프하여 반짝이는 구름 플랫폼 위로 착지했습니다! [/TTS]
텍스트: "와! 구름 위에서 작은 별들이 노래하고 있어요. ⭐ 소리를 잘 듣고 같은 소리가 나는 별을 찾아보세요."
청각 미션: "왼쪽 스피커에서 나는 '야옹' 소리를 듣고 왼쪽 화살표 키를 누르세요 🔊"
타로 메시지: "오늘의 보상 카드: **별(The Star)** 🌟 - 당신의 앞날에 희망이 가득할 거예요. 작은 성공을 축하해요!"`
        : `You are 'LUNE', the AI guide for 'Mimi’s Sound Adventure', a cat-character-based auditory cognitive rehabilitation game. Strictly follow these guidelines:

1. Game Setting & Character:
   - Protagonist: Mimi (a cute cat)
   - Style: Platform jumping, obstacle avoidance, reward collection (Super Mario style)
   - Goal: Level completion + Auditory training + Tarot psychological message acquisition

2. Interaction Method:
   - When the user inputs Mimi's actions (jump, move, etc.), vividly describe the game situation and MUST provide an 'Auditory Mission'.
   - Mission Types: Sound direction matching 🔊, Pitch discrimination ⬆️⬇️, Word repetition 🗣️, Specific sound reaction ⚡.
   - On Success: Grant reward points + provide Tarot card interpretation message.
   - On Failure: Provide warm, friendly motivational feedback.

3. Multimodal Output Format:
   - Voice Guidance: MUST use [TTS] content [/TTS] format.
   - Visual Hints: Use emojis (⭐, ☁️, 🍄, 🐾), colors, and arrows to indicate platform positions or mission hints.

4. Game Progression:
   - Gradually increase auditory difficulty as levels progress.
   - Tarot cards serve as immersion and psychological rewards, provided randomly/customized per level.
   - All messages must be positive, friendly, and easy to understand.

Example Scenario:
User: "Mimi jump!"
AI: [TTS] Mimi jumped vigorously and landed on a sparkling cloud platform! [/TTS]
Text: "Wow! Small stars are singing on the cloud. ⭐ Listen carefully and find the star making the same sound."
Auditory Mission: "Listen to the 'meow' sound from the left speaker and press the left arrow key 🔊"
Tarot Message: "Today's Reward Card: **The Star** 🌟 - Your future will be full of hope. Celebrate your small success!"`;

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: systemInstruction,
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const response = await chat.sendMessage({ message: messageText });
      const rawText = response.text || (lang === 'ko' ? "죄송해요, 잠시 생각을 정리하느라 대답이 늦었네요. 다시 말씀해주시겠어요?" : "I'm sorry, I was organizing my thoughts for a moment. Could you say that again?");
      
      // Extract TTS
      const ttsMatch = rawText.match(/\[TTS\](.*?)\[\/TTS\]/);
      const tts = ttsMatch ? ttsMatch[1].trim() : undefined;
      const cleanText = rawText.replace(/\[TTS\].*?\[\/TTS\]/g, '').trim();

      const botMessage: Message = {
        id: generateId(),
        role: 'model',
        text: cleanText,
        tts: tts
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Auto-play Gemini TTS
      if (tts) {
        playGeminiTts(tts);
      }
      
      // Generate video if API key is available
      if (hasApiKey) {
        generateVideo(botMessage.text.substring(0, 100));
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      let errorText = lang === 'ko' ? "잠시 연결이 불안정해요. 마음을 가다듬고 다시 시도해볼까요? 🌿" : "The connection is a bit unstable. Shall we try again in a moment? 🌿";
      
      if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
        errorText = lang === 'ko' 
          ? "죄송합니다. 현재 AI 사용량이 많아 잠시 대화가 어렵습니다. 잠시 후 다시 시도해 주세요. (할당량 초과) 🌿" 
          : "I'm sorry, I've reached my usage limit for now. Please try again in a little while. (Quota Exceeded) 🌿";
      }
      
      const errorMessage: Message = {
        id: generateId(),
        role: 'model',
        text: errorText
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-brand-black flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-md h-full bg-brand-dark-gray/20 flex flex-col relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-brand-gold/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square bg-brand-gold/5 rounded-full blur-[100px]" />

        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-brand-white/10 bg-brand-black/80 backdrop-blur-3xl z-20">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-[24px] overflow-hidden border-2 border-brand-gold/50 shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-transform duration-500 group-hover:scale-105">
                <img 
                  src={LUNE_AVATAR} 
                  alt="LUNE" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-brand-black shadow-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full animate-ping opacity-40" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white tracking-tight leading-none">LUNE</h1>
                <span className="px-2 py-0.5 bg-brand-gold/20 text-brand-gold text-[8px] font-black rounded-full border border-brand-gold/30 uppercase tracking-widest">Game Guide</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-brand-gold" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Mimi's Sound Adventure</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Avatar Display */}
        <div className="relative w-full h-80 overflow-hidden bg-brand-black z-10 group">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover"
              onError={() => setVideoUrl(null)}
            />
          ) : (
            <img 
              src={LUNE_AVATAR} 
              alt="LUNE Avatar" 
              className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/10 to-transparent" />
          
          <div className="absolute top-4 right-6 flex flex-col gap-2">
            {!hasApiKey && (
              <motion.button 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                onClick={handleOpenKey}
                className="px-4 py-2 bg-brand-gold/20 backdrop-blur-xl border border-brand-gold/40 text-brand-gold rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-gold/30 transition-all"
              >
                <Key className="w-3 h-3" />
                {lang === 'ko' ? 'AI 영상 모드' : 'AI Video Mode'}
              </motion.button>
            )}
            {videoUrl && (
              <button 
                onClick={() => setVideoUrl(null)}
                className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all"
              >
                <RefreshCcw className="w-3 h-3" />
                {lang === 'ko' ? '이미지 모드' : 'Image Mode'}
              </button>
            )}
          </div>

          <motion.div 
            animate={{ 
              y: [0, -5, 0],
              opacity: (isLoading || isVideoGenerating) ? [0.6, 1, 0.6] : 0.9
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4,
              ease: "easeInOut"
            }}
            className="absolute bottom-6 left-6 flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full border-2 border-brand-gold/60 overflow-hidden shadow-[0_0_30px_rgba(197,160,89,0.3)]">
              <img 
                src={LUNE_AVATAR} 
                alt="LUNE Small" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                }}
              />
            </div>
            <div className="bg-brand-black/80 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-brand-gold/30 shadow-2xl">
              <p className="text-[11px] font-black text-brand-gold uppercase tracking-[0.2em]">
                {isVideoGenerating ? (lang === 'ko' ? 'AI 영상 생성 중...' : 'Generating AI Video...') : 
                 isLoading ? (lang === 'ko' ? '룬이 생각 중...' : 'LUNE is thinking...') : 
                 (lang === 'ko' ? '룬과 대화 중' : 'Chatting with LUNE')}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide z-10"
        >
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-brand-gold/20 shadow-lg ${
                  msg.role === 'user' ? 'bg-brand-gold/20' : 'bg-brand-dark-gray'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-5 h-5 text-brand-gold" />
                  ) : (
                    <img 
                      src={LUNE_AVATAR} 
                      alt="LUNE" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                      }}
                    />
                  )}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed space-y-3 ${
                  msg.role === 'user' 
                    ? 'bg-brand-gold text-brand-black font-bold rounded-tr-none' 
                    : 'bg-brand-dark-gray/60 text-slate-200 border border-brand-border rounded-tl-none'
                }`}>
                  {msg.tts && (
                    <button 
                      onClick={() => playGeminiTts(msg.tts!)}
                      disabled={isTtsLoading}
                      className="flex items-center gap-2 px-3 py-2 bg-brand-gold/10 rounded-xl border border-brand-gold/20 mb-2 hover:bg-brand-gold/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isTtsLoading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                          <RefreshCcw className="w-4 h-4 text-brand-gold" />
                        </motion.div>
                      ) : (
                        <Volume2 className="w-4 h-4 text-brand-gold" />
                      )}
                      <span className="text-[10px] font-black text-brand-gold uppercase tracking-widest">
                        {isTtsLoading ? 'Generating Voice...' : 'Listen Again'}
                      </span>
                    </button>
                  )}
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-dark-gray flex items-center justify-center overflow-hidden border border-brand-gold/20">
                  <img 
                    src={LUNE_AVATAR} 
                    alt="LUNE" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                    }}
                  />
                </div>
                <div className="bg-brand-dark-gray/60 p-4 rounded-2xl rounded-tl-none border border-brand-border">
                  <div className="flex gap-1">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-brand-black/40 backdrop-blur-xl border-t border-brand-white/10 z-10">
          {/* Quick Actions */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
            <button 
              onClick={() => {
                setInput(lang === 'ko' ? "Mimi 점프!" : "Mimi jump!");
              }}
              className="whitespace-nowrap px-4 py-2 bg-brand-gold/10 border border-brand-gold/30 rounded-full text-[10px] font-black text-brand-gold uppercase tracking-widest hover:bg-brand-gold/20 transition-all"
            >
              🐾 {lang === 'ko' ? 'Mimi 점프' : 'Mimi Jump'}
            </button>
            <button 
              onClick={() => {
                setInput(lang === 'ko' ? "오른쪽으로 이동" : "Move right");
              }}
              className="whitespace-nowrap px-4 py-2 bg-brand-gold/10 border border-brand-gold/30 rounded-full text-[10px] font-black text-brand-gold uppercase tracking-widest hover:bg-brand-gold/20 transition-all"
            >
              ➡️ {lang === 'ko' ? '오른쪽 이동' : 'Move Right'}
            </button>
            <button 
              onClick={() => {
                setInput(lang === 'ko' ? "소리 미션 주세요!" : "Give me a sound mission!");
              }}
              className="whitespace-nowrap px-4 py-2 bg-brand-gold/10 border border-brand-gold/30 rounded-full text-[10px] font-black text-brand-gold uppercase tracking-widest hover:bg-brand-gold/20 transition-all"
            >
              🔊 {lang === 'ko' ? '소리 미션' : 'Sound Mission'}
            </button>
          </div>

          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={lang === 'ko' ? "룬에게 마음을 들려주세요..." : "Tell LUNE your thoughts..."}
              className="w-full bg-brand-dark-gray/40 border border-brand-border rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-gold/50 transition-all pr-14"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-3 rounded-xl bg-brand-gold text-brand-black disabled:opacity-50 disabled:scale-95 transition-all active:scale-90"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-600 mt-4 uppercase tracking-[0.2em] font-bold">
            LUNE is here to listen and comfort you
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LuneChat;

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface HearingData {
  age: number;
  gender: string;
  noiseExposure: boolean;
  tinnitus: boolean;
  existingHearingIssues: boolean;
  ptaResults: {
    frequency: number;
    threshold: number;
  }[];
}

export async function predictHearingRisk(data: HearingData) {
  const prompt = `
    Analyze the following hearing test data and predict the risk of hearing loss.
    
    User Profile:
    - Age: ${data.age}
    - Gender: ${data.gender}
    - Noise Exposure: ${data.noiseExposure ? "Yes" : "No"}
    - Tinnitus: ${data.tinnitus ? "Yes" : "No"}
    - Existing Issues: ${data.existingHearingIssues ? "Yes" : "No"}
    
    Pure Tone Audiometry (PTA) Thresholds (dB HL):
    ${data.ptaResults.map(r => `- ${r.frequency}Hz: ${r.threshold}dB`).join("\n")}
    
    Please provide:
    1. A risk score (0-100).
    2. A classification grade (Normal, Mild, Moderate, Severe, Profound).
    3. A brief professional recommendation.
    4. A summary of the audiogram analysis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            grade: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            analysis: { type: Type.STRING },
          },
          required: ["score", "grade", "recommendation", "analysis"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Prediction Error:", error);
    // Fallback heuristic if AI fails
    const avgThreshold = data.ptaResults.reduce((acc, curr) => acc + curr.threshold, 0) / data.ptaResults.length;
    let grade = "Normal";
    if (avgThreshold > 25) grade = "Mild";
    if (avgThreshold > 40) grade = "Moderate";
    if (avgThreshold > 60) grade = "Severe";
    if (avgThreshold > 80) grade = "Profound";

    return {
      score: Math.min(100, avgThreshold * 1.2),
      grade,
      recommendation: "Please consult an audiologist for a detailed examination.",
      analysis: "Based on the average threshold across frequencies.",
    };
  }
}

const LIFE_RHYTHM_SYSTEM_INSTRUCTION = `당신은 "오블리주 라이프리듬 분석" 웰니스 분석 시스템입니다.

당신의 역할은 사용자의 이름, 생년월일, 출생시간을 기반으로
개인의 라이프 리듬과 에너지 패턴을 분석하고
건강과 생활 습관에 대한 맞춤형 가이드를 제공하는 것입니다.

이 서비스는 전통적인 오행 균형 이론과 현대적인 웰니스 개념을 결합하여
개인의 라이프 리듬을 분석합니다.

중요 규칙

다음 단어는 사용하지 않습니다.
- 사주
- 운세
- 점술
- 운명
- 미래 예측

대신 다음 표현을 사용합니다.
- 라이프 리듬 분석
- 개인 에너지 패턴
- 오행 균형 데이터
- 생활 리듬 분석

이 분석은 의료 진단이 아닌
웰니스와 생활 습관 개선을 위한 참고 가이드입니다.

입력 데이터

사용자는 다음 정보를 제공합니다.

- 이름
- 생년월일
- 출생시간

분석 기준

동양의 오행 균형 개념을 기반으로
개인의 라이프 리듬을 해석합니다.

오행 요소

목(木) : 성장, 신경계, 활동성  
화(火) : 순환, 에너지, 활력  
토(土) : 소화, 안정성  
금(金) : 호흡기, 청각 건강  
수(水) : 회복력, 면역력

출력 구조

다음 구조로 결과를 작성합니다.

1️⃣ 라이프 리듬 요약  
개인의 에너지 패턴과 전반적인 라이프 리듬을 설명합니다.

2️⃣ 오행 균형 분석  
각 요소의 상대적인 강점과 약점을 간단히 설명합니다.

3️⃣ 청각 건강 관리 가이드  
금(金) 요소는 청각과 호흡기 건강과 연관됩니다.

다음 내용을 포함합니다.

- 소음 환경 관리
- 이어폰 및 음향 사용 습관
- 청각 휴식
- 청각 훈련 활동 추천

4️⃣ 피부 및 신체 상태 경향  
오행 균형을 기반으로 피부 상태나 체질 경향을 설명합니다.

5️⃣ 체질 관리 가이드  

다음 내용을 포함합니다.

- 추천 운동
- 식습관
- 수면 습관
- 스트레스 관리

6️⃣ 하루 생활 리듬 추천  

다음 내용을 포함합니다.

- 집중하기 좋은 시간대
- 휴식이 필요한 시간
- 건강 유지 습관

톤

전문적인 웰니스 컨설턴트처럼 설명합니다.
신비주의적인 표현 대신 데이터 기반 설명을 사용합니다.

반드시 마지막에 다음 문장을 포함합니다.

"이 분석은 전통적인 웰니스 개념을 기반으로 한 생활 가이드이며 의료 진단을 대체하지 않습니다."

답변은 읽기 쉽게 구조화하여 작성합니다.`;

export async function analyzeLifeRhythm(data: { name: string; birthDate: string; birthTime: string }) {
  // Local deterministic logic to analyze life rhythm without AI
  const getDominantElement = (dateStr: string) => {
    const numbers = dateStr.replace(/[^0-9]/g, '');
    const sum = numbers.split('').reduce((acc, curr) => acc + parseInt(curr), 0);
    const elements = ['목(木)', '화(火)', '토(土)', '금(金)', '수(水)'];
    return {
      index: sum % 5,
      name: elements[sum % 5]
    };
  };

  const elementInfo = getDominantElement(data.birthDate);
  
  const reports = [
    {
      summary: `${data.name}님은 성장의 에너지가 강한 '목(木)'의 리듬을 가지고 있습니다. 새로운 일을 시작하는 추진력이 뛰어나며 창의적인 아이디어가 풍부한 시기입니다.`,
      balanceAnalysis: "현재 목(木)의 기운이 강하여 활동성이 높지만, 자칫 신경계의 피로가 쌓일 수 있습니다. 토(土)의 안정성을 보완하여 균형을 맞추는 것이 중요합니다.",
      hearingGuide: {
        content: "목의 기운이 강할 때는 간과 신경계가 민감해질 수 있으며, 이는 청각 예민도로 이어질 수 있습니다.",
        tips: ["조용한 숲속 소리 듣기", "이어폰 볼륨 50% 이하 유지", "취침 전 명상 음악", "비타민 B군 섭취"]
      },
      bodyTrend: "근육의 긴장도가 높고 눈이 쉽게 피로해질 수 있는 체질입니다. 스트레칭을 생활화하세요.",
      wellnessGuide: {
        exercise: "요가, 필라테스 등 유연성 운동",
        diet: "신선한 녹색 채소, 신맛이 나는 과일",
        sleep: "밤 11시 이전 취침 (간 회복 시간)",
        stress: "숲길 산책이나 원예 활동"
      },
      dailyRhythm: {
        focusTime: "오전 7시 ~ 11시",
        restTime: "오후 1시 ~ 3시",
        habits: ["아침 기지개", "충분한 수분 섭취", "눈 마사지"]
      }
    },
    {
      summary: `${data.name}님은 열정적이고 활기찬 '화(火)'의 리듬을 가지고 있습니다. 대인관계에서 에너지를 얻으며 표현력이 풍부하고 밝은 기운이 넘칩니다.`,
      balanceAnalysis: "화(火)의 기운이 충만하여 열정이 넘치지만, 심혈관계의 과부하를 주의해야 합니다. 수(水)의 차분함으로 열기를 식혀주는 지혜가 필요합니다.",
      hearingGuide: {
        content: "화의 기운이 높으면 체내 열기가 위로 올라와 귀가 먹먹해지거나 이명이 발생할 가능성이 있습니다.",
        tips: ["시원한 물소리 듣기", "고주파 소음 피하기", "귀 주변 냉찜질", "충분한 휴식"]
      },
      bodyTrend: "안면 홍조가 있거나 가슴 답답함을 느낄 수 있는 체질입니다. 열을 내리는 활동이 필요합니다.",
      wellnessGuide: {
        exercise: "수영, 가벼운 조깅",
        diet: "쓴맛이 나는 채소(고들빼기, 상추), 붉은색 과일",
        sleep: "심장 안정을 위해 깊은 수면 유도",
        stress: "명상과 심호흡"
      },
      dailyRhythm: {
        focusTime: "오전 11시 ~ 오후 1시",
        restTime: "오후 7시 ~ 9시",
        habits: ["미지근한 물 샤워", "심호흡 5분", "카페인 줄이기"]
      }
    },
    {
      summary: `${data.name}님은 안정적이고 포용력이 넓은 '토(土)'의 리듬을 가지고 있습니다. 주변 사람들에게 신뢰를 주며 매사에 신중하고 조화로운 에너지를 발산합니다.`,
      balanceAnalysis: "토(土)의 기운이 안정감을 주지만, 생각이 많아지면 소화계에 부담이 갈 수 있습니다. 목(木)의 활동성을 더해 정체를 막아주어야 합니다.",
      hearingGuide: {
        content: "토의 기운은 전반적인 신체 순환과 연관되어 있으며, 순환 저하는 청력 저하의 원인이 될 수 있습니다.",
        tips: ["규칙적인 청력 운동", "자연의 소리 감상", "귀 마사지", "자극적인 소리 지양"]
      },
      bodyTrend: "소화력이 약해지거나 몸이 무겁게 느껴질 수 있는 체질입니다. 규칙적인 식사가 핵심입니다.",
      wellnessGuide: {
        exercise: "맨발 걷기, 등산",
        diet: "단맛이 나는 곡물, 노란색 채소(단호박, 고구마)",
        sleep: "규칙적인 수면 패턴 유지",
        stress: "흙을 만지는 활동이나 도예"
      },
      dailyRhythm: {
        focusTime: "오후 1시 ~ 3시",
        restTime: "오전 9시 ~ 10시",
        habits: ["식후 10분 걷기", "배 따뜻하게 하기", "정해진 시간에 식사"]
      }
    },
    {
      summary: `${data.name}님은 결단력이 있고 깔끔한 '금(金)'의 리듬을 가지고 있습니다. 정의감이 강하며 논리적이고 체계적인 에너지 패턴을 보입니다.`,
      balanceAnalysis: "금(金)의 기운은 폐와 호흡기, 그리고 청각과 직결됩니다. 건조해지기 쉬운 기운이므로 화(火)의 따뜻함으로 부드럽게 만들어야 합니다.",
      hearingGuide: {
        content: "금의 기운은 청각 건강의 핵심입니다. 이 기운이 과하거나 부족하면 청력 손실에 가장 민감하게 반응합니다.",
        tips: ["백색 소음 활용", "금속성 고음 피하기", "코와 목 건강 관리", "정기적인 청력 검사"]
      },
      bodyTrend: "피부가 건조해지기 쉽고 호흡기가 예민한 체질입니다. 습도 조절이 매우 중요합니다.",
      wellnessGuide: {
        exercise: "심폐 기능 강화 운동(빠르게 걷기)",
        diet: "매운맛이 나는 채소(무, 배추), 흰색 음식(도라지, 배)",
        sleep: "가습기를 활용한 쾌적한 수면 환경",
        stress: "정리정돈이나 미니멀리즘 실천"
      },
      dailyRhythm: {
        focusTime: "오후 3시 ~ 5시",
        restTime: "오전 7시 ~ 8시",
        habits: ["따뜻한 차 마시기", "코 세척", "심호흡 훈련"]
      }
    },
    {
      summary: `${data.name}님은 유연하고 지혜로운 '수(水)'의 리듬을 가지고 있습니다. 적응력이 뛰어나며 깊은 사고력과 강한 생명력을 지닌 에너지 패턴입니다.`,
      balanceAnalysis: "수(水)의 기운은 신장과 방광, 그리고 뼈 건강과 연관됩니다. 냉해지기 쉬운 기운이므로 토(土)의 따뜻한 흙으로 에너지를 가두어 활용해야 합니다.",
      hearingGuide: {
        content: "수 기운은 한의학적으로 귀와 직접 연결되어 있습니다. 수 기운의 관리는 노인성 난청 예방의 핵심입니다.",
        tips: ["낮은 저음의 음악", "귀 주변 지압", "충분한 수분 섭취", "추운 환경 피하기"]
      },
      bodyTrend: "하체가 차가워지기 쉽고 피로를 쉽게 느낄 수 있는 체질입니다. 체온 유지가 필수입니다.",
      wellnessGuide: {
        exercise: "근력 운동, 스쿼트",
        diet: "짠맛이 나는 해조류, 검은색 음식(검은콩, 흑미)",
        sleep: "충분한 수면 시간 확보",
        stress: "반신욕이나 족욕"
      },
      dailyRhythm: {
        focusTime: "오후 5시 ~ 7시",
        restTime: "오후 11시 ~ 오전 1시",
        habits: ["족욕 15분", "검은콩 두유 섭취", "허리 스트레칭"]
      }
    }
  ];

  const result = reports[elementInfo.index];

  return {
    ...result,
    disclaimer: "이 분석은 전통적인 웰니스 개념을 기반으로 한 생활 가이드이며 의료 진단을 대체하지 않습니다."
  };
}

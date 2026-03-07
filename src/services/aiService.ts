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

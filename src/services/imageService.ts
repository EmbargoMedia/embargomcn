import { GoogleGenAI } from "@google/genai";

async function generateLandingImage() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: "A realistic, high-quality, bright portrait photograph of a woman's face, with a clear and detailed focus on her ear. Professional medical wellness photography style, natural lighting, clear skin texture, elegant and approachable. Not a silhouette, not abstract.",
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
        },
      },
    });

    for (const part of response.candidates![0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Landing image generation error:", error);
  }
  return null;
}

export { generateLandingImage };

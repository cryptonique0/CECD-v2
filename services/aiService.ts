import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Incident } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface PredictionResult {
  category: string;
  severity: string;
  confidence: number;
  reasoning: string;
  guidance: string[];
  translation?: string;
  detectedLanguage?: string;
}

export interface ResponsePlan {
  priority: string;
  steps: string[];
  requiredSkills: string[];
  estimatedResources: string;
  riskAssessment: string;
}

export interface ResolvedAddress {
  address: string;
  mapsUrl?: string;
}

// Singleton state for the assistant
let activeChatSession: Chat | null = null;
let currentContextId: string | null = null;

export const aiService = {
  conversationHistory: [] as { role: 'user' | 'model', parts: [{ text: string }] }[],

  async predictIncident(description: string): Promise<PredictionResult> {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze this emergency incident description. It could be in any global language.
      Classification instruction:
      1. Detect the language.
      2. If not English, provide a clear English translation.
      3. Classify into categories: Medical, Fire, Flood, Storm, Earthquake, Security, Theft, PublicHealth, Hazard, Kidnapping, Other.
      4. Assess severity: Low, Medium, High, Critical.
      5. Provide reasoning and immediate safety guidance based on global best practices.
      
      Incident: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            severity: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            guidance: { type: Type.ARRAY, items: { type: Type.STRING } },
            translation: { type: Type.STRING },
            detectedLanguage: { type: Type.STRING }
          },
          required: ["category", "severity", "confidence", "reasoning", "guidance", "detectedLanguage"]
        }
      }
    });

    return response.data;
  }
};

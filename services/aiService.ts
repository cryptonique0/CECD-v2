
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
        thinkingConfig: { thinkingBudget: 4000 },
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

    try {
      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      throw new Error("AI analysis service returned an invalid format.");
    }
  },

  async getAddressFromCoords(lat: number, lng: number): Promise<ResolvedAddress> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite-latest",
        contents: `Precisely identify the exact human-readable address, building name, or specific street intersection for coordinates lat: ${lat}, lng: ${lng}.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: lat,
                longitude: lng
              }
            }
          }
        },
      });

      const address = response.text?.trim() || "Active Sector";
      
      const mapsUrl = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.find(
        (chunk: any) => chunk.maps?.uri
      )?.maps?.uri;

      return { address, mapsUrl };
    } catch (e) {
      console.error("Geocoding error:", e);
      return { address: "Active Sector" };
    }
  },

  async generateResponsePlan(incidentTitle: string, description: string): Promise<ResponsePlan> {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Generate a detailed tactical response plan for: ${incidentTitle}. This is a global coordination effort. Details: ${description}`,
      config: {
        thinkingConfig: { thinkingBudget: 8000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedResources: { type: Type.STRING },
            riskAssessment: { type: Type.STRING }
          },
          required: ["priority", "steps", "requiredSkills", "estimatedResources", "riskAssessment"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async getAiChatResponse(message: string, incidentContext?: Incident): Promise<string> {
    const contextId = incidentContext?.id || "global";
    
    // Reset session if the incident context has changed
    if (contextId !== currentContextId) {
      activeChatSession = null;
      currentContextId = contextId;
    }

    if (!activeChatSession) {
      let systemInstruction = "You are the CECD Global Emergency Assistant. Provide actionable safety advice for a global audience. Maintain a professional, calm, and directive tone. Be aware of varying geopolitical contexts but prioritize human life and immediate safety protocols. Keep responses concise and focused on tactical utility.";
      
      if (incidentContext) {
        systemInstruction += ` You are currently assisting with a specific incident titled "${incidentContext.title}" categorized as ${incidentContext.category}. Focus your advice on this specific situation.`;
      }

      activeChatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemInstruction
        },
      });
    }

    try {
      const response = await activeChatSession.sendMessage({ message });
      return response.text || "I am currently processing high-priority data. Please stand by.";
    } catch (err) {
      console.error("Chat error:", err);
      activeChatSession = null;
      throw err;
    }
  }
};

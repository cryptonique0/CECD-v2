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

// Retry logic for API calls
async function retryWithBackoff(
  fn: () => Promise<any>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error('Max retry attempts exceeded');
}

export const aiService = {
  conversationHistory: [] as { role: 'user' | 'model', parts: [{ text: string }] }[],

  async predictIncident(description: string): Promise<PredictionResult> {
    // Validate input
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new Error('Description is required and must be a non-empty string');
    }

    try {
      const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
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
      }, 3, 1000);

      // Validate response structure
      if (!response?.data) {
        throw new Error('Invalid response from AI service');
      }

      const result = response.data as PredictionResult;

      // Ensure required fields exist
      return {
        category: result.category || 'Other',
        severity: result.severity || 'Medium',
        confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
        reasoning: result.reasoning || 'Unable to determine reasoning',
        guidance: Array.isArray(result.guidance) ? result.guidance : ['Contact emergency services immediately'],
        translation: result.translation,
        detectedLanguage: result.detectedLanguage || 'en'
      };
    } catch (error: any) {
      console.error('[AI Service] Prediction failed:', error);
      // Return fallback response instead of throwing
      return {
        category: 'Other',
        severity: 'High',
        confidence: 0.3,
        reasoning: 'AI service unavailable - manual review required',
        guidance: ['Contact emergency services', 'Provide location to responders'],
        detectedLanguage: 'unknown'
      };
    }
  },

  async getAiChatResponse(message: string, context?: Incident): Promise<string> {
    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return 'Please provide a valid message.';
    }

    try {
      const contextStr = context ? `Context: Incident ${context.id} - ${context.title}` : '';
      
      const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: `${contextStr}\nUser: ${message}\n\nRespond concisely with tactical advice.`
        });
      }, 2, 500);

      if (!response?.text) {
        return 'Service temporarily unavailable. Please retry.';
      }

      return response.text;
    } catch (error: any) {
      console.error('[AI Service] Chat response failed:', error);
      return 'Unable to generate response. Please try again.';
    }
  },

  async getAddressFromCoords(lat: number, lng: number): Promise<ResolvedAddress> {
    // Validate coordinates
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error('Invalid coordinates provided');
    }

    try {
      const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: `Convert GPS coordinates ${lat}, ${lng} to human-readable address. Return as JSON with "address" field.`
        });
      }, 2, 500);

      if (!response?.text) {
        return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
      }

      try {
        const parsed = JSON.parse(response.text);
        return { address: parsed.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
      } catch {
        return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
      }
    } catch (error: any) {
      console.error('[AI Service] Address resolution failed:', error);
      return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    }
  }
};

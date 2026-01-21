
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

export const getGeminiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const findHalalRestaurants = async (query: string, location?: { lat: number, lng: number }) => {
  const ai = getGeminiClient();
  const prompt = `Find Halal restaurants: ${query}`;
  
  const config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.lat,
          longitude: location.lng
        }
      }
    };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config
  });

  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const analyzeIngredients = async (imageData: string) => {
  const ai = getGeminiClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: imageData, mimeType: 'image/jpeg' } },
        { text: "Analyze the ingredients list in this image for Halal compliance. Identify any Haram or Mushbooh (doubtful) ingredients. Be specific." }
      ]
    },
    config: {
      systemInstruction: SYSTEM_PROMPT
    }
  });

  return response.text;
};

export const chatWithAI = async (message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  const ai = getGeminiClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_PROMPT
    },
    history: history
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

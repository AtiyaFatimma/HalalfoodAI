import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_PROMPT =
  "You are HalalFind AI, a professional assistant that analyzes halal status, ingredients, and restaurants.";

export const getGeminiClient = () => {
  if (!import.meta.env.VITE_API_KEY) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
};

export const findHalalRestaurants = async (query: string, location?: { lat: number, lng: number }) => {
  const ai = getGeminiClient();
  const locationContext = location ? ` near coordinates ${location.lat}, ${location.lng}` : "";
  
  const prompt = `Quick search: "${query}"${locationContext}. List the top 3-5 Halal places. For the summary, use **bold text** for important keywords. Return JSON only.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            restaurants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  address: { type: Type.STRING },
                  cuisine: { type: Type.STRING },
                  halalStatus: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["name", "address", "cuisine", "halalStatus"]
              }
            }
          },
          required: ["summary", "restaurants"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      summary: data.summary || "Top verified results found for your search:",
      restaurants: data.restaurants || [],
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error: any) {
    console.error("Search error:", error);
    throw new Error("Fast search failed. Try a broader location or food type.");
  }
};

export const analyzeIngredients = async (imageData: string) => {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: imageData, mimeType: 'image/jpeg' } },
          { text: "Examine this product label or barcode. Identify Halal/Haram status. Use **bold** for ingredient names and the final Verdict. Be concise and professional." }
        ]
      },
      config: { systemInstruction: SYSTEM_PROMPT }
    });
    return response.text;
  } catch (error) {
    return "Verification error. Please ensure the label is clearly visible under good lighting.";
  }
};

export const chatWithAI = async (message: string, history: any[]) => {
  const ai = getGeminiClient();
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { 
        systemInstruction: SYSTEM_PROMPT + " IMPORTANT: Use professional formatting with **bold text** for key terms, ingredients, or Islamic rulings."
      },
      history: history
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    return "Expert service is currently busy. Please try asking your question again in a moment.";
  }
};

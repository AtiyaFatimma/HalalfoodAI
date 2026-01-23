import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are HalalFind AI, a professional assistant specializing in halal food, ingredients, and Islamic dietary guidelines. 
Provide accurate, helpful information about:
- Halal restaurants and food establishments
- Ingredient analysis (halal/haram status)
- Islamic dietary laws and requirements
- Food certification and verification

Be professional, concise, and use **bold text** for important terms.`;

export const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_API_KEY is missing. Please add it to your environment variables.");
  }
  return new GoogleGenerativeAI(apiKey);
};

// Find halal restaurants
export const findHalalRestaurants = async (query: string) => {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT
  });

  const prompt = `Search for halal restaurants based on this query: "${query}"

Please provide:
1. A brief summary of halal dining options for this search
2. List 3-5 specific halal restaurant recommendations with:
   - Restaurant name
   - Approximate location/area
   - Type of cuisine
   - Halal certification status (if known)
   - Brief description

Format your response professionally with **bold** for restaurant names and key terms.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    return {
      summary: text,
      error: null
    };
  } catch (error: any) {
    console.error("Restaurant search error:", error);
    return {
      summary: null,
      error: "Unable to search for restaurants. Please check your internet connection and try again."
    };
  }
};

// Analyze ingredients from image
export const analyzeIngredients = async (imageData: string, mimeType: string = 'image/jpeg') => {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT
  });

  const prompt = `Analyze this product image/label for halal status.

Please examine:
1. Ingredient list
2. Any certifications or halal symbols
3. Potential haram ingredients (pork, alcohol, non-halal gelatin, etc.)
4. QR code information if visible

Provide:
- **Verdict**: HALAL, HARAM, or DOUBTFUL
- **Key Ingredients**: List concerning ingredients in **bold**
- **Explanation**: Brief reasoning for your verdict
- **Recommendation**: What the user should do

Be professional and concise.`;

  try {
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Ingredient analysis error:", error);
    return "**Analysis Failed**\n\nUnable to analyze the image. Please ensure:\n- The image is clear and well-lit\n- Ingredient labels are visible\n- The file size is not too large\n\nTry taking another photo.";
  }
};

// Chat with AI
export const chatWithAI = async (message: string, history: Array<{role: string, content: string}>) => {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT + "\n\nUse **bold text** for key Islamic terms, ingredients, and important points."
  });

  try {
    // Convert history to Gemini format
    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    return response.text();
  } catch (error: any) {
    console.error("Chat error:", error);
    return "I'm having trouble responding right now. Please try again in a moment.";
  }
};

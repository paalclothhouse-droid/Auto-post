
import { GoogleGenAI } from "@google/genai";

export async function generateNewCaption(originalCaption: string, userInstruction: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const prompt = `
    You are a viral social media manager. I will give you a caption from an Instagram post and some instructions. 
    Your job is to rewrite the caption to be highly engaging, use appropriate emojis, and follow the specific tone requested.
    
    ORIGINAL CAPTION: "${originalCaption}"
    USER INSTRUCTION: "${userInstruction}"
    
    Return ONLY the new caption text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Engaging content coming soon! 🚀 #viral #trending";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Check out this amazing content! 🔥 #repost";
  }
}

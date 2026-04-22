import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export async function enhancePrompt(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are an expert prompt engineer for AI image generators. Your task is to take a short, simple prompt and transform it into a highly detailed, descriptive, and artistic prompt that will result in a stunning visual. Return ONLY the enhanced prompt text.",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });

  return response.text || prompt;
}

// Optimized estimation: uses local logic instead of an API call to save quota and time
export function estimateTimeLocal(prompt: string, model: string): number {
  const isCreative = model.includes('creative') || model.includes('3.1');
  const baseTime = isCreative ? 20 : 12; // Increased base times for more realism
  const complexity = Math.min(prompt.split(' ').length / 3, 10); // Scale complexity better
  return Math.floor(baseTime + complexity);
}

export async function generateImage(prompt: string, model: string = 'gemini-2.5-flash-image', aspectRatio: string = '1:1'): Promise<string> {
  const response = await ai.models.generateContent({
    model: model as any,
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
      },
    },
  });

  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts;
  
  if (!parts) {
    const finishReason = candidate?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error("The image could not be generated due to safety filters. Please try a different or more neutral prompt.");
    }
    throw new Error("The AI engine returned an empty response. This might be due to a safety filter or quota limit.");
  }

  let errorText = "";
  for (const part of parts) {
    if (part.inlineData) {
      const base64EncodeString: string = part.inlineData.data;
      return `data:image/png;base64,${base64EncodeString}`;
    }
    if (part.text) {
      errorText = part.text;
    }
  }

  if (errorText) {
    throw new Error(`The AI engine declined the request: ${errorText}`);
  }

  throw new Error("No image data generated. Try simplifying your prompt or check your daily limit.");
}

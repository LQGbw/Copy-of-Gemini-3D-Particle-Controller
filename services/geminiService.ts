
import { GoogleGenAI, Type } from "@google/genai";
import { GestureType, AnalysisResult } from "../types";

// Always use the recommended model for basic vision analysis tasks
const MODEL_NAME = "gemini-3-flash-preview";

export const analyzeFrame = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // Create a new instance right before the call to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Remove header if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    // Using generateContent with an image part and a text prompt
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Analyze the hand gesture in this image. 
            Identify if the hand is:
            1. 'OPEN_PALM' (Hand fully open)
            2. 'CLOSED_FIST' (Hand closed tight)
            3. 'POINTING' (Index finger pointing)
            4. 'VICTORY' (V-sign/Peace sign)
            5. 'NONE' (No hand or unclear)
            
            Return the result in JSON format.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gesture: {
              type: Type.STRING,
              // Using literal strings corresponding to the GestureType enum
              enum: [
                GestureType.OpenPalm,
                GestureType.ClosedFist,
                GestureType.Pointing,
                GestureType.Victory,
                GestureType.None
              ],
              description: "The detected hand gesture classification."
            },
            description: {
              type: Type.STRING,
              description: "A short description of what is seen."
            }
          },
          required: ["gesture"]
        }
      }
    });

    // Extract text directly from the response object
    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text.trim()) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { gesture: GestureType.None, description: "Error processing frame" };
  }
};


import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini to categorize and refine a task description.
 * Now using gemini-3-flash-preview for structured JSON output as required for logic.
 */
export async function analyzeTaskRequest(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following help request from an elderly resident and suggest a category, title, and a refined professional description for a youth volunteer platform.
      
      Request: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { 
              type: Type.STRING,
              description: "Must be one of: Tech Support, Grocery Shopping, Garden Help, Companionship, Light Admin"
            },
            refinedDescription: { type: Type.STRING },
            suggestedCredits: { type: Type.NUMBER }
          },
          required: ["title", "category", "refinedDescription", "suggestedCredits"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
}

/**
 * Uses Gemini 2.5 with Maps Grounding to verify task locations or find nearby community spots.
 * This function handles the non-JSON requirement of the googleMaps tool.
 */
export async function getTaskLocationContext(locationQuery: string, lat?: number, lng?: number) {
  try {
    const config: any = {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
    };

    if (lat !== undefined && lng !== undefined) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide a very brief description of "${locationQuery}" and its accessibility for a local community service. Include specific details if it's a park, community center, or commercial hub.`,
      config
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapsLinks = groundingChunks
      .filter((chunk: any) => chunk.maps?.uri)
      .map((chunk: any) => ({
        uri: chunk.maps.uri,
        title: chunk.maps.title
      }));

    return {
      text: response.text,
      links: mapsLinks
    };
  } catch (error) {
    console.error("Gemini Maps Grounding Error:", error);
    return null;
  }
}

/**
 * Generates a summary of community impact based on task data.
 */
export async function generateImpactSummary(tasks: Task[]) {
  const taskSummary = tasks.map(t => `${t.category}: ${t.status}`).join(", ");
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on these community tasks: ${taskSummary}, write a short, inspiring 2-sentence paragraph for a city newsletter about the social impact of these intergenerational connections.`,
      config: {
        maxOutputTokens: 100
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Youth and elders are working together to build a stronger, more connected community through every shared task.";
  }
}

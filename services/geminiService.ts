
import { GoogleGenAI, Type } from "@google/genai";
import { AiProductInfo } from '../types';

const geminiService = {
  getProductInfoFromImage: async (base64Image: string, mimeType: string): Promise<AiProductInfo | null> => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      };

      const textPart = {
        text: "Analyze this image of a vape product. Identify its name, brand, category (e.g., Pods, E-Juice, Kits), flavor/variant, and size (e.g., 30ml, 2ml). Return the information in a structured JSON format. If a value is not clear, use 'N/A'.",
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "The primary name of the product.",
              },
              brand: {
                type: Type.STRING,
                description: "The brand of the product.",
              },
              category: {
                type: Type.STRING,
                description: "The product category (e.g., Pods, E-Juice, Kits).",
              },
              flavor: {
                type: Type.STRING,
                description: "The flavor or variant of the product.",
              },
              size: {
                type: Type.STRING,
                description: "The volume or size of the product (e.g., 30ml, 100ml, N/A).",
              },
            },
            required: ["name", "brand", "category", "flavor", "size"],
          },
        },
      });

      const jsonString = response.text.trim();
      const productInfo = JSON.parse(jsonString) as AiProductInfo;
      return productInfo;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return null;
    }
  },
};

export default geminiService;

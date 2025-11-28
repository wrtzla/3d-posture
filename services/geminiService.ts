import { GoogleGenAI, Type } from "@google/genai";
import { ShapeType } from "../types";

// Fallback math-based shapes if API is slow or unavailable
export const generateMathShape = (type: ShapeType, count: number): number[] => {
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    
    switch (type) {
      case ShapeType.SPHERE: {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.cbrt(Math.random()); 
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
        break;
      }
      case ShapeType.HEART: {
        // Heart shape parametric
        let t = Math.random() * Math.PI * 2;
        // Modified cardioid
        x = 16 * Math.pow(Math.sin(t), 3);
        y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        z = (Math.random() - 0.5) * 10;
        // Normalize roughly
        x /= 16; y /= 16; z /= 16;
        break;
      }
      case ShapeType.SATURN: {
         // Planet + Ring
         if (Math.random() > 0.4) {
             // Ring
             const theta = Math.random() * 2 * Math.PI;
             const rad = 0.6 + Math.random() * 0.4;
             x = rad * Math.cos(theta);
             z = rad * Math.sin(theta);
             y = (Math.random() - 0.5) * 0.1;
         } else {
             // Planet
             const theta = Math.random() * 2 * Math.PI;
             const phi = Math.acos(2 * Math.random() - 1);
             const r = Math.cbrt(Math.random()) * 0.4;
             x = r * Math.sin(phi) * Math.cos(theta);
             y = r * Math.sin(phi) * Math.sin(theta);
             z = r * Math.cos(phi);
         }
         break;
      }
      case ShapeType.FLOWER: {
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.random() * Math.PI;
        const r = 0.8 + 0.2 * Math.sin(5 * theta) * Math.sin(phi); // 5 petals
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi) * 0.5;
        break;
      }
      default: {
        // Cube fallback
        x = (Math.random() - 0.5) * 2;
        y = (Math.random() - 0.5) * 2;
        z = (Math.random() - 0.5) * 2;
      }
    }
    points.push(x, y, z);
  }
  return points;
};

export const getShapePoints = async (shape: ShapeType, count: number = 2000): Promise<number[]> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found, using fallback math shapes.");
    return generateMathShape(shape, count);
  }

  // Use math for simple shapes to save tokens/latency
  if ([ShapeType.SPHERE, ShapeType.CUBE, ShapeType.HEART].includes(shape)) {
      return generateMathShape(shape, count);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Generate a flat JSON array of numbers representing 3D coordinates [x, y, z, x, y, z...] for a point cloud representation of a "${shape}".
      
      Constraints:
      1. Exactly ${count} points (so ${count * 3} numbers).
      2. Coordinates must be normalized between -1.0 and 1.0.
      3. Distribute points to clearly define the volume and surface of the shape.
      4. For "Buddha", "Statue" or "Face", ensure the density highlights facial features or posture.
      5. For "Flower", create petals and a center.
      6. Return ONLY the JSON array. Do not use Markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER }
        }
      }
    });

    let rawText = response.text;
    if (!rawText) throw new Error("Empty response from AI");
    
    // Clean up markdown code blocks if present (common issue with LLM JSON output)
    if (rawText.includes("```")) {
      rawText = rawText.replace(/```\w*\n?/g, "").replace(/```/g, "").trim();
    }

    const points = JSON.parse(rawText);
    
    if (!Array.isArray(points) || points.length === 0) {
      throw new Error("Invalid points format");
    }

    return points;
  } catch (error) {
    console.error("Gemini generation failed, falling back to math:", error);
    return generateMathShape(shape, count);
  }
};
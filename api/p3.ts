import { GoogleGenAI } from "@google/genai";
export default function handler(_req: any, res: any) {
  res.status(200).json({ genai: typeof GoogleGenAI });
}

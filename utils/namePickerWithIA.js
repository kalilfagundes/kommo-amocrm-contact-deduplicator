import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function analyzeNamesWithIA(names) {
    const query = `
    Analyze the following names and return only the most complete and correct name.
    ${names}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
    });

    return response.text;
}
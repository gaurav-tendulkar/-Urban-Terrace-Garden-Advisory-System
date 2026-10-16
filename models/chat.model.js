const { GoogleGenAI } = require('@google/genai');
const { systemInstruction } = require('../config/prompt.config');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateChatResponse = async (message, history) => {
    const contents = history ? history : [];
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return response.text;
};

module.exports = {
    generateChatResponse
};

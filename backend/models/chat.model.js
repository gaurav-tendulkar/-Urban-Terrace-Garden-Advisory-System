const { GoogleGenAI } = require('@google/genai');
const { systemInstruction } = require('../config/prompt.config');

function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        const error = new Error('GEMINI_API_KEY is not configured');
        error.code = 'GEMINI_API_KEY_MISSING';
        throw error;
    }

    return new GoogleGenAI({ apiKey });
}

const generateChatResponse = async (message, history) => {
    const ai = getGeminiClient();
    const contents = Array.isArray(history) ? [...history] : [];
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    if (typeof response.text !== 'string' || !response.text.trim()) {
        const error = new Error('Gemini returned an empty response');
        error.code = 'GEMINI_EMPTY_RESPONSE';
        throw error;
    }

    return response.text;
};

module.exports = {
    generateChatResponse,
};

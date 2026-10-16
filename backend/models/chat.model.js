const { GoogleGenAI, Type } = require('@google/genai');
const { systemInstruction } = require('../config/prompt.config');

const supportedPlants = ['tomato', 'carrot', 'sunflower', 'lettuce'];

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

const generateGardenPlan = async ({ area, sunlight, climate, budget }) => {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [{
                text: `Create a practical terrace garden plan for:
- Terrace area: ${area} square meters
- Sunlight: ${sunlight}
- Growing climate: ${climate}
- Total budget: INR ${budget}

Keep the plan realistic for an Indian urban terrace and within budget. Recommend only plants that are easy to grow in containers. Use only the supported plants in the plant recommendations. Choose modest quantities that fit the area and budget. Explain placement, containers, and a basic care approach in the overview.`,
            }],
        }],
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    overview: { type: Type.STRING },
                    plants: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                plant: { type: Type.STRING, enum: supportedPlants },
                                quantity: { type: Type.INTEGER },
                                reason: { type: Type.STRING },
                            },
                            required: ['plant', 'quantity', 'reason'],
                        },
                    },
                },
                required: ['overview', 'plants'],
            },
        },
    });

    if (typeof response.text !== 'string' || !response.text.trim()) {
        const error = new Error('Gemini returned an empty garden plan');
        error.code = 'GEMINI_EMPTY_RESPONSE';
        throw error;
    }

    let plan;
    try {
        plan = JSON.parse(response.text);
    } catch (cause) {
        const error = new Error('Gemini returned an invalid garden plan');
        error.code = 'GEMINI_INVALID_PLAN';
        error.cause = cause;
        throw error;
    }

    if (
        typeof plan.overview !== 'string' ||
        !plan.overview.trim() ||
        !Array.isArray(plan.plants) ||
        plan.plants.length === 0 ||
        !plan.plants.every((item) => (
            item &&
            supportedPlants.includes(item.plant) &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.quantity <= 4 &&
            typeof item.reason === 'string' &&
            item.reason.trim()
        )) ||
        new Set(plan.plants.map((item) => item.plant)).size !== plan.plants.length ||
        plan.plants.reduce((count, item) => count + item.quantity, 0) > 12
    ) {
        const error = new Error('Gemini returned a garden plan with unsupported plant recommendations');
        error.code = 'GEMINI_INVALID_PLAN';
        throw error;
    }

    return plan;
};

module.exports = {
    generateChatResponse,
    generateGardenPlan,
};

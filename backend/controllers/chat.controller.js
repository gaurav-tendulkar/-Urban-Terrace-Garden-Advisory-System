const chatModel = require('../models/chat.model');

const handleModelError = (error, res) => {
    console.error('Error with Gemini API:', error);

    if (error.code === 'GEMINI_API_KEY_MISSING') {
        return res.status(503).json({
            error: 'The garden advisor is not configured. Set GEMINI_API_KEY in backend/.env and restart the backend.',
        });
    }

    return res.status(502).json({
        error: 'The garden advisor could not get a response right now. Please try again shortly.',
    });
};

const handleChatRequest = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: 'A non-empty message is required.' });
        }

        if (history !== undefined && !Array.isArray(history)) {
            return res.status(400).json({ error: 'Chat history must be an array.' });
        }

        const replyOptions = await chatModel.generateChatResponse(message, history);

        res.json({ reply: replyOptions });
    } catch (error) {
        return handleModelError(error, res);
    }
};

const handleGardenPlanRequest = async (req, res) => {
    try {
        const { area, sunlight, climate, budget } = req.body || {};
        const sunlightOptions = ['full sun', 'partial sun', 'shade'];
        const climateOptions = ['warm', 'temperate', 'cold'];

        if (!Number.isFinite(area) || area < 0.5 || area > 1000) {
            return res.status(400).json({ error: 'Terrace area must be between 0.5 and 1,000 square meters.' });
        }
        if (!sunlightOptions.includes(sunlight)) {
            return res.status(400).json({ error: 'Choose full sun, partial sun, or shade.' });
        }
        if (!climateOptions.includes(climate)) {
            return res.status(400).json({ error: 'Choose a valid growing climate.' });
        }
        if (!Number.isSafeInteger(budget) || budget < 1000 || budget > 10000000) {
            return res.status(400).json({ error: 'Budget must be between INR 1,000 and INR 10,000,000.' });
        }

        const plan = await chatModel.generateGardenPlan({ area, sunlight, climate, budget });
        return res.json({ plan });
    } catch (error) {
        return handleModelError(error, res);
    }
};

module.exports = {
    handleChatRequest,
    handleGardenPlanRequest,
};

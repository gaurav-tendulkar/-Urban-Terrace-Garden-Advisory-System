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

module.exports = {
    handleChatRequest,
};

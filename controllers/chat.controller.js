const chatModel = require('../models/chat.model');

const handleChatRequest = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const replyOptions = await chatModel.generateChatResponse(message, history);

        res.json({ reply: replyOptions });
    } catch (error) {
        console.error('Error with Gemini API:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};

module.exports = {
    handleChatRequest
};

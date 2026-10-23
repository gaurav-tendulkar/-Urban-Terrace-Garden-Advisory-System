const chatModel = require('../models/chat.model');
const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_ENTRIES = 40;
const MAX_HISTORY_ENTRY_LENGTH = 12000;
const MAX_HISTORY_TEXT_LENGTH = 24000;

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
        if (message.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({ error: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
        }

        if (history !== undefined && !Array.isArray(history)) {
            return res.status(400).json({ error: 'Chat history must be an array.' });
        }

        const chatHistory = history ?? [];
        if (chatHistory.length > MAX_HISTORY_ENTRIES) {
            return res.status(400).json({ error: `Chat history is limited to ${MAX_HISTORY_ENTRIES} entries.` });
        }

        let historyTextLength = 0;
        const validHistory = chatHistory.every((entry) => {
            if (
                !entry
                || !['user', 'model'].includes(entry.role)
                || !Array.isArray(entry.parts)
                || entry.parts.length !== 1
                || typeof entry.parts[0]?.text !== 'string'
            ) {
                return false;
            }
            historyTextLength += entry.parts[0].text.length;
            return entry.parts[0].text.length <= MAX_HISTORY_ENTRY_LENGTH
                && historyTextLength <= MAX_HISTORY_TEXT_LENGTH;
        });
        if (!validHistory) {
            return res.status(400).json({ error: 'Chat history contains invalid or excessive content.' });
        }

        const replyOptions = await chatModel.generateChatResponse(message, chatHistory);

        res.json({ reply: replyOptions });
    } catch (error) {
        return handleModelError(error, res);
    }
};

module.exports = {
    handleChatRequest,
};

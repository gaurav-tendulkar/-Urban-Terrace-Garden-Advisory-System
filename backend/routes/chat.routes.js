const express = require('express');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

const chatRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many chat requests. Please try again later.' },
});

router.post('/', chatRateLimit, chatController.handleChatRequest);

module.exports = router;

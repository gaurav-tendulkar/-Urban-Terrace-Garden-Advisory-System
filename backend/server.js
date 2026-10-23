require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const path = require('path');
const chatRoutes = require('./routes/chat.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');

app.set('trust proxy', 1);

app.use((req, res, next) => {
    const accept = req.get('accept') || '';
    if (req.method === 'GET' && accept.includes('text/html')) {
        console.log(`[visitor] ${new Date().toISOString()} ${req.ip}`);
    }
    next();
});

app.use(express.json({ limit: '64kb' }));
app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

if (require('fs').existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    app.use((req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        res.sendFile(path.join(frontendBuild, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const chatRoutes = require('./routes/chat.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendBuild = path.join(__dirname, '..', 'frontend', 'dist');

app.use(cors());
app.use(express.json());
app.use('/api/chat', chatRoutes);

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

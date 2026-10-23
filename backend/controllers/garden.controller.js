const gardenModel = require('../models/garden.model');

async function listDesigns(req, res) {
    try {
        res.json({ designs: await gardenModel.listDesigns() });
    } catch (error) {
        console.error('Could not read garden designs:', error);
        res.status(500).json({ error: 'Could not read garden designs from the server.' });
    }
}

async function saveDesigns(req, res) {
    try {
        const designs = await gardenModel.saveDesigns(req.body?.designs);
        res.json({ designs });
    } catch (error) {
        console.error('Could not save garden designs:', error);
        const status = error.code === 'GARDEN_DESIGN_INVALID' ? 400 : 500;
        res.status(status).json({ error: status === 400 ? error.message : 'Could not save garden designs to the server.' });
    }
}

module.exports = {
    listDesigns,
    saveDesigns,
};

const express = require('express');
const gardenController = require('../controllers/garden.controller');

const router = express.Router();

router.get('/', gardenController.listDesigns);
router.put('/', gardenController.saveDesigns);

module.exports = router;

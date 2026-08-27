const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// All endpoints prefixed with /api/ai
router.post('/predict-crop', aiController.predictCrop);
router.post('/detect-disease', aiController.detectDisease);
router.post('/predict-price', aiController.predictPrice);
router.post('/advisory', aiController.getAdvisory);

module.exports = router;

const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/summary', dashboardController.getSummary);
router.get('/analytics', dashboardController.getAnalytics);
router.get('/insights', dashboardController.getInsights);

module.exports = router;

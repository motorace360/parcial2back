const express = require('express');
const router = express.Router();
const { generateQuestions, verifyAnswers } = require('../controllers/questionController');

router.post('/generate', generateQuestions);
router.post('/verify', verifyAnswers);

module.exports = router;

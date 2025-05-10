const Question = require('../models/Question');
const OpenAI = require('openai');
const mongoose = require('mongoose');
const { executeWithRetry } = require('../utils/dbUtils');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const generateQuestions = async (req, res) => {
  const { topic } = req.body;

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection is not ready');
    }

    // Validate topic
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Invalid topic provided' });
    }

    const prompt = `
      Crea 5 preguntas de opción múltiple sobre el tema "${topic}". 
      Cada pregunta debe tener 4 opciones (A, B, C, D) y especifica cuál es la correcta.
      Las preguntas deben ser desafiantes y educativas.
      Devuelve la respuesta en formato JSON con este formato:
      [
        {
          "question": "¿Pregunta 1?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "B"
        }
      ]
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
      timeout: 15000
    });

    const response = completion.choices[0].message.content;
    let questions;
    
    try {
      questions = JSON.parse(response);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return res.status(500).json({ error: 'Error processing questions' });
    }

    const newSet = new Question({ topic, questions });
    await newSet.save();

    res.status(200).json({
      success: true,
      questions: questions
    });

  } catch (error) {
    console.error('Error:', error);

    if (error.message.includes('Database connection')) {
      return res.status(503).json({ 
        error: 'Database service unavailable. Please try again in a few moments.' 
      });
    }

    if (error.message.includes('OpenAI')) {
      return res.status(503).json({ 
        error: 'Question generation service temporarily unavailable' 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const verifyAnswers = async (req, res) => {
  try {
    const { questions, userAnswers } = req.body;
    
    const results = {
      correct: 0,
      incorrect: 0,
      details: []
    };

    questions.forEach((q, index) => {
      const isCorrect = q.correctAnswer === userAnswers[index];
      results.details.push({
        isCorrect,
        correctAnswer: q.correctAnswer
      });
      
      if (isCorrect) {
        results.correct++;
      } else {
        results.incorrect++;
      }
    });

    // Save game results
    const gameSession = new Question({
      topic: questions[0].topic,
      questions,
      gameResults: [{
        userAnswers,
        correctCount: results.correct,
        incorrectCount: results.incorrect
      }]
    });
    await gameSession.save();

    res.json(results);
  } catch (error) {
    console.error('Error verifying answers:', error);
    res.status(500).json({ error: 'Error al verificar respuestas' });
  }
};

module.exports = { generateQuestions, verifyAnswers };

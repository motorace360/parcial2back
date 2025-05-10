const Question = require('../models/Question');
const OpenAI = require('openai');
const { executeWithRetry } = require('../utils/dbUtils');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const generateQuestions = async (req, res) => {
  const { topic } = req.body;

  const prompt = `
Crea 5 preguntas de opción múltiple sobre el tema "${topic}". 
Cada pregunta debe tener 4 opciones (A, B, C, D) y especifica cuál es la correcta.
Devuelve la respuesta en formato JSON con este formato:
[
  {
    "question": "¿Pregunta 1?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "B"
  },
  ...
]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;
    const questions = JSON.parse(response);

    const newSet = new Question({ topic, questions });
    await executeWithRetry(async () => await newSet.save());

    res.status(200).json(newSet);
  } catch (error) {
    console.error('❌ Error generando preguntas:', error.message);

    if (error.status === 429) {
      res.status(429).json({ error: 'Has excedido tu cuota de uso de OpenAI. Por favor, revisa tu plan y detalles de facturación.' });
    } else if (error.message.includes('timed out')) {
      res.status(503).json({ error: 'Error de conexión con la base de datos. Por favor, intenta nuevamente.' });
    } else {
      res.status(500).json({ error: 'Error generando preguntas' });
    }
  }
};

module.exports = { generateQuestions };

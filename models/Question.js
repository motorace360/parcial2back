const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    topic: String,
    questions: [
        {
            question: String,
            options: [String],
            correctAnswer: String
        }
    ],
    gameResults: [
        {
            userAnswers: Map,
            correctCount: Number,
            incorrectCount: Number,
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);

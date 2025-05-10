const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    topic: String,
    questions: [
        {
            question: String,
            options: [String],
            correctAnswer: String
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);

const mongoose = require('mongoose');

const quizReportSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  takenAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // 👈 this is key for populate to work
    required: true
  }
});

module.exports = mongoose.model('QuizReport', quizReportSchema);

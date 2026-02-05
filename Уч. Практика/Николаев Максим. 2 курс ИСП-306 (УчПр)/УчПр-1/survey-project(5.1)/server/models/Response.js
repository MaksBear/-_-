const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
    surveyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Survey',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        answer: {
            type: Number,
            required: true
        }
    }],
    completedAt: {
        type: Date,
        default: Date.now
    }
});

// Индекс для предотвращения повторных ответов
ResponseSchema.index({ surveyId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Response', ResponseSchema);
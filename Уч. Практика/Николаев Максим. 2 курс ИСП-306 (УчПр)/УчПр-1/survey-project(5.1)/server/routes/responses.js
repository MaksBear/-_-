const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Отправить ответы на опрос
router.post('/submit', auth('user'), [
    body('surveyId').notEmpty().withMessage('Survey ID is required'),
    body('answers').isArray().withMessage('Answers must be an array'),
    body('answers.*.questionId').notEmpty().withMessage('Question ID is required'),
    body('answers.*.answer').isInt({ min: 0, max: 3 }).withMessage('Answer must be between 0 and 3')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { surveyId, answers } = req.body;

        // Проверяем, существует ли опрос
        const survey = await Survey.findById(surveyId);
        if (!survey || !survey.isActive) {
            return res.status(404).json({ error: 'Survey not found or not active' });
        }

        // Проверяем, что пользователь еще не отвечал на этот опрос
        const existingResponse = await Response.findOne({
            surveyId,
            userId: req.user.id
        });

        if (existingResponse) {
            return res.status(400).json({ error: 'You have already completed this survey' });
        }

        // Проверяем, что все вопросы существуют
        for (const answer of answers) {
            const questionExists = survey.questions.some(
                q => q._id.toString() === answer.questionId
            );
            if (!questionExists) {
                return res.status(400).json({ error: `Question ${answer.questionId} not found` });
            }
        }

        // Создаем запись об ответах
        const response = new Response({
            surveyId,
            userId: req.user.id,
            answers
        });

        await response.save();

        // Обновляем статистику в опросе
        for (const answer of answers) {
            const question = survey.questions.id(answer.questionId);
            if (question) {
                question.answers.push({
                    userId: req.user.id,
                    answer: answer.answer
                });
            }
        }

        await survey.save();

        // Получаем статистику для ответа
        const stats = survey.questions.map(question => {
            const userAnswer = answers.find(a => a.questionId === question._id.toString());
            const totalAnswers = question.answers.length;
            const userAnswerCount = question.answers.filter(a => a.answer === userAnswer?.answer).length;
            const percentage = totalAnswers > 0 ? ((userAnswerCount / totalAnswers) * 100).toFixed(1) : 0;

            return {
                questionId: question._id,
                questionText: question.text,
                userAnswer: userAnswer?.answer,
                selectedOption: userAnswer ? question.options[userAnswer.answer]?.text : null,
                totalAnswers,
                userAnswerCount,
                percentage
            };
        });

        res.json({
            message: 'Survey completed successfully',
            stats,
            responseId: response._id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Получить ответы пользователя
router.get('/my-responses', auth('user'), async (req, res) => {
    try {
        const responses = await Response.find({ userId: req.user.id })
            .populate('surveyId', 'title description')
            .sort({ completedAt: -1 });

        res.json(responses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Получить конкретный ответ
router.get('/:id', auth(), async (req, res) => {
    try {
        const response = await Response.findById(req.params.id)
            .populate('surveyId', 'title questions')
            .populate('userId', 'name email');

        if (!response) {
            return res.status(404).json({ error: 'Response not found' });
        }

        // Проверяем доступ
        if (req.user.userType === 'user' && response.userId._id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
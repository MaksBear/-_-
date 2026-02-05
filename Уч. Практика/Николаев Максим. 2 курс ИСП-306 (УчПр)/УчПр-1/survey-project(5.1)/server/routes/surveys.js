const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Получить все опросы (для администратора)
router.get('/admin', auth('admin'), async (req, res) => {
    try {
        const surveys = await Survey.find({ createdBy: req.user.id })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(surveys);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Получить активные опросы (для пользователей)
router.get('/active', auth('user'), async (req, res) => {
    try {
        // Находим опросы, на которые пользователь еще не отвечал
        const userResponses = await Response.find({ userId: req.user.id });
        const completedSurveyIds = userResponses.map(r => r.surveyId.toString());

        const surveys = await Survey.find({
            isActive: true,
            _id: { $nin: completedSurveyIds }
        }).select('title description questions')
          .sort({ createdAt: -1 });

        res.json(surveys);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Получить конкретный опрос
router.get('/:id', auth(), async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);
        
        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Проверяем доступ
        if (req.user.userType === 'user' && !survey.isActive) {
            return res.status(403).json({ error: 'Survey is not active' });
        }

        res.json(survey);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Создать новый опрос
router.post('/', auth('admin'), [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description } = req.body;

        const survey = new Survey({
            title,
            description,
            createdBy: req.user.id,
            questions: []
        });

        await survey.save();
        res.status(201).json(survey);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Добавить вопрос к опросу
router.post('/:id/questions', auth('admin'), [
    body('text').trim().notEmpty().withMessage('Question text is required'),
    body('options').isArray({ min: 4, max: 4 }).withMessage('Exactly 4 options are required'),
    body('options.*.text').trim().notEmpty().withMessage('Option text is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const survey = await Survey.findById(req.params.id);
        
        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Проверяем, что опрос принадлежит текущему администратору
        if (survey.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { text, options } = req.body;

        survey.questions.push({
            text,
            options: options.map(opt => ({ text: opt.text })),
            answers: []
        });

        await survey.save();
        res.json(survey.questions[survey.questions.length - 1]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Удалить опрос
router.delete('/:id', auth('admin'), async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);
        
        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Проверяем, что опрос принадлежит текущему администратору
        if (survey.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Удаляем все ответы на этот опрос
        await Response.deleteMany({ surveyId: survey._id });
        
        // Удаляем опрос
        await survey.deleteOne();
        
        res.json({ message: 'Survey deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Удалить вопрос
router.delete('/:surveyId/questions/:questionId', auth('admin'), async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.surveyId);
        
        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Проверяем, что опрос принадлежит текущему администратору
        if (survey.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const questionIndex = survey.questions.findIndex(
            q => q._id.toString() === req.params.questionId
        );

        if (questionIndex === -1) {
            return res.status(404).json({ error: 'Question not found' });
        }

        survey.questions.splice(questionIndex, 1);
        await survey.save();
        
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Получить статистику по опросу
router.get('/:id/stats', auth('admin'), async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id)
            .populate('questions.answers.userId', 'name email');
        
        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Проверяем, что опрос принадлежит текущему администратору
        if (survey.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(survey);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
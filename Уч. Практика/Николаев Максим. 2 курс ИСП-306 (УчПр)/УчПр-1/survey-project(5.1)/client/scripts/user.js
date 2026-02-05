document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Проверяем авторизацию
    if (!currentUser || currentUser.userType !== 'user') {
        window.location.href = 'index.html';
        return;
    }
    
    // Инициализация
    initUserPanel();
    
    async function initUserPanel() {
        // Выход из системы
        document.getElementById('logout-btn').addEventListener('click', function() {
            surveyAPI.clearToken();
            window.location.href = 'index.html';
        });
        
        // Возврат к списку опросов
        document.getElementById('back-to-surveys').addEventListener('click', function() {
            document.getElementById('available-surveys').style.display = 'block';
            document.getElementById('survey-container').style.display = 'none';
            document.getElementById('results-container').style.display = 'none';
            loadAvailableSurveys();
        });
        
        // Загрузка доступных опросов
        async function loadAvailableSurveys() {
            try {
                const surveys = await surveyAPI.getActiveSurveys();
                const surveysList = document.getElementById('surveys-list');
                
                if (surveys.length === 0) {
                    surveysList.innerHTML = '<p>Нет доступных опросов. Вы прошли все доступные опросы.</p>';
                    return;
                }
                
                surveysList.innerHTML = surveys.map(survey => `
                    <div class="survey-card" data-id="${survey._id}">
                        <h3>${survey.title}</h3>
                        <p>${survey.description || ''}</p>
                        <p><small>Количество вопросов: ${survey.questions.length}</small></p>
                        <button class="btn start-survey-btn">Начать опрос</button>
                    </div>
                `).join('');
                
                // Обработчики для начала опроса
                document.querySelectorAll('.start-survey-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const surveyId = this.closest('.survey-card').getAttribute('data-id');
                        startSurvey(surveyId);
                    });
                });
            } catch (error) {
                console.error(error);
                alert('Ошибка при загрузке опросов');
            }
        }
        
        // Начало опроса
        async function startSurvey(surveyId) {
            try {
                const survey = await surveyAPI.getSurvey(surveyId);
                
                document.getElementById('available-surveys').style.display = 'none';
                document.getElementById('survey-container').style.display = 'block';
                
                document.getElementById('survey-title').textContent = survey.title;
                document.getElementById('survey-description').textContent = survey.description || '';
                
                const questionsContainer = document.getElementById('questions-container');
                questionsContainer.innerHTML = '';
                
                survey.questions.forEach((question, qIndex) => {
                    const questionElement = document.createElement('div');
                    questionElement.className = 'question-item';
                    questionElement.innerHTML = `
                        <div class="question-text">${qIndex + 1}. ${question.text}</div>
                        ${question.options.map((option, index) => `
                            <label class="option-label">
                                <input type="radio" name="question_${question._id}" value="${index}" required>
                                ${String.fromCharCode(65 + index)}. ${option.text}
                            </label>
                        `).join('')}
                    `;
                    questionsContainer.appendChild(questionElement);
                });
                
                // Обработка отправки формы опроса
                document.getElementById('survey-form').onsubmit = async function(e) {
                    e.preventDefault();
                    
                    const answers = [];
                    let allAnswered = true;
                    
                    survey.questions.forEach(question => {
                        const selectedOption = document.querySelector(`input[name="question_${question._id}"]:checked`);
                        
                        if (selectedOption) {
                            answers.push({
                                questionId: question._id,
                                answer: parseInt(selectedOption.value)
                            });
                        } else {
                            allAnswered = false;
                        }
                    });
                    
                    if (!allAnswered) {
                        alert('Пожалуйста, ответьте на все вопросы!');
                        return;
                    }
                    
                    try {
                        const result = await surveyAPI.submitResponse({
                            surveyId,
                            answers
                        });
                        
                        showResults(survey, result.stats);
                    } catch (error) {
                        alert(error.message);
                    }
                };
            } catch (error) {
                console.error(error);
                alert('Ошибка при загрузке опроса');
            }
        }
        
        // Показ результатов опроса
        function showResults(survey, stats) {
            document.getElementById('survey-container').style.display = 'none';
            document.getElementById('results-container').style.display = 'block';
            
            const resultsContent = document.getElementById('results-content');
            
            let resultsHTML = `
                <h3>${survey.title}</h3>
                <p>Спасибо за участие в опросе!</p>
                <p>Ваши ответы:</p>
            `;
            
            stats.forEach((stat, index) => {
                resultsHTML += `
                    <div class="result-question">
                        <div class="question-text">${index + 1}. ${stat.questionText}</div>
                        <p><strong>Ваш ответ:</strong> ${stat.selectedOption}</p>
                        <p><small>С этим ответом согласны ${stat.userAnswerCount} из ${stat.totalAnswers} участников (${stat.percentage}%)</small></p>
                    </div>
                `;
            });
            
            resultsContent.innerHTML = resultsHTML;
        }
        
        // Инициализация
        loadAvailableSurveys();
    }
});
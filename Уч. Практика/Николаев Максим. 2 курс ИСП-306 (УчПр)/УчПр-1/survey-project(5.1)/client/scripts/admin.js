document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Проверяем авторизацию
    if (!currentUser || currentUser.userType !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    // Инициализация
    initAdminPanel();
    
    async function initAdminPanel() {
        // Выход из системы
        document.getElementById('logout-btn').addEventListener('click', function() {
            surveyAPI.clearToken();
            window.location.href = 'index.html';
        });
        
        // Управление секциями
        const sidebarBtns = document.querySelectorAll('.sidebar-btn');
        const sections = document.querySelectorAll('.section');
        
        sidebarBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const sectionId = this.getAttribute('data-section');
                
                sidebarBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === `${sectionId}-section`) {
                        section.classList.add('active');
                    }
                });
                
                // Загружаем данные для выбранной секции
                if (sectionId === 'surveys') {
                    loadSurveys();
                } else if (sectionId === 'results') {
                    loadResults();
                }
            });
        });
        
        let currentSurveyId = null;
        
        // Создание нового опроса
        document.getElementById('add-survey-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const title = document.getElementById('survey-title').value;
            const description = document.getElementById('survey-description').value;
            
            try {
                const survey = await surveyAPI.createSurvey({ title, description });
                currentSurveyId = survey._id;
                
                // Показываем секцию добавления вопросов
                document.getElementById('current-survey-title').textContent = title;
                document.getElementById('questions-section').style.display = 'block';
                document.getElementById('survey-title').value = '';
                document.getElementById('survey-description').value = '';
                
                loadSurveyQuestions();
            } catch (error) {
                alert(error.message);
            }
        });
        
        // Добавление вопроса к опросу
        document.getElementById('add-question-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentSurveyId) {
                alert('Сначала создайте опрос!');
                return;
            }
            
            const questionText = document.getElementById('question-text').value;
            const optionInputs = document.querySelectorAll('.option-input');
            const options = Array.from(optionInputs).map(input => ({ text: input.value }));
            
            try {
                await surveyAPI.addQuestion(currentSurveyId, {
                    text: questionText,
                    options
                });
                
                // Очищаем форму
                document.getElementById('question-text').value = '';
                optionInputs.forEach(input => input.value = '');
                
                loadSurveyQuestions();
            } catch (error) {
                alert(error.message);
            }
        });
        
        // Завершение создания опроса
        document.getElementById('finish-survey-btn').addEventListener('click', function() {
            currentSurveyId = null;
            document.getElementById('questions-section').style.display = 'none';
            loadSurveys();
            document.querySelector('.sidebar-btn[data-section="surveys"]').click();
        });
        
        // Загрузка списка опросов
        async function loadSurveys() {
            try {
                const surveys = await surveyAPI.getSurveys();
                const surveysList = document.getElementById('surveys-list');
                
                if (surveys.length === 0) {
                    surveysList.innerHTML = '<p>Опросы пока не созданы.</p>';
                    return;
                }
                
                surveysList.innerHTML = surveys.map(survey => `
                    <div class="survey-item" data-id="${survey._id}">
                        <h3>${survey.title}</h3>
                        <p>${survey.description || ''}</p>
                        <p><small>Создан: ${new Date(survey.createdAt).toLocaleDateString()}</small></p>
                        <p><strong>Вопросов: ${survey.questions.length}</strong></p>
                        <button class="btn view-questions-btn">Просмотреть вопросы</button>
                        <button class="btn delete-survey-btn">Удалить</button>
                    </div>
                `).join('');
                
                // Добавляем обработчики для кнопок
                document.querySelectorAll('.view-questions-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const surveyId = this.closest('.survey-item').getAttribute('data-id');
                        currentSurveyId = surveyId;
                        const survey = surveys.find(s => s._id === surveyId);
                        document.getElementById('current-survey-title').textContent = survey.title;
                        document.getElementById('questions-section').style.display = 'block';
                        document.querySelector('.sidebar-btn[data-section="add-survey"]').click();
                        loadSurveyQuestions();
                    });
                });
                
                document.querySelectorAll('.delete-survey-btn').forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const surveyId = this.closest('.survey-item').getAttribute('data-id');
                        if (confirm('Удалить этот опрос?')) {
                            try {
                                await surveyAPI.deleteSurvey(surveyId);
                                loadSurveys();
                            } catch (error) {
                                alert(error.message);
                            }
                        }
                    });
                });
            } catch (error) {
                console.error(error);
                alert('Ошибка при загрузке опросов');
            }
        }
        
        // Загрузка вопросов текущего опроса
        async function loadSurveyQuestions() {
            if (!currentSurveyId) return;
            
            try {
                const surveys = await surveyAPI.getSurveys();
                const survey = surveys.find(s => s._id === currentSurveyId);
                
                if (!survey) return;
                
                const questionsList = document.getElementById('questions-list');
                
                if (survey.questions.length === 0) {
                    questionsList.innerHTML = '<p>Вопросы пока не добавлены.</p>';
                    return;
                }
                
                questionsList.innerHTML = survey.questions.map((question, index) => `
                    <div class="question-item" data-id="${question._id}">
                        <h4>${index + 1}. ${question.text}</h4>
                        <ul>
                            ${question.options.map((option, optIndex) => 
                                `<li>${String.fromCharCode(65 + optIndex)}. ${option.text}</li>`
                            ).join('')}
                        </ul>
                        <button class="btn delete-question-btn">Удалить вопрос</button>
                    </div>
                `).join('');
                
                // Обработчики для удаления вопросов
                document.querySelectorAll('.delete-question-btn').forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const questionId = this.closest('.question-item').getAttribute('data-id');
                        if (confirm('Удалить этот вопрос?')) {
                            try {
                                await surveyAPI.deleteQuestion(currentSurveyId, questionId);
                                loadSurveyQuestions();
                            } catch (error) {
                                alert(error.message);
                            }
                        }
                    });
                });
            } catch (error) {
                console.error(error);
                alert('Ошибка при загрузке вопросов');
            }
        }
        
        // Загрузка результатов
        async function loadResults() {
            try {
                const surveys = await surveyAPI.getSurveys();
                const resultsList = document.getElementById('results-list');
                
                if (surveys.length === 0) {
                    resultsList.innerHTML = '<p>Нет данных для отображения.</p>';
                    return;
                }
                
                resultsList.innerHTML = surveys.map(survey => `
                    <div class="result-item">
                        <h3>${survey.title}</h3>
                        <p>Всего ответов: ${survey.questions.reduce((total, q) => total + (q.answers ? q.answers.length : 0), 0)}</p>
                        ${survey.questions.map((question, qIndex) => {
                            const total = question.answers ? question.answers.length : 0;
                            
                            return `
                                <div class="question-result">
                                    <h4>${qIndex + 1}. ${question.text}</h4>
                                    ${question.options.map((option, index) => {
                                        const count = question.answers ? 
                                            question.answers.filter(a => a.answer === index).length : 0;
                                        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                                        return `
                                            <div>
                                                <span>${String.fromCharCode(65 + index)}. ${option.text}</span>
                                                <span> - ${count} ответов (${percentage}%)</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `).join('');
            } catch (error) {
                console.error(error);
                alert('Ошибка при загрузке результатов');
            }
        }
        
        // Инициализация
        loadSurveys();
    }
});
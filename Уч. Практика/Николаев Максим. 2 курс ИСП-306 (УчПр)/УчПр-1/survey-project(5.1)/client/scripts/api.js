class SurveyAPI {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            const error = data.error || data.errors || 'Something went wrong';
            throw new Error(Array.isArray(error) ? error.map(e => e.msg).join(', ') : error);
        }
        
        return data;
    }

    // Аутентификация
    async register(userData) {
        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(userData)
        });
        
        return this.handleResponse(response);
    }

    async registerAdmin(userData, adminCode) {
        const response = await fetch(`${this.baseURL}/auth/register-admin`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ ...userData, adminCode })
        });
        
        return this.handleResponse(response);
    }

    async login(email, password, userType) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ email, password, userType })
        });
        
        const data = await this.handleResponse(response);
        if (data.token) {
            this.setToken(data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        return data;
    }

    async getCurrentUser() {
        const response = await fetch(`${this.baseURL}/auth/me`, {
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    }

    // Опросы (администратор)
    async getSurveys() {
        const response = await fetch(`${this.baseURL}/surveys/admin`, {
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    }

    async createSurvey(surveyData) {
        const response = await fetch(`${this.baseURL}/surveys`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(surveyData)
        });
        
        return this.handleResponse(response);
    }

    async addQuestion(surveyId, questionData) {
        const response = await fetch(`${this.baseURL}/surveys/${surveyId}/questions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(questionData)
        });
        
        return this.handleResponse(response);
    }

    async deleteSurvey(surveyId) {
        const response = await fetch(`${this.baseURL}/surveys/${surveyId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    }

    async deleteQuestion(surveyId, questionId) {
        const response = await fetch(`${this.baseURL}/surveys/${surveyId}/questions/${questionId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    }

    async getSurveyStats(surveyId) {
        const response = await fetch(`${this.baseURL}/surveys/${surveyId}/stats`, {
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    }

    // Опросы (пользователь)
    async getActiveSurveys() {
        const response = await fetch(`${this.baseURL}/surveys/active`, {
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    }

    async getSurvey(surveyId) {
        const response = await fetch(`${this.baseURL}/surveys/${surveyId}`, {
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    }

    // Ответы
    async submitResponse(responseData) {
        const res = await fetch(`${this.baseURL}/responses/submit`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(responseData)
        });
        
        return this.handleResponse(res);
    }

    async getMyResponses() {
        const response = await fetch(`${this.baseURL}/responses/my-responses`, {
            headers: this.getHeaders()
        });
        
        return this.handleResponse(response);
    }
}

// Создаем глобальный экземпляр API
window.surveyAPI = new SurveyAPI();
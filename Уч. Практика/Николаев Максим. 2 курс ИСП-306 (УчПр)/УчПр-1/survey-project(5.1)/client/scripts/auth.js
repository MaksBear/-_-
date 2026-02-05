document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Управление табами
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Обновляем активные табы
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Проверяем, авторизован ли пользователь
    checkAuth();
    
    // Обработка входа
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const userType = document.getElementById('user-type').value;
        
        try {
            const data = await surveyAPI.login(email, password, userType);
            
            if (userType === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'user.html';
            }
        } catch (error) {
            alert(error.message);
        }
    });
    
    // Регистрация обычного пользователя
    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        
        try {
            await surveyAPI.register({ name, email, password });
            alert('Регистрация успешна! Теперь вы можете войти.');
            
            // Переключаемся на вкладку входа
            tabBtns[0].click();
            document.getElementById('login-email').value = email;
            document.getElementById('login-password').value = password;
        } catch (error) {
            alert(error.message);
        }
    });
    
    // Регистрация администратора
    document.getElementById('register-admin-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('admin-name').value;
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        const adminCode = document.getElementById('admin-code').value;
        
        try {
            await surveyAPI.registerAdmin({ name, email, password }, adminCode);
            alert('Администратор успешно зарегистрирован!');
            
            tabBtns[0].click();
            document.getElementById('login-email').value = email;
            document.getElementById('login-password').value = password;
            document.getElementById('user-type').value = 'admin';
        } catch (error) {
            alert(error.message);
        }
    });
    
    async function checkAuth() {
        try {
            const data = await surveyAPI.getCurrentUser();
            if (data.user) {
                if (data.user.userType === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'user.html';
                }
            }
        } catch (error) {
            // Не авторизован - остаемся на странице входа
        }
    }
});
// app.js - КЛІЄНТСЬКА ЛОГІКА ВСІЄЇ ПЛАТФОРМИ
// Містить: API взаємодія, мультимовна підтримка, управління сесією, динамічні оновлення

// ===== ПЕРЕКЛАДИ (Мультимовна підтримка) =====
const translations = {
    uk: {
        'headline': 'Заробляйте гроші, виконуючи прості онлайн-завдання!',
        'subheadline': 'Натискайте кнопки, оцінюйте продукти, пишіть відгуки і заробляйте бонуси!',
        'start': 'Почати заробляти',
        'login': 'Вхід',
        'register': 'Реєстрація',
        'logout': 'Вихід'
    },
    en: {
        'headline': 'Earn money by completing simple online tasks!',
        'subheadline': 'Click buttons, rate products, write reviews, and earn bonuses!',
        'start': 'Start Earning',
        'login': 'Login',
        'register': 'Register',
        'logout': 'Logout'
    },
    ru: {
        'headline': 'Зарабатывайте деньги, выполняя простые онлайн-задания!',
        'subheadline': 'Нажимайте кнопки, оценивайте продукты, пишите отзывы и зарабатывайте бонусы!',
        'start': 'Начать зарабатывать',
        'login': 'Вход',
        'register': 'Регистрация',
        'logout': 'Выход'
    }
};

// ===== ЗМІННІ СТАНУ =====
let currentLanguage = localStorage.getItem('language') || 'en';
let sessionId = localStorage.getItem('sessionId') || null;
let userId = localStorage.getItem('userId') || null;

// ===== ІНІЦІАЛІЗАЦІЯ =====
document.addEventListener('DOMContentLoaded', () => {
    initLanguageSwitcher();
    updateUI();
    
    // Перевірка сторінки
    const currentPage = document.body.innerHTML;
    
    if (currentPage.includes('dashboard')) {
        loadDashboard();
    } else if (currentPage.includes('tasks')) {
        loadTasks();
    } else if (currentPage.includes('referrals')) {
        loadReferrals();
    } else if (currentPage.includes('promotions')) {
        initPromotions();
    } else if (currentPage.includes('auth')) {
        initAuth();
    }
});

// ===== ПЕРЕМИКАЧ МОВИ =====
function initLanguageSwitcher() {
    const select = document.getElementById('languageSelect');
    if (select) {
        select.value = currentLanguage;
        select.addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            localStorage.setItem('language', currentLanguage);
            updateAllText();
        });
    }
}

// ===== ОНОВИТИ ВСІ ТЕКСТИ =====
function updateAllText() {
    document.querySelectorAll('[data-en][data-uk][data-ru]').forEach(element => {
        const text = element.getAttribute(`data-${currentLanguage}`);
        if (text) {
            element.textContent = text;
        }
    });
}

// ===== ОНОВИТИ UI =====
function updateUI() {
    if (sessionId && userId) {
        // Користувач залогований
        document.querySelectorAll('.nav-link').forEach(link => link.style.display = 'block');
        document.getElementById('loginBtn')?.style.display = 'none';
        document.getElementById('logoutBtn')?.addEventListener('click', logout);
    } else {
        // Користувач не залогований
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            window.location.href = '/auth.html';
        });
    }
    
    updateAllText();
}

// ===== АУТЕНТИФІКАЦІЯ =====
function initAuth() {
    // Вкладки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active-form'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(tab + 'Form').classList.add('active-form');
            e.target.classList.add('active');
        });
    });

    // Форма входу
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (data.success) {
                sessionId = data.sessionId;
                userId = data.userId;
                localStorage.setItem('sessionId', sessionId);
                localStorage.setItem('userId', userId);
                localStorage.setItem('language', data.language || currentLanguage);
                window.location.href = '/dashboard.html';
            } else {
                document.getElementById('loginError').textContent = data.message;
            }
        } catch (err) {
            document.getElementById('loginError').textContent = 'Error: ' + err.message;
        }
    });

    // Форма реєстрації
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, language: currentLanguage })
            });

            const data = await res.json();

            if (data.success) {
                alert('✅ Registration successful! Please log in.');
                document.querySelector('[data-tab="register"]').click();
            } else {
                document.getElementById('registerError').textContent = data.message;
            }
        } catch (err) {
            document.getElementById('registerError').textContent = 'Error: ' + err.message;
        }
    });
}

// ===== ПАНЕЛЬ КОРИСТУВАЧА =====
async function loadDashboard() {
    if (!sessionId) {
        window.location.href = '/auth.html';
        return;
    }

    try {
        const res = await fetch(`/api/user/${sessionId}`);
        const data = await res.json();

        if (data.success) {
            document.getElementById('balanceAmount').textContent = `$${data.balance.toFixed(2)}`;
            document.getElementById('activeUserCount').textContent = `${data.activeUsersCount} / ${data.maxUsers}`;

            // Показати попередження якщо ліміт досягнуто
            if (data.activeUsersCount >= data.maxUsers) {
                document.getElementById('limitWarning').style.display = 'block';
            }

            // Завантажити історію завдань
            const historyHTML = data.tasks.map(task => `
                <div class="history-item">
                    <div>
                        <strong>${task.title}</strong><br>
                        <small>${new Date(task.completedAt).toLocaleString()}</small>
                    </div>
                    <div class="history-reward">+$${task.reward.toFixed(2)}</div>
                </div>
            `).join('');

            document.getElementById('taskHistoryList').innerHTML = historyHTML || '<p>No tasks completed yet</p>';

            // Кнопка "Заробити більше"
            document.getElementById('earnMoreBtn')?.addEventListener('click', () => {
                window.location.href = '/tasks.html';
            });
        }
    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}

// ===== СТОРІНКА ЗАВДАНЬ =====
async function loadTasks() {
    if (!sessionId) {
        window.location.href = '/auth.html';
        return;
    }

    try {
        const res = await fetch('/api/tasks');
        const data = await res.json();

        if (data.success) {
            const tasksHTML = data.tasks.map(task => `
                <div class="task-card">
                    <div class="task-badge">⭐ Task</div>
                    <h3>${task[`title_${currentLanguage}`] || task.title_en}</h3>
                    <div class="task-details">
                        <p><strong>💰 Reward:</strong> <span class="task-reward">$${task.reward.toFixed(2)}</span></p>
                        <p><strong>⏱️ Time:</strong> ${task.time}</p>
                    </div>
                    <button class="btn btn-large" onclick="completeTask(${task.id})">Complete</button>
                </div>
            `).join('');

            document.getElementById('tasksGrid').innerHTML = tasksHTML;
        }
    } catch (err) {
        console.error('Error loading tasks:', err);
    }
}

// ===== ЗАВЕРШИТИ ЗАВДАННЯ =====
async function completeTask(taskId) {
    try {
        const res = await fetch('/api/complete-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, taskId })
        });

        const data = await res.json();

        if (data.success) {
            alert(`✅ Task completed! +$${data.reward.toFixed(2)}`);
            loadTasks(); // Перезавантажити завдання
        }
    } catch (err) {
        alert('Error completing task: ' + err.message);
    }
}

// ===== СТОРІНКА РЕФЕРАЛІВ =====
async function loadReferrals() {
    if (!sessionId) {
        window.location.href = '/auth.html';
        return;
    }

    try {
        const res = await fetch(`/api/referral/${sessionId}`);
        const data = await res.json();

        if (data.success) {
            document.getElementById('referralLink').value = data.referralLink;
            document.getElementById('referredCount').textContent = data.referredUsersCount;
            document.getElementById('bonusAmount').textContent = `$${data.bonusEarned.toFixed(2)}`;

            // Кнопка копіювання
            document.getElementById('copyBtn').addEventListener('click', () => {
                document.getElementById('referralLink').select();
                document.execCommand('copy');
                document.getElementById('copyMsg').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('copyMsg').style.display = 'none';
                }, 2000);
            });
        }
    } catch (err) {
        console.error('Error loading referrals:', err);
    }
}

// ===== АКЦІЇ ТА КАРУСЕЛЬ =====
function initPromotions() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-item');

    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[n % slides.length].classList.add('active');
    }

    window.moveCarousel = (direction) => {
        currentSlide = (currentSlide + direction + slides.length) % slides.length;
        showSlide(currentSlide);
    };

    showSlide(0);
}

// ===== ВИХІД =====
async function logout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        });

        localStorage.removeItem('sessionId');
        localStorage.removeItem('userId');
        sessionId = null;
        userId = null;
        window.location.href = '/';
    } catch (err) {
        console.error('Error logging out:', err);
    }
}

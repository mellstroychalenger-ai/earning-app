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
    updateAllText();
    setupButtons();
    checkPageAndLoad();
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
    document.querySelectorAll('[data-en][data-uk][data-ru]').forEach(el => {
        const text = el.getAttribute(`data-${currentLanguage}`);
        if (text) el.textContent = text;
    });
}

// ===== НАЛАШТУВАННЯ КНОПОК =====
function setupButtons() {
    // Start Earning
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', () => {
        window.location.href = sessionId ? '/dashboard.html' : '/auth.html';
    });

    // Login
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', () => window.location.href = '/auth.html');

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Copy Referral
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const linkInput = document.getElementById('referralLink');
            if (linkInput) {
                navigator.clipboard.writeText(linkInput.value).then(() => {
                    const msg = document.getElementById('copyMsg');
                    if (msg) {
                        msg.style.display = 'block';
                        setTimeout(() => msg.style.display = 'none', 2000);
                    }
                });
            }
        });
    }

    // Earn More (Dashboard)
    const earnMoreBtn = document.getElementById('earnMoreBtn');
    if (earnMoreBtn) earnMoreBtn.addEventListener('click', () => window.location.href = '/tasks.html');

    // Делегування для динамічних кнопок
    document.body.addEventListener('click', (e) => {
        // Complete Task
        const taskBtn = e.target.closest('.task-card button[data-task-id]');
        if (taskBtn) completeTask(taskBtn.dataset.taskId);

        // Carousel navigation
        const navBtn = e.target.closest('.carousel-nav[data-direction]');
        if (navBtn) {
            const direction = parseInt(navBtn.dataset.direction);
            if (!isNaN(direction)) moveCarousel(direction);
        }
    });
}

// ===== ВИБІР СТОРІНКИ =====
function checkPageAndLoad() {
    const bodyHTML = document.body.innerHTML.toLowerCase();

    if (bodyHTML.includes('dashboard')) loadDashboard();
    else if (bodyHTML.includes('tasks')) loadTasks();
    else if (bodyHTML.includes('referrals')) loadReferrals();
    else if (bodyHTML.includes('promotions')) initPromotions();
    else if (bodyHTML.includes('auth')) initAuth();
}

// ===== АУТЕНТИФІКАЦІЯ =====
function initAuth() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active-form'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            const form = document.getElementById(tab + 'Form');
            if (form) form.classList.add('active-form');
            e.target.classList.add('active');
        });
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', async e => {
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
                const errEl = document.getElementById('loginError');
                if (errEl) errEl.textContent = data.message;
            }
        } catch (err) {
            const errEl = document.getElementById('loginError');
            if (errEl) errEl.textContent = 'Error: ' + err.message;
        }
    });

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', async e => {
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
                const tab = document.querySelector('[data-tab="register"]');
                if (tab) tab.click();
            } else {
                const errEl = document.getElementById('registerError');
                if (errEl) errEl.textContent = data.message;
            }
        } catch (err) {
            const errEl = document.getElementById('registerError');
            if (errEl) errEl.textContent = 'Error: ' + err.message;
        }
    });
}

// ===== DASHBOARD =====
async function loadDashboard() {
    if (!sessionId) return window.location.href = '/auth.html';
    try {
        const res = await fetch(`/api/user/${sessionId}`);
        const data = await res.json();
        if (data.success) {
            const balanceEl = document.getElementById('balanceAmount');
            if (balanceEl) balanceEl.textContent = `$${data.balance.toFixed(2)}`;

            const activeEl = document.getElementById('activeUserCount');
            if (activeEl) activeEl.textContent = `${data.activeUsersCount} / ${data.maxUsers}`;

            const warningEl = document.getElementById('limitWarning');
            if (warningEl && data.activeUsersCount >= data.maxUsers) warningEl.style.display = 'block';

            const historyEl = document.getElementById('taskHistoryList');
            if (historyEl) {
                historyEl.innerHTML = data.tasks.map(task => `
                    <div class="history-item">
                        <div><strong>${task.title}</strong><br><small>${new Date(task.completedAt).toLocaleString()}</small></div>
                        <div class="history-reward">+$${task.reward.toFixed(2)}</div>
                    </div>
                `).join('') || '<p>No tasks completed yet</p>';
            }
        }
    } catch (err) { console.error('Error loading dashboard:', err); }
}

// ===== TASKS =====
async function loadTasks() {
    if (!sessionId) return window.location.href = '/auth.html';
    try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        if (data.success) {
            const grid = document.getElementById('tasksGrid');
            if (grid) {
                grid.innerHTML = data.tasks.map(task => `
                    <div class="task-card">
                        <div class="task-badge">⭐ Task</div>
                        <h3>${task[`title_${currentLanguage}`] || task.title_en}</h3>
                        <div class="task-details">
                            <p><strong>💰 Reward:</strong> <span class="task-reward">$${task.reward.toFixed(2)}</span></p>
                            <p><strong>⏱️ Time:</strong> ${task.time}</p>
                        </div>
                        <button class="btn btn-large" data-task-id="${task.id}">Complete</button>
                    </div>
                `).join('');
            }
        }
    } catch (err) { console.error('Error loading tasks:', err); }
}

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
            loadTasks();
        }
    } catch (err) { alert('Error completing task: ' + err.message); }
}

// ===== REFERRALS =====
async function loadReferrals() {
    if (!sessionId) return window.location.href = '/auth.html';
    try {
        const res = await fetch(`/api/referral/${sessionId}`);
        const data = await res.json();
        if (data.success) {
            const linkInput = document.getElementById('referralLink');
            if (linkInput) linkInput.value = data.referralLink;

            const referredEl = document.getElementById('referredCount');
            if (referredEl) referredEl.textContent = data.referredUsersCount;

            const bonusEl = document.getElementById('bonusAmount');
            if (bonusEl) bonusEl.textContent = `$${data.bonusEarned.toFixed(2)}`;
        }
    } catch (err) { console.error('Error loading referrals:', err); }
}

// ===== PROMOTIONS =====
function initPromotions() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-item');
    if (!slides.length) return;

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

// ===== LOGOUT =====
async function logout() {
    try {
        if (!sessionId) return;
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
    } catch (err) { console.error('Error logging out:', err); }
}

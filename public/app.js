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

// ===== QUIZ (для tasks.html) =====
const quizQuestions = [
    { question: "Скільки в людини хромосом?", options: ["23", "46", "44", "48"], answer: "46" },
    { question: "Що таке бісексуальність?", options: ["Любов до всіх людей", "Прихильність до однієї статі", "Прихильність до обох статей", "Тільки дружба"], answer: "Прихильність до обох статей" },
    { question: "Хто такий пасив у геях?", options: ["Активний партнер", "Пасивний партнер", "Нейтральний", "Не стосується"], answer: "Пасивний партнер" },
    { question: "Який елемент хімічної таблиці має символ O?", options: ["Оксиген", "Золото", "Осмій", "Олово"], answer: "Оксиген" },
    { question: "Столиця Франції?", options: ["Берлін", "Мадрид", "Париж", "Рим"], answer: "Париж" },
    { question: "Хто написав 'Кобзар'?", options: ["Іван Франко", "Тарас Шевченко", "Леся Українка", "Григір Сковорода"], answer: "Тарас Шевченко" },
    { question: "Що таке фотосинтез?", options: ["Процес дихання", "Процес виробництва енергії у тварин", "Процес утворення їжі у рослин", "Процес розкладу"], answer: "Процес утворення їжі у рослин" },
    { question: "Яка формула води?", options: ["H2O", "CO2", "O2", "NaCl"], answer: "H2O" }
];

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
        select.addEventListener('change', e => {
            currentLanguage = e.target.value;
            localStorage.setItem('language', currentLanguage);
            updateAllText();
            // Перезавантажити динамічні сторінки
            checkPageAndLoad();
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
    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', () => {
        window.location.href = sessionId ? '/dashboard.html' : '/auth.html';
    });

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', () => window.location.href = '/auth.html');

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', () => {
        const linkInput = document.getElementById('referralLink');
        if (linkInput) {
            navigator.clipboard.writeText(linkInput.value).then(() => {
                const msg = document.getElementById('copyMsg');
                if (msg) { msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 2000); }
            });
        }
    });

    const earnMoreBtn = document.getElementById('earnMoreBtn');
    if (earnMoreBtn) earnMoreBtn.addEventListener('click', () => window.location.href = '/tasks.html');

    // Делегування для динамічних кнопок
    document.body.addEventListener('click', e => {
        if (e.target.matches('.task-card button[data-task-id]')) {
            const taskId = e.target.dataset.taskId;
            if (taskId) completeTask(taskId);
        }
        if (e.target.matches('.carousel-nav[data-direction]')) {
            const direction = parseInt(e.target.dataset.direction);
            if (!isNaN(direction)) moveCarousel(direction);
        }
    });
}

// ===== ВИБІР СТОРІНКИ =====
function checkPageAndLoad() {
    const bodyHTML = document.body.innerHTML.toLowerCase();
    if (bodyHTML.includes('dashboard')) loadDashboard();
    else if (bodyHTML.includes('tasks')) loadTasks().then(loadQuiz);
    else if (bodyHTML.includes('referrals')) loadReferrals();
    else if (bodyHTML.includes('promotions')) initPromotions();
    else if (bodyHTML.includes('auth')) initAuth();
}

// ===== АУТЕНТИФІКАЦІЯ =====
function initAuth() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', e => {
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
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                sessionId = data.sessionId; userId = data.userId;
                localStorage.setItem('sessionId', sessionId);
                localStorage.setItem('userId', userId);
                localStorage.setItem('language', data.language || currentLanguage);
                window.location.href = '/dashboard.html';
            } else { document.getElementById('loginError').textContent = data.message; }
        } catch (err) { document.getElementById('loginError').textContent = 'Error: ' + err.message; }
    });

    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', async e => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        try {
            const res = await fetch('/api/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, language: currentLanguage })
            });
            const data = await res.json();
            if (data.success) {
                alert('✅ Registration successful! Please log in.');
                document.querySelector('[data-tab="register"]').click();
            } else { document.getElementById('registerError').textContent = data.message; }
        } catch (err) { document.getElementById('registerError').textContent = 'Error: ' + err.message; }
    });
}

// ===== DASHBOARD =====
async function loadDashboard() {
    if (!sessionId) return window.location.href = '/auth.html';
    try {
        const res = await fetch(`/api/user/${sessionId}`);
        const data = await res.json();
        if (data.success) {
            document.getElementById('balanceAmount').textContent = `$${data.balance.toFixed(2)}`;
            document.getElementById('activeUserCount').textContent = `${data.activeUsersCount} / ${data.maxUsers}`;
            if (data.activeUsersCount >= data.maxUsers) document.getElementById('limitWarning').style.display = 'block';
            const historyEl = document.getElementById('taskHistoryList');
            if(historyEl) {
                historyEl.innerHTML = data.tasks.map(t => `
                    <div class="history-item">
                        <div><strong>${t.title}</strong><br><small>${new Date(t.completedAt).toLocaleString()}</small></div>
                        <div class="history-reward">+$${t.reward.toFixed(2)}</div>
                    </div>`).join('') || '<p>No tasks completed yet</p>';
            }
        }
    } catch (err) { console.error(err); }
}

// ===== TASKS =====
async function loadTasks() {
    if (!sessionId) return window.location.href = '/auth.html';
    try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        if (data.success) {
            const grid = document.getElementById('tasksGrid');
            if(grid) grid.innerHTML = data.tasks.map(task => `
                <div class="task-card">
                    <div class="task-badge">⭐ Task</div>
                    <h3>${task[`title_${currentLanguage}`] || task.title_en}</h3>
                    <div class="task-details">
                        <p><strong>💰 Reward:</strong> <span class="task-reward">$${task.reward.toFixed(2)}</span></p>
                        <p><strong>⏱️ Time:</strong> ${task.time}</p>
                    </div>
                    <button class="btn btn-large" data-task-id="${task.id}">Complete</button>
                </div>`).join('');
        }
    } catch (err) { console.error(err); }
}

async function completeTask(taskId) {
    try {
        const res = await fetch('/api/complete-task', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, taskId })
        });
        const data = await res.json();
        if (data.success) {
            alert(`✅ Task completed! +$${data.reward.toFixed(2)}`);
            loadTasks().then(loadQuiz);
        }
    } catch (err) { alert('Error completing task: ' + err.message); }
}

// ===== QUIZ =====
function loadQuiz() {
    const grid = document.getElementById('tasksGrid');
    if (!grid) return;
    grid.innerHTML += quizQuestions.map((q, i) => `
        <div class="task-card">
            <h3>${q.question}</h3>
            ${q.options.map(opt => `<button class="btn btn-large" onclick="checkAnswer(${i}, '${opt}')">${opt}</button>`).join('')}
            <p id="result-${i}" style="margin-top:5px;"></p>
        </div>
    `).join('');
}

function checkAnswer(qIndex, selected) {
    const resultEl = document.getElementById(`result-${qIndex}`);
    if (quizQuestions[qIndex].answer === selected) {
        resultEl.textContent = "✅ Правильно!";
        resultEl.style.color = "green";
    } else {
        resultEl.textContent = "❌ Неправильно!";
        resultEl.style.color = "red";
    }
}

// ===== REFERRALS =====
async function loadReferrals() {
    if (!sessionId) return window.location.href = '/auth.html';
    try {
        const res = await fetch(`/api/referral/${sessionId}`);
        const data = await res.json();
        if (data.success) {
            const refLink = document.getElementById('referralLink');
            if(refLink) refLink.value = data.referralLink;
            const referredCount = document.getElementById('referredCount');
            if(referredCount) referredCount.textContent = data.referredUsersCount;
            const bonusAmount = document.getElementById('bonusAmount');
            if(bonusAmount) bonusAmount.textContent = `$${data.bonusEarned.toFixed(2)}`;
        }
    } catch (err) { console.error(err); }
}

// ===== PROMOTIONS =====
function initPromotions() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-item');
    if (!slides.length) return;
    function showSlide(n) { slides.forEach(s => s.classList.remove('active')); slides[n % slides.length].classList.add('active'); }
    window.moveCarousel = direction => { currentSlide = (currentSlide + direction + slides.length) % slides.length; showSlide(currentSlide); };
    showSlide(0);
}

// ===== LOGOUT =====
async function logout() {
    if (!sessionId) return;
    await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
    localStorage.removeItem('sessionId'); localStorage.removeItem('userId'); sessionId = null; userId = null;
    window.location.href = '/';
}

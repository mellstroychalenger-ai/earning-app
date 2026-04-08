// server.js - ОСНОВНИЙ БЕКЕНД СЕРВЕР
// Відповідальний за: реєстрацію, вхід, завдання, баланс користувачів, ліміт 5 користувачів

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ===== СХОВИЩЕ ДАНИХ (In-Memory) =====
let users = {}; // { userId: { username, password, email, balance, language, tasks: [] } }
let activeSessions = {}; // { sessionId: { userId, lastActivity, createdAt } }
let activeUsers = new Set(); // Набір активних користувачів

// ===== КОНСТАНТИ =====
const MAX_ACTIVE_USERS = 5;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 хвилин неактивності

// ===== ЗАДАЧІ (Демо) =====
const TASKS = [
  { id: 1, title_uk: 'Натисніть кнопку', title_en: 'Click the Button', title_ru: 'Нажмите кнопку', reward: 0.50, time: '1 хв' },
  { id: 2, title_uk: 'Оцініть продукт', title_en: 'Rate a Product', title_ru: 'Оцените продукт', reward: 1.00, time: '2 хв' },
  { id: 3, title_uk: 'Напишіть відгук', title_en: 'Write a Review', title_ru: 'Напишите отзыв', reward: 2.00, time: '5 хв' },
  { id: 4, title_uk: 'Подивіться відео', title_en: 'Watch Video', title_ru: 'Посмотреть видео', reward: 0.75, time: '3 хв' },
  { id: 5, title_uk: 'Опитування', title_en: 'Survey', title_ru: 'Опрос', reward: 1.50, time: '4 хв' }
];

// ===== ФУНКЦІЇ ОЧИЩЕННЯ =====
// Видалити неактивні сесії
function cleanUpSessions() {
  const now = Date.now();
  for (let sessionId in activeSessions) {
    if (now - activeSessions[sessionId].lastActivity > SESSION_TIMEOUT) {
      const userId = activeSessions[sessionId].userId;
      activeUsers.delete(userId);
      delete activeSessions[sessionId];
    }
  }
}

// Чистити сесії кожні 5 хвилин
setInterval(cleanUpSessions, 5 * 60 * 1000);

// ===== API ENDPOINTS =====

// 1️⃣ РЕЄСТРАЦІЯ
app.post('/api/register', (req, res) => {
  const { username, password, email, language } = req.body;

  // Перевірка заповненості полів
  if (!username || !password || !email) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Перевірка чи користувач вже існує
  const existingUser = Object.values(users).find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  // Створення нового користувача
  const userId = uuidv4();
  users[userId] = {
    username,
    password, // В реальній програмі використовуйте bcrypt!
    email,
    balance: 0,
    language: language || 'en',
    tasks: [],
    referralCode: userId.slice(0, 8),
    referredUsers: [],
    createdAt: new Date()
  };

  res.json({ success: true, message: 'Registration successful', userId });
});

// 2️⃣ ВХІД
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Пошук користувача
  const user = Object.entries(users).find(([id, u]) => u.username === username);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  const [userId, userData] = user;
  if (userData.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  // Перевірка ліміту 5 активних користувачів
  if (activeUsers.size >= MAX_ACTIVE_USERS && !activeUsers.has(userId)) {
    return res.status(429).json({ 
      success: false, 
      message: 'Server is at maximum capacity (5 active users). Please try again later.',
      limitReached: true 
    });
  }

  // Створення сесії
  const sessionId = uuidv4();
  activeSessions[sessionId] = {
    userId,
    lastActivity: Date.now(),
    createdAt: Date.now()
  };
  activeUsers.add(userId);

  res.json({ 
    success: true, 
    message: 'Login successful', 
    sessionId, 
    userId,
    balance: userData.balance,
    language: userData.language
  });
});

// 3️⃣ ОТРИМАТИ ДАНІ КОРИСТУВАЧА
app.get('/api/user/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions[sessionId];

  if (!session) {
    return res.status(401).json({ success: false, message: 'Invalid session' });
  }

  session.lastActivity = Date.now(); // Оновити час активності
  const user = users[session.userId];

  res.json({
    success: true,
    userId: session.userId,
    username: user.username,
    balance: user.balance,
    language: user.language,
    tasks: user.tasks || [],
    referralCode: user.referralCode,
    activeUsersCount: activeUsers.size,
    maxUsers: MAX_ACTIVE_USERS
  });
});

// 4️⃣ ОТРИМАТИ ЗАДАЧІ
app.get('/api/tasks', (req, res) => {
  res.json({ success: true, tasks: TASKS });
});

// 5️⃣ ЗАВЕРШИТИ ЗАДАЧУ
app.post('/api/complete-task', (req, res) => {
  const { sessionId, taskId } = req.body;
  const session = activeSessions[sessionId];

  if (!session) {
    return res.status(401).json({ success: false, message: 'Invalid session' });
  }

  session.lastActivity = Date.now();
  const task = TASKS.find(t => t.id === taskId);

  if (!task) {
    return res.status(400).json({ success: false, message: 'Task not found' });
  }

  const user = users[session.userId];
  user.balance += task.reward;
  user.tasks.push({
    taskId,
    title: task.title_en,
    reward: task.reward,
    completedAt: new Date(),
    language: user.language
  });

  res.json({
    success: true,
    message: 'Task completed!',
    newBalance: user.balance,
    reward: task.reward
  });
});

// 6️⃣ ОТРИМАТИ РЕФЕРАЛЬНЕ ПОСИЛАННЯ
app.get('/api/referral/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions[sessionId];

  if (!session) {
    return res.status(401).json({ success: false, message: 'Invalid session' });
  }

  const user = users[session.userId];
  const referralLink = `${req.get('origin')}/refer/${user.referralCode}`;

  res.json({
    success: true,
    referralCode: user.referralCode,
    referralLink,
    referredUsersCount: user.referredUsers.length,
    bonusEarned: user.referredUsers.length * 0.50
  });
});

// 7️⃣ ЗМІНА МОВИ
app.post('/api/change-language', (req, res) => {
  const { sessionId, language } = req.body;
  const session = activeSessions[sessionId];

  if (!session) {
    return res.status(401).json({ success: false, message: 'Invalid session' });
  }

  users[session.userId].language = language;
  res.json({ success: true, message: 'Language changed', language });
});

// 8️⃣ ВИХІД
app.post('/api/logout', (req, res) => {
  const { sessionId } = req.body;
  const session = activeSessions[sessionId];

  if (session) {
    activeUsers.delete(session.userId);
    delete activeSessions[sessionId];
  }

  res.json({ success: true, message: 'Logged out' });
});

// ===== СЕРВІС СТАТИЧНИХ ФАЙЛІВ =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== ЗАПУСК СЕРВЕРА =====
app.listen(PORT, () => {
  console.log(`🚀 Earning App Server запущений на http://localhost:${PORT}`);
  console.log(`📊 Максимум активних користувачів: ${MAX_ACTIVE_USERS}`);
});

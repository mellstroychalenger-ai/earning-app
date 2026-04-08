// Перемикання мови
const langSelect = document.getElementById("languageSelect");

langSelect.addEventListener("change", () => {
  const lang = langSelect.value;

  document.querySelectorAll("[data-en]").forEach(el => {
    const text = el.getAttribute(`data-${lang}`);
    if (text) el.textContent = text;
  });
});

// Кнопка старт
document.getElementById("startBtn").addEventListener("click", () => {
  window.location.href = "auth.html";
});

// Кнопка логіну
document.getElementById("loginBtn").addEventListener("click", () => {
  window.location.href = "auth.html";
});

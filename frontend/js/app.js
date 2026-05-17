/* =========================================================================
   AI EDUCATIONAL RECOMMENDATION SYSTEM - CLIENT CONTROLLER
   ========================================================================= */

const API_BASE = "http://127.0.0.1:5000";

// State Management
let currentUser = null;
let currentQuizId = null;
let currentQuizChapter = "";
let currentQuizQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // { questionId: selectedOption }

let progressChartInstance = null;
let chapterChartInstance = null;

// Initialize Page
document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication();
    setupEventListeners();
});

// Authentication Guard
function checkAuthentication() {
    const userJson = localStorage.getItem("student_user");
    const path = window.location.pathname;

    if (userJson) {
        currentUser = JSON.parse(userJson);
        // If on login page, redirect to dashboard
        if (path.includes("login.html") || path.endsWith("/login")) {
            window.location.href = "dashboard.html";
        }
    } else {
        // If on dashboard, redirect to login
        if (path.includes("dashboard.html") || path.endsWith("/dashboard")) {
            window.location.href = "login.html";
        }
    }

    // Set user profile info if logged in
    if (currentUser && document.getElementById("user-display-name")) {
        document.getElementById("user-display-name").innerText = currentUser.name;
        initializeDashboard();
    }
}

// Setup Global Event Listeners
function setupEventListeners() {
    // Portal Tabs (Login / Register Switch)
    const loginTab = document.getElementById("tab-login");
    const registerTab = document.getElementById("tab-register");

    if (loginTab && registerTab) {
        loginTab.addEventListener("click", () => {
            loginTab.classList.add("active");
            registerTab.classList.remove("active");
            document.getElementById("form-login").classList.add("active");
            document.getElementById("form-register").classList.remove("active");
        });

        registerTab.addEventListener("click", () => {
            registerTab.classList.add("active");
            loginTab.classList.remove("active");
            document.getElementById("form-register").classList.add("active");
            document.getElementById("form-login").classList.remove("active");
        });
    }
}

// Initialize Dashboard Data
function initializeDashboard() {
    loadDashboardStats();
    loadQuizzes();
    switchTab('dashboard'); // Default view
}

// Switch Sidebar Views
function switchTab(viewName) {
    // Update menu items
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach(item => {
        if (item.getAttribute("onclick").includes(`'${viewName}'`)) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Update view sections
    const sections = document.querySelectorAll(".view-section");
    sections.forEach(sec => {
        if (sec.id === `view-${viewName}`) {
            sec.classList.add("active");
        } else {
            sec.classList.remove("active");
        }
    });

    if (viewName === 'analytics') {
        // Redraw charts to ensure correct sizing
        loadDashboardStats();
    }
}

// Handle Logout
function logout() {
    localStorage.removeItem("student_user");
    window.location.href = "login.html";
}

// -------------------------------------------------------------------------
// AUTHENTICATION OPERATIONS
// -------------------------------------------------------------------------

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value.trim();
    const messageEl = document.getElementById("reg-message");

    messageEl.innerText = "";

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (res.ok) {
            messageEl.style.color = "var(--accent-success)";
            messageEl.innerText = "Registration successful! You can now log in.";
            // Auto switch to login tab after delay
            setTimeout(() => {
                document.getElementById("tab-login").click();
                document.getElementById("reg-name").value = "";
                document.getElementById("reg-email").value = "";
                document.getElementById("reg-password").value = "";
                messageEl.innerText = "";
            }, 1500);
        } else {
            messageEl.style.color = "var(--accent-danger)";
            messageEl.innerText = data.message || "Registration failed.";
        }
    } catch (err) {
        messageEl.style.color = "var(--accent-danger)";
        messageEl.innerText = "Error connecting to backend server.";
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const messageEl = document.getElementById("login-message");

    messageEl.innerText = "";

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // Save session
            localStorage.setItem("student_user", JSON.stringify(data.user));
            messageEl.style.color = "var(--accent-success)";
            messageEl.innerText = "Login successful! Redirecting...";
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        } else {
            messageEl.style.color = "var(--accent-danger)";
            messageEl.innerText = data.message || "Invalid credentials.";
        }
    } catch (err) {
        messageEl.style.color = "var(--accent-danger)";
        messageEl.innerText = "Error connecting to backend server.";
    }
}

// -------------------------------------------------------------------------
// DASHBOARD & ANALYTICS OPERATIONS
// -------------------------------------------------------------------------

async function loadDashboardStats() {
    if (!currentUser) return;

    try {
        const res = await fetch(`${API_BASE}/dashboard-stats/${currentUser.id}`);
        if (!res.ok) return;

        const data = await res.json();

        // Update cards on Dashboard home
        document.getElementById("stat-total-quizzes").innerText = data.total_quizzes;
        document.getElementById("stat-avg-score").innerText = `${data.average_score}%`;
        document.getElementById("stat-avg-mistakes").innerText = data.average_mistakes;
        
        const levelBadge = document.getElementById("stat-overall-level");
        levelBadge.innerText = data.overall_level;
        levelBadge.className = `badge badge-${data.overall_level.toLowerCase()}`;

        // Set Progress Level Bar
        const fillBar = document.getElementById("level-progress-bar");
        fillBar.className = `level-fill ${data.overall_level.toLowerCase()}`;

        // Update Weakest Chapter card
        const weakChapterEl = document.getElementById("weak-chapter-name");
        weakChapterEl.innerText = data.weakest_chapter;
        if (data.weakest_chapter !== "None") {
            document.getElementById("weakest-chapter-alert").style.display = "block";
            document.getElementById("no-weak-chapter").style.display = "none";
            // Pre-load recommendations based on weak chapter
            loadWeakChapterRecommendations(data.weakest_chapter, data.chapter_performance[data.weakest_chapter]);
        } else {
            document.getElementById("weakest-chapter-alert").style.display = "none";
            document.getElementById("no-weak-chapter").style.display = "block";
        }

        // Render analytics charts if on analytics tab
        if (document.getElementById("view-analytics").classList.contains("active")) {
            renderCharts(data);
        }
    } catch (err) {
        console.error("Error loading dashboard stats:", err);
    }
}

// Render dynamic Charts using Chart.js
function renderCharts(stats) {
    const ctxProgress = document.getElementById("progressChart");
    const ctxChapter = document.getElementById("chapterChart");

    if (!ctxProgress || !ctxChapter) return;

    // Destroy existing chart instances to avoid overlap
    if (progressChartInstance) progressChartInstance.destroy();
    if (chapterChartInstance) chapterChartInstance.destroy();

    // Chart.js global settings for beautiful look
    Chart.defaults.color = 'rgba(255, 255, 255, 0.6)';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    // 1. Progress Over Time Line Chart
    const historyDates = stats.history.map(h => h.date.split(" ")[0]);
    const historyScores = stats.history.map(h => h.score);
    const historyMistakes = stats.history.map(h => h.mistakes);

    progressChartInstance = new Chart(ctxProgress, {
        type: 'line',
        data: {
            labels: historyDates.length > 0 ? historyDates : ['No Data'],
            datasets: [
                {
                    label: 'Score (%)',
                    data: historyScores.length > 0 ? historyScores : [0],
                    borderColor: '#00b0ff',
                    backgroundColor: 'rgba(0, 176, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#00b0ff'
                },
                {
                    label: 'Mistakes Count',
                    data: historyMistakes.length > 0 ? historyMistakes : [0],
                    borderColor: '#ff1744',
                    backgroundColor: 'rgba(255, 23, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#ff1744'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    min: 0,
                    max: 100
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // 2. Chapter Performance Bar Chart
    const chapters = Object.keys(stats.chapter_performance);
    const avgScores = Object.values(stats.chapter_performance);

    chapterChartInstance = new Chart(ctxChapter, {
        type: 'bar',
        data: {
            labels: chapters.length > 0 ? chapters : ['No Data'],
            datasets: [{
                label: 'Average Score (%)',
                data: avgScores.length > 0 ? avgScores : [0],
                backgroundColor: [
                    'rgba(124, 77, 255, 0.7)',
                    'rgba(0, 176, 255, 0.7)',
                    'rgba(0, 230, 118, 0.7)'
                ],
                borderColor: [
                    '#7c4dff',
                    '#00b0ff',
                    '#00e676'
                ],
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    min: 0,
                    max: 100
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// -------------------------------------------------------------------------
// QUIZ OPERATIONS
// -------------------------------------------------------------------------

async function loadQuizzes() {
    try {
        const res = await fetch(`${API_BASE}/quizzes`);
        if (!res.ok) return;

        const quizzes = await res.json();
        const container = document.getElementById("quizzes-container");
        container.innerHTML = "";

        quizzes.forEach(quiz => {
            const card = document.createElement("div");
            card.className = "glass-card quiz-card";
            card.innerHTML = `
                <div>
                    <div class="quiz-meta">
                        <span class="quiz-difficulty ${quiz.difficulty}">${quiz.difficulty}</span>
                        <span class="badge badge-medium" style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: none;">${quiz.chapter}</span>
                    </div>
                    <h3 style="color: white; margin-bottom: 0.5rem; font-size: 1.2rem;">${quiz.title}</h3>
                </div>
                <button class="btn btn-primary" onclick="startQuiz(${quiz.id}, '${quiz.chapter}')">Start Quiz</button>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading quizzes:", err);
    }
}

async function startQuiz(quizId, chapter) {
    currentQuizId = quizId;
    currentQuizChapter = chapter;
    currentQuestionIndex = 0;
    userAnswers = {};

    try {
        const res = await fetch(`${API_BASE}/quizzes/${quizId}/questions`);
        if (!res.ok) return;

        currentQuizQuestions = await res.json();

        // Reset and Open Modal
        const modal = document.getElementById("quiz-modal");
        modal.classList.add("active");

        // Set modal interface to standard quiz questions
        document.getElementById("quiz-question-view").style.display = "block";
        document.getElementById("quiz-result-view").style.display = "none";

        showQuestion();
    } catch (err) {
        console.error("Error starting quiz:", err);
    }
}

function showQuestion() {
    if (currentQuizQuestions.length === 0) return;

    const q = currentQuizQuestions[currentQuestionIndex];
    document.getElementById("quiz-progress").innerText = `Question ${currentQuestionIndex + 1} of ${currentQuizQuestions.length}`;
    
    const questionBox = document.getElementById("quiz-question-box");
    questionBox.innerHTML = `
        <div class="quiz-question-text">${q.question_text}</div>
        <ul class="options-list">
            <li><button class="option-btn ${userAnswers[q.id] === 'A' ? 'selected' : ''}" onclick="selectOption('A')">A) ${q.option_a}</button></li>
            <li><button class="option-btn ${userAnswers[q.id] === 'B' ? 'selected' : ''}" onclick="selectOption('B')">B) ${q.option_b}</button></li>
            <li><button class="option-btn ${userAnswers[q.id] === 'C' ? 'selected' : ''}" onclick="selectOption('C')">C) ${q.option_c}</button></li>
            <li><button class="option-btn ${userAnswers[q.id] === 'D' ? 'selected' : ''}" onclick="selectOption('D')">D) ${q.option_d}</button></li>
        </ul>
    `;

    // Handle next button text
    const nextBtn = document.getElementById("quiz-next-btn");
    if (currentQuestionIndex === currentQuizQuestions.length - 1) {
        nextBtn.innerText = "Finish Quiz";
    } else {
        nextBtn.innerText = "Next Question";
    }
}

function selectOption(optionKey) {
    const q = currentQuizQuestions[currentQuestionIndex];
    userAnswers[q.id] = optionKey;

    // Toggle styling visually
    const buttons = document.querySelectorAll(".option-btn");
    buttons.forEach(btn => {
        if (btn.innerText.startsWith(optionKey)) {
            btn.classList.add("selected");
        } else {
            btn.classList.remove("selected");
        }
    });
}

function nextQuestion() {
    const q = currentQuizQuestions[currentQuestionIndex];
    if (!userAnswers[q.id]) {
        alert("Please select an answer before proceeding.");
        return;
    }

    if (currentQuestionIndex < currentQuizQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        submitQuiz();
    }
}

async function submitQuiz() {
    let correctCount = 0;
    
    currentQuizQuestions.forEach(q => {
        if (userAnswers[q.id] === q.correct_option) {
            correctCount++;
        }
    });

    const score = Math.round((correctCount / currentQuizQuestions.length) * 100);
    const mistakes = currentQuizQuestions.length - correctCount;

    try {
        // 1. Submit results to MySQL database
        await fetch(`${API_BASE}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                student_id: currentUser.id,
                quiz_id: currentQuizId,
                score: score,
                mistakes: mistakes
            })
        });

        // 2. Fetch ML predicted Level from Scikit-Learn RandomForest
        const resPredict = await fetch(`${API_BASE}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ score, mistakes })
        });
        const predictData = await resPredict.json();
        const mlLevel = predictData.level;

        // 3. Fetch personalized recommendations based on score and chapter
        const resRec = await fetch(`${API_BASE}/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chapter: currentQuizChapter, score })
        });
        const recommendations = await resRec.json();

        // Render Results in modal
        document.getElementById("quiz-question-view").style.display = "none";
        document.getElementById("quiz-result-view").style.display = "block";

        document.getElementById("res-score").innerText = `${score}%`;
        document.getElementById("res-mistakes").innerText = mistakes;
        
        const resLevel = document.getElementById("res-ml-level");
        resLevel.innerText = mlLevel;
        resLevel.className = `badge badge-${mlLevel.toLowerCase()}`;

        // Render recommendations dynamically in dashboard Recommendations Tab
        renderRecommendations(recommendations, currentQuizChapter, mlLevel);

        // Refresh stats
        loadDashboardStats();
    } catch (err) {
        console.error("Error submitting quiz results:", err);
    }
}

function closeQuizModal() {
    document.getElementById("quiz-modal").classList.remove("active");
    // Switch to Recommendations tab to show personalized outcomes
    switchTab('recommendations');
}

// -------------------------------------------------------------------------
// RECOMMENDATION OPERATIONS
// -------------------------------------------------------------------------

function renderRecommendations(resources, chapter, level) {
    const container = document.getElementById("recommendations-container");
    const titleEl = document.getElementById("recommendation-level-title");

    titleEl.innerText = `Personalized Learning recommendations: ${chapter} (${level})`;

    container.innerHTML = "";

    if (resources.length === 0) {
        container.innerHTML = `
            <div class="glass-card" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">
                No recommended resources found for this level in the database.
            </div>
        `;
        return;
    }

    resources.forEach(res => {
        const card = document.createElement("div");
        card.className = `glass-card resource-card ${res.type}`;
        card.innerHTML = `
            <div>
                <div class="resource-header">
                    <span class="resource-tag ${res.type}">${res.type}</span>
                </div>
                <div class="resource-title">${res.title}</div>
            </div>
            <a href="${res.link}" target="_blank" class="btn btn-secondary" style="margin-top: 1rem; width: 100%;">
                Start Learning
            </a>
        `;
        container.appendChild(card);
    });
}

// Fetch recommendations based on the weakest chapter discovered from historical statistics
async function loadWeakChapterRecommendations(chapter, avgScore) {
    try {
        const res = await fetch(`${API_BASE}/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chapter: chapter, score: avgScore })
        });
        if (!res.ok) return;

        const recommendations = await res.json();
        // Determine level description
        let level = "Weak";
        if (avgScore >= 40 && avgScore < 70) level = "Medium";
        else if (avgScore >= 70) level = "Strong";

        renderRecommendations(recommendations, chapter, level);
    } catch (err) {
        console.error("Error loading weak chapter recommendations:", err);
    }
}

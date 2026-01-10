/* ============================================
   Course Recommendation Quiz Logic
   ============================================ */

const quizData = [
    {
        question: "What excites you the most when you see a great website or app?",
        options: [
            { text: "The beautiful layout, colors, and visual design.", score: { design: 10, uiux: 8 } },
            { text: "The features - how login works, how data flows.", score: { fullstack: 10, python: 8 } },
            { text: "The speed and how it handles millions of users.", score: { aws: 10, devops: 10 } },
            { text: "The clear messaging and professional tone.", score: { softskills: 10, interview: 5 } }
        ]
    },
    {
        question: "Which activity sounds most enjoyable to you?",
        options: [
            { text: "Creating logos, posters, and visual branding.", score: { design: 10 } },
            { text: "Building apps and writing code that works.", score: { fullstack: 10, python: 10 } },
            { text: "Setting up servers and automating deployments.", score: { aws: 10, devops: 10 } },
            { text: "Presenting ideas and communicating confidently.", score: { softskills: 10, interview: 8 } }
        ]
    },
    {
        question: "What's your biggest career goal right now?",
        options: [
            { text: "Become a creative professional in design.", score: { design: 10, uiux: 10 } },
            { text: "Get a high-paying developer job at a tech company.", score: { fullstack: 10, python: 8, interview: 5 } },
            { text: "Work in cloud/DevOps and manage infrastructure.", score: { aws: 10, devops: 10 } },
            { text: "Improve my communication and ace interviews.", score: { softskills: 10, interview: 10 } }
        ]
    },
    {
        question: "How do you prefer to solve problems?",
        options: [
            { text: "By sketching, wireframing, and visualizing.", score: { uiux: 10, design: 5 } },
            { text: "By writing step-by-step logic and code.", score: { fullstack: 10, python: 10 } },
            { text: "By analyzing systems and optimizing performance.", score: { devops: 10, aws: 8 } },
            { text: "By discussing and finding collaborative solutions.", score: { softskills: 10, interview: 5 } }
        ]
    }
];

const courseRecommendations = {
    design: { title: "Graphic design", icon: "fas fa-paint-brush", url: "/courses/graphic-design/", desc: "Unleash your creativity and master branding with our graphic design excellence program." },
    uiux: { title: "UI/UX design", icon: "fas fa-object-group", url: "/courses/ui-ux/", desc: "Design interfaces that people love using Figma and modern design principles." },
    fullstack: { title: "Full stack development", icon: "fas fa-code", url: "/courses/full-stack/", desc: "Become a complete developer by mastering frontend, backend, and databases." },
    devops: { title: "DevOps engineering", icon: "fas fa-infinity", url: "/courses/devops/", desc: "Bridge the gap between development and operations with automation and CI/CD." },
    aws: { title: "AWS cloud excellence", icon: "fab fa-aws", url: "/courses/aws/", desc: "Master the world's leading cloud platform and build scalable infrastructure." },
    softskills: { title: "Spoken English mastery", icon: "fas fa-comments", url: "/courses/spoken-english/", desc: "Transform your personality and communication to excel in your professional career." },
    python: { title: "Python programming", icon: "fab fa-python", url: "/courses/python/", desc: "Learn the most versatile programming language and build powerful applications." },
    interview: { title: "Resume & interview prep", icon: "fas fa-file-alt", url: "/courses/resume-interview/", desc: "Master resume building, mock interviews, and land your dream job." }
};

let currentQuizStep = 0;
let userScores = {};

function initQuiz() {
    const quizTrigger = document.getElementById('startQuizBtn');
    const inlineContainer = document.getElementById('inlineQuizContainer');
    const ctaContent = document.getElementById('quizCtaContent');

    if (quizTrigger && inlineContainer) {
        // Use inline mode
        quizTrigger.addEventListener('click', function () {
            startInlineQuiz();
        });
    } else if (quizTrigger) {
        // Fallback to modal mode
        quizTrigger.addEventListener('click', openQuizModal);
        createModalIfNeeded();
    }
}

function startInlineQuiz() {
    const inlineContainer = document.getElementById('inlineQuizContainer');
    const ctaContent = document.getElementById('quizCtaContent');
    const quizCard = document.getElementById('quizCtaCard');

    if (!inlineContainer || !ctaContent) return;

    // Hide the CTA content and show quiz
    ctaContent.style.display = 'none';
    inlineContainer.classList.add('active');
    quizCard.classList.add('quiz-active');

    // Reduce section padding for a tighter fit
    const section = quizCard.closest('.quiz-cta-section');
    if (section) section.style.padding = '40px 0';

    // Start the quiz
    currentQuizStep = 0;
    userScores = {};
    renderInlineQuestion();
}

function renderInlineQuestion() {
    const quizBody = document.getElementById('inlineQuizBody');
    if (!quizBody) return;

    const question = quizData[currentQuizStep];

    quizBody.innerHTML = `
        <div class="inline-quiz-question">
            <div class="quiz-progress-bar">
                <div class="quiz-progress-fill" style="width: ${((currentQuizStep + 1) / quizData.length) * 100}%"></div>
            </div>
            <span class="quiz-step-indicator">Question ${currentQuizStep + 1} of ${quizData.length}</span>
            <h3>${question.question}</h3>
            <div class="quiz-options">
                ${question.options.map((opt, idx) => `
                    <button class="quiz-option" data-option-index="${idx}">
                        ${opt.text}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // Add event listeners to options
    const options = quizBody.querySelectorAll('.quiz-option');
    options.forEach(option => {
        option.addEventListener('click', function () {
            const optionIdx = parseInt(this.getAttribute('data-option-index'));
            handleInlineOptionSelect(optionIdx);
        });
    });
}

function handleInlineOptionSelect(optionIdx) {
    const option = quizData[currentQuizStep].options[optionIdx];

    // Aggregate scores
    for (const [key, val] of Object.entries(option.score)) {
        userScores[key] = (userScores[key] || 0) + val;
    }

    currentQuizStep++;

    if (currentQuizStep < quizData.length) {
        renderInlineQuestion();
    } else {
        renderInlineResult();
    }
}

function renderInlineResult() {
    const quizBody = document.getElementById('inlineQuizBody');
    if (!quizBody) return;

    // Find highest score
    let bestMatchKey = 'fullstack';
    let maxScore = -1;

    for (const [key, score] of Object.entries(userScores)) {
        if (score > maxScore) {
            maxScore = score;
            bestMatchKey = key;
        }
    }

    const recommendation = courseRecommendations[bestMatchKey] || courseRecommendations['fullstack'];

    quizBody.innerHTML = `
        <div class="inline-quiz-result">
            <div class="result-badge">🎉 Perfect match found!</div>
            <div class="result-icon"><i class="${recommendation.icon}"></i></div>
            <h2>We recommend: ${recommendation.title}</h2>
            <p>${recommendation.desc}</p>
            <div class="result-actions">
                <a href="https://wa.me/917842239090?text=I'd like to enroll in ${recommendation.title}!" target="_blank" class="btn btn-primary">
                    <i class="fab fa-whatsapp"></i> Enroll via WhatsApp
                </a>
                <span class="result-divider">or</span>
                <a href="${recommendation.url}" class="btn btn-secondary">View course details</a>
            </div>
            <button class="quiz-restart" id="inlineRestartBtn"><i class="fas fa-dice"></i> Take another quiz</button>
        </div>
    `;

    // Add event listener for restart button
    const restartBtn = quizBody.querySelector('#inlineRestartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', resetInlineQuiz);
    }
}

function resetInlineQuiz() {
    const inlineContainer = document.getElementById('inlineQuizContainer');
    const ctaContent = document.getElementById('quizCtaContent');
    const quizCard = document.getElementById('quizCtaCard');

    if (!inlineContainer || !ctaContent) return;

    // Show the CTA content and hide quiz
    inlineContainer.classList.remove('active');
    quizCard.classList.remove('quiz-active');
    ctaContent.style.display = '';

    // Restore section padding
    const section = quizCard.closest('.quiz-cta-section');
    if (section) section.style.padding = '';

    // Reset state
    currentQuizStep = 0;
    userScores = {};
}

function createModalIfNeeded() {
    // Modal creation and injection (fallback for pages without inline container)
    if (!document.getElementById('quizModal')) {
        const modalHtml = `
            <div id="quizModal" class="quiz-modal">
                <div class="quiz-modal-content">
                    <button class="quiz-close" id="quizCloseBtn" aria-label="Close quiz">&times;</button>
                    <div id="quizBody">
                        <div class="quiz-intro">
                            <i class="fas fa-graduation-cap quiz-main-icon"></i>
                            <h2>Find Your Perfect Career Path</h2>
                            <p>Answer 3 quick questions and we'll recommend the best course for you!</p>
                            <button class="btn btn-primary" id="quizStartBtn">Get Started</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        injectQuizStyles();

        const closeBtn = document.getElementById('quizCloseBtn');
        const startBtn = document.getElementById('quizStartBtn');
        const modal = document.getElementById('quizModal');

        if (closeBtn) closeBtn.addEventListener('click', closeQuizModal);
        if (startBtn) startBtn.addEventListener('click', startQuiz);
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeQuizModal();
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
                closeQuizModal();
            }
        });
    }
}

function openQuizModal() {
    const modal = document.getElementById('quizModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeQuizModal() {
    const modal = document.getElementById('quizModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            currentQuizStep = 0;
            userScores = {};
            renderQuizIntro();
        }, 300);
    }
}

function renderQuizIntro() {
    const quizBody = document.getElementById('quizBody');
    if (!quizBody) return;
    quizBody.innerHTML = `
        <div class="quiz-intro">
            <i class="fas fa-graduation-cap quiz-main-icon"></i>
            <h2>Find Your Perfect Career Path</h2>
            <p>Answer 3 quick questions and we'll recommend the best course for you!</p>
            <button class="btn btn-primary" id="modalStartBtn">Get Started</button>
        </div>
    `;
    const startBtn = quizBody.querySelector('#modalStartBtn');
    if (startBtn) startBtn.addEventListener('click', startQuiz);
}

function startQuiz() {
    currentQuizStep = 0;
    userScores = {};
    renderQuestion();
}

function renderQuestion() {
    const quizBody = document.getElementById('quizBody');
    if (!quizBody) return;

    const question = quizData[currentQuizStep];

    quizBody.innerHTML = `
        <div class="quiz-question-container">
            <div class="quiz-progress-bar">
                <div class="quiz-progress-fill" style="width: ${((currentQuizStep + 1) / quizData.length) * 100}%"></div>
            </div>
            <span class="quiz-step-indicator">Question ${currentQuizStep + 1} of ${quizData.length}</span>
            <h3>${question.question}</h3>
            <div class="quiz-options">
                ${question.options.map((opt, idx) => `
                    <button class="quiz-option" data-option-index="${idx}">
                        ${opt.text}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    const options = quizBody.querySelectorAll('.quiz-option');
    options.forEach(option => {
        option.addEventListener('click', function () {
            const optionIdx = parseInt(this.getAttribute('data-option-index'));
            handleOptionSelect(optionIdx);
        });
    });
}

function handleOptionSelect(optionIdx) {
    const option = quizData[currentQuizStep].options[optionIdx];

    for (const [key, val] of Object.entries(option.score)) {
        userScores[key] = (userScores[key] || 0) + val;
    }

    currentQuizStep++;

    if (currentQuizStep < quizData.length) {
        renderQuestion();
    } else {
        renderResult();
    }
}

function renderResult() {
    const quizBody = document.getElementById('quizBody');
    if (!quizBody) return;

    let bestMatchKey = 'fullstack';
    let maxScore = -1;

    for (const [key, score] of Object.entries(userScores)) {
        if (score > maxScore) {
            maxScore = score;
            bestMatchKey = key;
        }
    }

    const recommendation = courseRecommendations[bestMatchKey] || courseRecommendations['fullstack'];

    quizBody.innerHTML = `
        <div class="quiz-result" style="animation: slideUp 0.5s ease-out;">
            <div class="result-badge">Perfect Match Found!</div>
            <div class="result-icon"><i class="${recommendation.icon}"></i></div>
            <h2>We Recommend: ${recommendation.title}</h2>
            <p>${recommendation.desc}</p>
            <div class="result-actions">
                <a href="https://wa.me/917842239090?text=I'd like to enroll in ${recommendation.title}!" target="_blank" class="btn btn-primary">
                    <i class="fab fa-whatsapp"></i> Enroll via WhatsApp
                </a>
                <a href="${recommendation.url}" class="btn btn-secondary">View Course Details</a>
            </div>
            <button class="quiz-restart" id="quizRestartBtn">← Take Another Quiz</button>
        </div>
    `;

    const restartBtn = quizBody.querySelector('#quizRestartBtn');
    if (restartBtn) restartBtn.addEventListener('click', startQuiz);
}

function injectQuizStyles() {
    const sty = document.createElement('style');
    sty.textContent = `
        .quiz-modal {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            z-index: 3000;
            opacity: 0; visibility: hidden;
            transition: all 0.3s ease;
        }
        .quiz-modal.active { opacity: 1; visibility: visible; }
        .quiz-modal-content {
            background: white;
            width: 90%; max-width: 500px;
            padding: 40px; border-radius: 24px;
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            text-align: center;
        }
        .quiz-close {
            position: absolute; top: 20px; right: 20px;
            background: none; border: none; font-size: 24px;
            cursor: pointer; color: #64748b;
        }
        .quiz-main-icon { font-size: 3rem; color: #6c5ce7; margin-bottom: 20px; }
        .quiz-intro h2 { margin-bottom: 12px; font-size: 1.75rem; color: #1e293b; }
        .quiz-intro p { color: #64748b; margin-bottom: 30px; }
        
        .quiz-progress-bar { width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; margin-bottom: 20px; overflow: hidden; }
        .quiz-progress-fill { height: 100%; background: #6c5ce7; transition: width 0.3s ease; }
        .quiz-step-indicator { display: block; font-size: 0.8rem; color: #64748b; margin-bottom: 8px; font-weight: 500; }
        
        .quiz-question-container h3 { margin-bottom: 24px; font-size: 1.4rem; color: #1e293b; line-height: 1.4; }
        .quiz-options { display: grid; gap: 12px; }
        .quiz-option {
            padding: 16px 20px; border: 2px solid #e2e8f0; border-radius: 12px;
            background: white; cursor: pointer; text-align: left;
            font-size: 1rem; color: #334155; font-weight: 500;
            transition: all 0.2s ease;
        }
        .quiz-option:hover { border-color: #6c5ce7; background: #f8fafc; transform: translateX(5px); }
        
        .quiz-result .result-badge { 
            display: inline-block; padding: 6px 16px; background: rgba(0, 184, 148, 0.1);
            color: #00b894; border-radius: 50px; font-weight: 700; font-size: 0.75rem;
            margin-bottom: 15px; letter-spacing: 1px;
        }
        .result-icon { font-size: 4rem; color: #6c5ce7; margin-bottom: 20px; }
        .quiz-result h2 { font-size: 1.8rem; margin-bottom: 15px; color: #1e293b; }
        .quiz-result p { color: #64748b; margin-bottom: 30px; line-height: 1.6; }
        .result-actions { display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px; }
        .quiz-restart { background: none; border: none; color: #6c5ce7; text-decoration: underline; cursor: pointer; font-size: 0.9rem; }
        
        /* Inline Quiz Styles */
        .inline-quiz-container {
            display: none;
            width: 100%;
            max-height: 500px;
            overflow-y: auto;
            padding: 20px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            margin-top: 20px;
        }
        .inline-quiz-container.active { display: block; animation: slideUp 0.4s ease-out; }
        .quiz-cta-card.quiz-active { flex-direction: column; }
        .quiz-cta-card.quiz-active .quiz-cta-image { display: none; }
        
        .inline-quiz-question h3 { color: #1e293b; margin-bottom: 20px; font-size: 1.25rem; line-height: 1.5; }
        .inline-quiz-result { 
            text-align: center; 
            padding: 30px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            color: white;
        }
        .inline-quiz-result .result-badge {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.85rem;
            display: inline-block;
            margin-bottom: 15px;
        }
        .inline-quiz-result .result-icon {
            font-size: 3rem;
            color: white;
            opacity: 0.9;
            margin-bottom: 15px;
        }
        .inline-quiz-result h2 { color: white; font-size: 1.5rem; margin-bottom: 10px; }
        .inline-quiz-result p { color: rgba(255, 255, 255, 0.85); margin-bottom: 25px; }
        .inline-quiz-result .result-actions { 
            display: flex; 
            flex-direction: row; 
            flex-wrap: wrap; 
            justify-content: center; 
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        .inline-quiz-result .result-divider {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.85rem;
            text-transform: uppercase;
            font-weight: 500;
        }
        .inline-quiz-result .btn-primary {
            background: white;
            color: #667eea;
        }
        .inline-quiz-result .btn-secondary {
            background: transparent;
            border: 2px solid white;
            color: white;
        }
        .inline-quiz-result .btn-secondary:hover {
            background: white;
            color: #667eea;
        }
        .inline-quiz-result .quiz-restart {
            background: rgba(255, 255, 255, 0.15);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .inline-quiz-result .quiz-restart:hover {
            background: rgba(255, 255, 255, 0.25);
        }
        
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(sty);
}

document.addEventListener('DOMContentLoaded', initQuiz);
window.startQuiz = startQuiz;
window.handleOptionSelect = handleOptionSelect;
window.closeQuizModal = closeQuizModal;
window.openQuizModal = openQuizModal;
window.resetInlineQuiz = resetInlineQuiz;

// Initialize quiz state
let currentQuestionIndex = 0;
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let shuffledQuestions = [];

// State management functions
function saveState() {
  localStorage.setItem('quizProgress', JSON.stringify({
    currentQuestionIndex,
    score
  }));
}

function loadState() {
  const saved = localStorage.getItem('quizProgress');
  if (saved) {
    const { currentQuestionIndex: savedIndex, score: savedScore } = JSON.parse(saved);
    currentQuestionIndex = savedIndex;
    score = savedScore;
//    scoreEl.textContent = `Score: ${score}`;
  }
}

// DOM elements
const questionEl = document.getElementById("question-text");
const optionsEl = document.querySelector(".answers-grid");
const correctBadge = document.getElementById("correct-badge");
const wrongBadge = document.getElementById("wrong-badge");
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const imageContainer = document.getElementById('image-container');
const svgEl = document.querySelector('.quiz-image');
const currentQuestionEl = document.querySelector('.current-question');
const totalQuestionsEl = document.querySelector('.total-questions');

async function loadSVGFigure(file, figureNumber) {
  try {
    // Show loading state
    imageContainer.classList.add('loading');
    
    // Fetch SVG file
    const response = await fetch(`lights/${file}`);
    if (!response.ok) throw new Error('Failed to fetch SVG');
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    
    // Find target figure
    const figure = svgDoc.getElementById(`fig${figureNumber}`);
    if (!figure) throw new Error('Figure not found');
    
    // Clear and append new SVG content
    svgEl.innerHTML = '';
    svgEl.append(...figure.children);
    svgEl.dataset.currentFile = file;
    
    // Update styles
    imageContainer.classList.remove('error', 'loading');
    imageContainer.classList.add('has-image');
  } catch (error) {
    imageContainer.classList.remove('loading');
    imageContainer.classList.add('error');
    console.error('SVG load error:', error);
  }
}

function showQuestion() {
  const question = shuffledQuestions[currentQuestionIndex];
  document.getElementById('current-qid').textContent = question.id;
  questionEl.textContent = question.question;
//  currentQuestionEl.textContent = currentQuestionIndex + 1;
//  totalQuestionsEl.textContent = questions.length;
  
  optionsEl.innerHTML = question.options.map(opt => `
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect option" data-letter="${opt.letter}">
      <span class="option-letter">${opt.letter}:</span> ${opt.text}
    </button>
  `).join("");
  
  // Upgrade the dynamically created MDL elements
  if (typeof componentHandler !== 'undefined') {
    componentHandler.upgradeElements(optionsEl);
  }

  // Add click handlers
  optionsEl.querySelectorAll(".option").forEach(btn => {
    btn.addEventListener("click", handleAnswer);
  });

  // Handle image display
  if (question.imageRef) {
    loadSVGFigure(question.imageRef.file, question.imageRef.number);
  } else {
    imageContainer.classList.remove('has-image', 'error');
    svgEl.innerHTML = '';
    svgEl.removeAttribute('data-current-file');
  }

  // Update navigation state
  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.disabled = currentQuestionIndex === questions.length - 1;
}

function handleAnswer(e) {
  const selectedButton = e.target;
  const question = shuffledQuestions[currentQuestionIndex];
  const correctButton = Array.from(optionsEl.children).find(
    btn => btn.dataset.letter === question.correctAnswer
  );

  // Always highlight correct answer
  correctButton.classList.add('correct-answer', 'show-correct', 'mdl-button--accent');
  
  if (selectedButton.dataset.letter === question.correctAnswer) {
    selectedButton.classList.add('correct', 'mdl-button--accent');
    score++;
    correctCount++;
  } else {
    selectedButton.classList.add('incorrect');
    wrongCount++;
  }

  // Scroll to correct answer if not fully visible
  correctButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Disable all options
  optionsEl.querySelectorAll('.option').forEach(btn => {
    btn.disabled = true;
  });

  updateStatsDisplay();
  saveState();
}

// Quiz initialization
function initializeQuiz() {
  shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
  currentQuestionIndex = 0;
  score = 0;
  correctCount = 0;
  wrongCount = 0;
  updateStatsDisplay();
  showQuestion();
}

function updateStatsDisplay() {
  document.getElementById('correct-count').textContent = correctCount;
  document.getElementById('wrong-count').textContent = wrongCount;
  
  // Update the badges in the header
  correctBadge.setAttribute('data-badge', correctCount);
  wrongBadge.setAttribute('data-badge', wrongCount);
}

// Start quiz
loadState();
initializeQuiz();

// Navigation handlers
prevBtn.addEventListener('click', () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    resetQuestionState();
    showQuestion();
    saveState();
  }
});

nextBtn.addEventListener('click', () => {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    resetQuestionState();
    showQuestion();
    saveState();
  }
});

function resetQuestionState() {
  // Clear selection and enable options
  optionsEl.querySelectorAll('.option').forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('correct', 'incorrect');
  });
}

// Image Gallery Functionality
function initImageGallery() {
  const imageFiles = [
    '1-19.svg', '20-39.svg', '40-58.svg',
    '59-74.svg', '75-90.svg', '91-110.svg', '111-126.svg', 'basic_light.svg', 'boats.svg'
  ];

  const buttonsContainer = document.getElementById('image-buttons');
  const modal = document.getElementById('image-modal');
  const closeBtn = document.querySelector('.close');
  const modalImage = document.getElementById('modal-image');

  // Create gallery buttons
  imageFiles.forEach(file => {
    const btn = document.createElement('button');
    btn.className = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect gallery-button';
    btn.textContent = file.replace('.svg', '').replace('_', ' ');
    btn.addEventListener('click', () => showImageModal(file));
    buttonsContainer.appendChild(btn);
  });
  
  // Upgrade the dynamically created MDL elements
  if (typeof componentHandler !== 'undefined') {
    componentHandler.upgradeElements(buttonsContainer);
  }

  // Modal controls
  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
}

async function showImageModal(filename) {
  try {
    const response = await fetch(`pics/${filename}`);
    const svgContent = await response.text();
    document.getElementById('modal-image').innerHTML = svgContent;
    document.getElementById('image-modal').style.display = 'block';
  } catch (error) {
    console.error('Error loading image:', error);
  }
}

// Initialize gallery and upgrade MDL components after DOM loads
document.addEventListener('DOMContentLoaded', function() {
  initImageGallery();
  
  // Ensure MDL is properly initialized for dynamically created elements
  if (typeof componentHandler !== 'undefined') {
    componentHandler.upgradeDom();
  }
});

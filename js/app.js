// Initialize quiz state
let currentQuestionIndex = 0;
let score = 0;

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
    scoreEl.textContent = `Score: ${score}`;
  }
}

// DOM elements
const questionEl = document.getElementById("question");
const optionsEl = document.querySelector(".answers-grid");
const scoreEl = document.getElementById("score");
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
  const question = questions[currentQuestionIndex];
  questionEl.textContent = question.question;
  currentQuestionEl.textContent = currentQuestionIndex + 1;
  totalQuestionsEl.textContent = questions.length;
  
  optionsEl.innerHTML = question.options.map(opt => `
    <button class="option" data-letter="${opt.letter}">
      ${opt.letter}: ${opt.text}
    </button>
  `).join("");

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
  const question = questions[currentQuestionIndex];
  const correctButton = Array.from(optionsEl.children).find(
    btn => btn.dataset.letter === question.correctAnswer
  );

  // Always highlight correct answer
  correctButton.classList.add('correct-answer', 'show-correct');
  
  if (selectedButton.dataset.letter === question.correctAnswer) {
    selectedButton.classList.add('correct');
    score++;
  } else {
    selectedButton.classList.add('incorrect');
  }

  // Scroll to correct answer if not fully visible
  correctButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Disable all options
  optionsEl.querySelectorAll('.option').forEach(btn => {
    btn.disabled = true;
  });

  scoreEl.textContent = `Score: ${score}`;
  saveState();
}

// Start quiz
loadState();
showQuestion();

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

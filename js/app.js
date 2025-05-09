// Import performance tracking
import { QuestionPerformance, getPerformanceColor } from './questionPerformance.js';

// Initialize quiz state
let currentQuestionIndex = 0;
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let shuffledQuestions = [];
const performanceTracker = new QuestionPerformance();

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
    const image = renderGalleryButton(question.imageRef)
    imageContainer.hidden = !image;
  } else {
    imageContainer.hidden = true;
  }

  // Update navigation state
  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.disabled = currentQuestionIndex === allQuestions.length - 1;
}

function renderGalleryButton(imageRef) {
    imageContainer.classList.remove('has-image', 'error');
    imageContainer.innerHTML = '';
    const imageRefs = Array.isArray(imageRef) ? imageRef : [imageRef];
    for (const imageRef of imageRefs) {
        const image = document.querySelector('#preloaded-images #p' + imageRef.number);
        image && imageContainer.append(image);
    }
    return imageRefs.length;
}

function handleAnswer(e) {
  const selectedButton = e.target.parentNode;
  const question = shuffledQuestions[currentQuestionIndex];
  const correctButton = Array.from(optionsEl.children).find(
    btn => btn.dataset.letter === question.correctAnswer
  );

  // Always highlight correct answer
  correctButton.classList.add('correct-answer', 'show-correct', 'mdl-button--accent');
  
  const isCorrect = selectedButton.dataset.letter === question.correctAnswer;
  if (isCorrect) {
    selectedButton.classList.add('correct');
    score++;
    correctCount++;
  } else {
    selectedButton.classList.add('incorrect');
    wrongCount++;
  }

  // Record the attempt
  performanceTracker.recordAttempt(question.id, isCorrect);

  // Scroll to correct answer if not fully visible
  correctButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Disable all options
  optionsEl.querySelectorAll('.option').forEach(btn => {
    btn.disabled = true;
  });

  updateStatsDisplay();
  updateHeatmap();
}

// Quiz initialization
function initializeQuiz() {
  shuffledQuestions = performanceTracker.getSmartShuffledQuestions(allQuestions);
  currentQuestionIndex = 0;
  score = 0;
  correctCount = 0;
  wrongCount = 0;
  updateStatsDisplay();
  showQuestion();
}

function updateStatsDisplay() {
  // Update the badges in the header
  correctBadge.setAttribute('data-badge', correctCount);
  wrongBadge.setAttribute('data-badge', wrongCount);
}

// Start quiz
initializeQuiz();

// Navigation handlers
prevBtn.addEventListener('click', () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    resetQuestionState();
    showQuestion();
  }
});

nextBtn.addEventListener('click', () => {
  if (currentQuestionIndex < allQuestions.length - 1) {
    currentQuestionIndex++;
    resetQuestionState();
    showQuestion();
  }
});

function resetQuestionState() {
  // Clear selection and enable options
  optionsEl.querySelectorAll('.option').forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('correct', 'incorrect', 'correct-answer', 'show-correct', 'mdl-button--accent');
  });
}

// Image Gallery Functionality
function initImageGallery() {
  const imageFiles = [
    '1-19.png', '20-39.png', '40-58.png',
    '59-74.png', '75-90.png', '91-110.png', '111-126.png', 'basic_light.png', 'boats.png'
  ];

  const buttonsContainer = document.getElementById('image-buttons');
  const modal = document.getElementById('image-modal');
  const closeBtn = document.querySelector('.close');
  const modalImage = document.getElementById('modal-image');

  // Create gallery buttons
  imageFiles.forEach(file => {
    const btn = document.createElement('button');
    btn.className = 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect gallery-button';
    btn.textContent = file.replace('.png', '').replace('_', ' ');
    btn.addEventListener('click', () => showImageModal(file));
    buttonsContainer.appendChild(btn);
  });
  
  // Upgrade the dynamically created MDL elements
  if (typeof componentHandler !== 'undefined') {
    componentHandler.upgradeElements(buttonsContainer);
  }

  // Modal controls
  closeBtn.addEventListener('click', () => modal.style.display = 'none');
}

function showImageModal(filename) {
  // Get the preloaded image
  const preloadedImage = document.getElementById('p' + filename.replace('.png', ''));
  if (!preloadedImage) {
    console.error('Preloaded image not found:', filename);
    return;
  }

  // Set the image source
  const modalImage = document.getElementById('modal-image');
  modalImage.src = preloadedImage.src;
  modalImage.alt = preloadedImage.alt;
  
  // Show the modal
  const modal = document.getElementById('image-modal');
  modal.style.display = 'block';
  
  // Reset scroll position
  const scrollContainer = document.querySelector('.image-scroll-container');
  if (scrollContainer) {
    scrollContainer.scrollTop = 0;
    scrollContainer.scrollLeft = 0;
  }
}

// Initialize gallery and upgrade MDL components after DOM loads
document.addEventListener('DOMContentLoaded', function() {
  initImageGallery();
  initHeatmap();
  
  // Ensure MDL is properly initialized for dynamically created elements
  if (typeof componentHandler !== 'undefined') {
    componentHandler.upgradeDom();
  }
});

// Initialize heatmap
function initHeatmap() {
  const heatmapContainer = document.createElement('div');
  heatmapContainer.className = 'performance-heatmap';
  
  const title = document.createElement('div');
  title.className = 'heatmap-title';
  title.textContent = window.heatmapTranslations.title;
  
  const grid = document.createElement('div');
  grid.className = 'heatmap-grid';
  
  heatmapContainer.appendChild(title);
  heatmapContainer.appendChild(grid);
  
  // Insert heatmap after the quiz container
  document.querySelector('.image-gallery').after(heatmapContainer);
  
  updateHeatmap();
}

// Update heatmap display
function updateHeatmap() {
  const grid = document.querySelector('.heatmap-grid');
  grid.innerHTML = '';
  
  allQuestions.forEach(question => {
    const performance = performanceTracker.getPerformance(question.id);
    const link = document.createElement('a');
    link.className = 'performance-link';
    link.href = '#';
    
    const percentage = Math.round(performance.percentage);
    const textColor = getPerformanceColor(percentage);
    
    const performanceText = document.createElement('span');
    performanceText.className = 'performance-text';
    performanceText.style.color = textColor;
    performanceText.textContent = `Q${question.id}: ${percentage}%`;
    
    link.appendChild(performanceText);
    
    // Add click handler for navigation
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const index = shuffledQuestions.findIndex(q => q.id === question.id);
      if (index !== -1) {
        currentQuestionIndex = index;
        resetQuestionState();
        showQuestion();

        // Scroll the question into view
        document.querySelector('.quiz-container').scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    grid.appendChild(link);
  });
}

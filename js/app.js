// Import performance tracking
import { QuestionPerformance, getPerformanceColor } from './questionPerformance.js';

// Initialize quiz state
let currentQuestionIndex = 0;
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let shuffledQuestions = [];
const performanceTracker = new QuestionPerformance();

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
  
  const isCorrect = selectedButton.dataset.letter === question.correctAnswer;
  if (isCorrect) {
    selectedButton.classList.add('correct', 'mdl-button--accent');
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
  saveState();
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
    
    // Show the modal
    const modal = document.getElementById('image-modal');
    modal.style.display = 'block';
    
    // Initialize scrolling functionality
    initializeScrollControls();
    
    // Reset scroll position
    const scrollContainer = document.querySelector('.image-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
      scrollContainer.scrollLeft = 0;
    }
  } catch (error) {
    console.error('Error loading image:', error);
  }
}

// Initialize scroll controls for the image modal
function initializeScrollControls() {
  const scrollContainer = document.querySelector('.image-scroll-container');
  const scrollLeft = document.getElementById('scroll-left');
  const scrollRight = document.getElementById('scroll-right');
  const scrollUp = document.getElementById('scroll-up');
  const scrollDown = document.getElementById('scroll-down');
  
  // Scroll amount (pixels)
  const scrollAmount = 100;
  
  // Button click handlers
  scrollLeft.addEventListener('click', () => {
    scrollContainer.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  });
  
  scrollRight.addEventListener('click', () => {
    scrollContainer.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  });
  
  scrollUp.addEventListener('click', () => {
    scrollContainer.scrollBy({
      top: -scrollAmount,
      behavior: 'smooth'
    });
  });
  
  scrollDown.addEventListener('click', () => {
    scrollContainer.scrollBy({
      top: scrollAmount,
      behavior: 'smooth'
    });
  });
  
  // Add touch swipe support for mobile
  let touchStartX = 0;
  let touchStartY = 0;
  
  scrollContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  
  scrollContainer.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    // Calculate distance moved
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Determine if horizontal or vertical swipe based on which has larger movement
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > 50) {
        // Swipe left to right (scroll right)
        scrollContainer.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      } else if (diffX < -50) {
        // Swipe right to left (scroll left)
        scrollContainer.scrollBy({
          left: -scrollAmount,
          behavior: 'smooth'
        });
      }
    } else {
      // Vertical swipe
      if (diffY > 50) {
        // Swipe up to down (scroll down)
        scrollContainer.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
      } else if (diffY < -50) {
        // Swipe down to up (scroll up)
        scrollContainer.scrollBy({
          top: -scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  }, { passive: true });
  
  // Add keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Only process if modal is visible
    if (document.getElementById('image-modal').style.display === 'block') {
      switch (e.key) {
        case 'ArrowLeft':
          scrollContainer.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
          });
          e.preventDefault();
          break;
        case 'ArrowRight':
          scrollContainer.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
          });
          e.preventDefault();
          break;
        case 'ArrowUp':
          scrollContainer.scrollBy({
            top: -scrollAmount,
            behavior: 'smooth'
          });
          e.preventDefault();
          break;
        case 'ArrowDown':
          scrollContainer.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
          });
          e.preventDefault();
          break;
      }
    }
  });
  
  // Show/hide scroll indicators based on scroll position
  scrollContainer.addEventListener('scroll', () => {
    // Check if we can scroll in each direction
    const canScrollLeft = scrollContainer.scrollLeft > 0;
    const canScrollRight = scrollContainer.scrollLeft < (scrollContainer.scrollWidth - scrollContainer.clientWidth);
    const canScrollUp = scrollContainer.scrollTop > 0;
    const canScrollDown = scrollContainer.scrollTop < (scrollContainer.scrollHeight - scrollContainer.clientHeight);
    
    // Update visibility of scroll indicators
    scrollLeft.style.opacity = canScrollLeft ? '0.7' : '0.3';
    scrollRight.style.opacity = canScrollRight ? '0.7' : '0.3';
    scrollUp.style.opacity = canScrollUp ? '0.7' : '0.3';
    scrollDown.style.opacity = canScrollDown ? '0.7' : '0.3';
  });
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
        saveState();
        
        // Scroll the question into view
        document.querySelector('.quiz-container').scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    grid.appendChild(link);
  });
}

export class QuestionPerformance {
  constructor() {
    this.performanceData = this.loadPerformanceData();
  }

  loadPerformanceData() {
    const saved = localStorage.getItem('questionPerformance');
    return saved ? JSON.parse(saved) : {};
  }

  savePerformanceData() {
    localStorage.setItem('questionPerformance', JSON.stringify(this.performanceData));
  }

  initializeQuestion(questionId) {
    if (!this.performanceData[questionId]) {
      this.performanceData[questionId] = {
        attempts: 0,
        correct: 0,
        percentage: 0
      };
    }
  }

  recordAttempt(questionId, isCorrect) {
    this.initializeQuestion(questionId);
    const data = this.performanceData[questionId];
    data.attempts++;
    if (isCorrect) data.correct++;
    data.percentage = (data.correct / data.attempts) * 100;
    this.savePerformanceData();
  }

  getPerformance(questionId) {
    this.initializeQuestion(questionId);
    return this.performanceData[questionId];
  }

  getAllPerformanceData() {
    return this.performanceData;
  }

  getSmartShuffledQuestions(questions) {
    // Initialize performance data for all questions
    questions.forEach(q => this.initializeQuestion(q.id));

    // Sort questions by performance (lowest first) and attempts (least first)
    return shuffleArray(questions).sort((a, b) => {
      const perfA = this.performanceData[a.id];
      const perfB = this.performanceData[b.id];

      // First compare percentages
      if (perfA.percentage !== perfB.percentage) {
        return perfA.percentage - perfB.percentage;
      }

      // If percentages are equal, compare attempts
      return perfA.attempts - perfB.attempts;
    });
  }

  getGroupedQuestions(questions) {
    // Initialize performance data for all questions
    questions.forEach(q => this.initializeQuestion(q.id));

    // Split questions into two groups based on 90% completion rate
    const highPerformers = [];
    const otherQuestions = [];

    questions.forEach(q => {
      const perf = this.performanceData[q.id];
      if (perf.percentage >= 90) {
        highPerformers.push(q);
      } else {
        otherQuestions.push(q);
      }
    });

    // Sort each group by question number
    const sortByNumber = (a, b) => {
      const numA = parseInt(a.id);
      const numB = parseInt(b.id);
      return numA - numB;
    };

    highPerformers.sort(sortByNumber);
    otherQuestions.sort(sortByNumber);

    return {
      highPerformers,
      otherQuestions
    };
  }
}

// Create color scale for heatmap
export function getPerformanceColor(percentage) {
  // Softer red (low) to green (high) gradient for text
  const baseIntensity = 0.9; // Higher intensity for better text readability
  if (percentage <= 50) {
    // Red gradient for low performance
    const intensity = 0.5 + (percentage / 100);
    return `rgb(180, ${Math.round(20 * intensity)}, ${Math.round(20 * intensity)})`;
  } else {
    // Green gradient for high performance
    const intensity = (percentage - 50) / 50;
    return `rgb(${Math.round(20 + (40 * (1 - intensity)))}, 120, ${Math.round(20 + (40 * (1 - intensity)))})`;
  }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
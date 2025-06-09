const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const totalRounds = 5;
const questionsPerRound = 5;

let round = 0;
let question = 0;
let score = 0;
let correct = 0;
let wrong = 0;
let roundCorrect = 0;
let startTime;
let totalReactionTime = 0;

const startBtn = document.getElementById('start-btn');
const stroopWord = document.getElementById('stroop-word');
const colorButtons = document.getElementById('color-buttons');
const scoreEl = document.getElementById('score');
const roundEl = document.getElementById('round');
const questionEl = document.getElementById('question');
const roundResult = document.getElementById('round-result');
const finalResult = document.getElementById('final-result');
const finalStats = document.getElementById('final-stats');

startBtn.addEventListener('click', () => {
  // Hide start button when game starts
  startBtn.style.display = 'none';

  round = 1;
  question = 0;
  score = 0;
  correct = 0;
  wrong = 0;
  roundCorrect = 0;
  totalReactionTime = 0;

  roundEl.textContent = round;
  scoreEl.textContent = score;
  questionEl.textContent = question;

  roundResult.classList.add('hidden');
  finalResult.classList.add('hidden');

  nextQuestion();
});

function nextQuestion() {
  if (question >= questionsPerRound) {
    showRoundFeedback();
    round++;
    if (round > totalRounds) {
      return showFinalResult();
    } else {
      roundEl.textContent = round;
      question = 0;
      roundCorrect = 0;
      setTimeout(() => {
        roundResult.classList.add('hidden');
        nextQuestion();
      }, 2000);
      return;
    }
  }

  question++;
  questionEl.textContent = question;

  const word = colors[Math.floor(Math.random() * colors.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];

  stroopWord.textContent = word.toUpperCase();
  stroopWord.style.color = color;

  generateButtons(color);

  startTime = Date.now();
}

function generateButtons(correctColor) {
  colorButtons.innerHTML = '';
  const shuffled = [...colors].sort(() => 0.5 - Math.random());
  shuffled.forEach(color => {
    const btn = document.createElement('button');
    btn.textContent = color;
    btn.className = 'btn';
    btn.style.backgroundColor = color;
    btn.style.color = 'white';
    btn.addEventListener('click', () => handleAnswer(color, correctColor));
    colorButtons.appendChild(btn);
  });
}

function handleAnswer(selected, actual) {
  const reactionTime = Date.now() - startTime;

  if (selected === actual) {
    score++;
    correct++;
    roundCorrect++;
    totalReactionTime += reactionTime;
  } else {
    score--;
    wrong++;
  }

  scoreEl.textContent = score;
  nextQuestion();
}

function showRoundFeedback() {
  roundResult.classList.remove('hidden');
  if (roundCorrect === questionsPerRound) {
    roundResult.textContent = `Perfect! ${questionsPerRound}/5 correct`;
    roundResult.className = 'round-result success';
  } else if (roundCorrect >= 3) {
    roundResult.textContent = `Great job! ${roundCorrect}/${questionsPerRound} correct`;
    roundResult.className = 'round-result success';
  } else {
    roundResult.textContent = `Keep practicing! Only ${roundCorrect}/${questionsPerRound} correct`;
    roundResult.className = 'round-result error';
  }
}

function showFinalResult() {
  stroopWord.textContent = '';
  colorButtons.innerHTML = '';
  finalResult.classList.remove('hidden');

  // Show the start button again after game ends
  startBtn.style.display = 'inline-block';

  const avgTime = correct ? (totalReactionTime / correct / 1000).toFixed(2) : 0;

  finalStats.innerHTML = `
    <div><span>Correct Answers:</span><span>${correct}</span></div>
    <div><span>Wrong Answers:</span><span>${wrong}</span></div>
    <div><span>Total Score:</span><span>${score}</span></div>
    <div><span>Avg Reaction Time:</span><span>${avgTime}s</span></div>
  `;
}

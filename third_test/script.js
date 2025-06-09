const images = ['apple', 'banana', 'car', 'dog', 'cat', 'ball', 'book', 'star', 'cup', 'hat'];
const gameBoard = document.getElementById('game-board');
const timeEl = document.getElementById('time');
const scoreEl = document.getElementById('score');
const roundEl = document.getElementById('round');
const startBtn = document.getElementById('start-btn');
const inputArea = document.getElementById('input-area');
const userInput = document.getElementById('user-input');
const submitBtn = document.getElementById('submit-btn');
const roundResult = document.getElementById('round-result');
const summary = document.getElementById('final-summary');
const summaryBody = document.getElementById('summary-body');
const instructionText = document.getElementById('instruction-text');

let round = 1;
let score = 0;
let pattern = [];
let timer;
let timeLeft = 10;
let results = [];
let inputStartTime = null;
let isInputActive = false;

function startGame() {
  round = 1;
  score = 0;
  results = [];
  scoreEl.textContent = score;
  roundEl.textContent = `${round}/5`;
  startBtn.classList.add('hidden');
  roundResult.classList.add('hidden');
  summary.classList.add('hidden');
  inputArea.classList.add('hidden');
  instructionText.textContent = 'Memorize the order of these images:';
  nextRound();
}

function nextRound() {
  pattern = [];
  inputArea.classList.add('hidden');
  gameBoard.innerHTML = '';
  userInput.value = '';
  timeLeft = 10;
  timeEl.textContent = timeLeft;

  for (let i = 0; i < 5; i++) {
    const item = images[Math.floor(Math.random() * images.length)];
    pattern.push(item);
    const div = document.createElement('div');
    div.className = 'shape';
    div.textContent = item;
    gameBoard.appendChild(div);
  }

  timer = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft === 0) {
      clearInterval(timer);
      showInput();
    }
  }, 1000);
}

function showInput() {
  gameBoard.innerHTML = '';
  instructionText.textContent = 'Enter the image sequence using image names (e.g., apple banana car):';
  inputArea.classList.remove('hidden');
  userInput.focus();
  inputStartTime = Date.now();
  isInputActive = true;
}

submitBtn.addEventListener('click', () => {
  if (!isInputActive) return;
  isInputActive = false;

  const answer = userInput.value.trim().toLowerCase().split(/\s+/);
  let correct = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === answer[i]) {
      correct++;
    }
  }

  const reactionTime = ((Date.now() - inputStartTime) / 1000).toFixed(2);
  results.push({
    round: round,
    pattern: [...pattern],
    answer: answer,
    correct: correct,
    time: reactionTime
  });

  score += correct;
  scoreEl.textContent = score;
  roundResult.textContent = `You got ${correct}/5 correct.`;
  roundResult.classList.remove('hidden');
  inputArea.classList.add('hidden');

  if (round < 5) {
    round++;
    roundEl.textContent = `${round}/5`;
    setTimeout(() => {
      roundResult.classList.add('hidden');
      instructionText.textContent = 'Memorize the order of these images:';
      nextRound();
    }, 2000);
  } else {
    setTimeout(showSummary, 2000);
  }
});

function showSummary() {
  roundResult.classList.add('hidden');
  instructionText.textContent = 'Test Completed. See your results below:';
  gameBoard.innerHTML = '';
  summaryBody.innerHTML = '';

  results.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.round}</td>
      <td>${r.pattern.join(', ')}</td>
      <td>${r.answer.join(', ')}</td>
      <td>${r.correct}/5</td>
      <td>${r.time}</td>
    `;
    summaryBody.appendChild(tr);
  });

  summary.classList.remove('hidden');
  startBtn.textContent = 'Restart Test';
  startBtn.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);

    // At the end of your game, when you have the final score:
    function gameCompleted(score) {
      // Store the score in localStorage
      localStorage.setItem('memoryScore', score);
      localStorage.setItem('memoryLastPlayed', new Date().toLocaleString());
      
      // Optionally redirect back to dashboard
      // window.location.href = 'dashboard.html';
    }
    
    // Example usage when game ends:
    // gameCompleted(85); // Where 85 is the player's score
 
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const gameBoard = document.getElementById('game-board');
  const targetShape = document.getElementById('target-shape');
  const timeDisplay = document.getElementById('time');
  const scoreDisplay = document.getElementById('score');
  const roundDisplay = document.getElementById('round');
  const roundResult = document.getElementById('round-result');
  const gameOverScreen = document.getElementById('game-over');
  const finalScoreDisplay = document.getElementById('final-score');
  const performanceElement = document.querySelector('.performance');
  const finalRightClicksSpan = document.getElementById('final-right-clicks');
  const finalWrongClicksSpan = document.getElementById('final-wrong-clicks');
  const finalReactionTimeSpan = document.getElementById('final-reaction-time');

  let score = 0;
  let currentRound = 0;
  let timerInterval = null;
  let timeLeft = 0;
  let target = {};
  let targetsInRound = 0;
  let targetsFound = 0;
  let shapes = [];
  let roundActive = true;

  let rightClicks = 0;
  let wrongClicks = 0;
  let reactionTimes = [];
  let clickStartTime = 0;

  const shapeTypes = ['circle', 'square', 'triangle', 'diamond'];
  const colors = ['#FF5252', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#00BCD4'];
  const emojis = {
    circle: '●',
    square: '■',
    triangle: '▲',
    diamond: '◆'
  };
  const ROUND_TIMES = [14, 13, 12, 11, 10];

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  function startGame() {
    score = 0;
    currentRound = 0;
    rightClicks = 0;
    wrongClicks = 0;
    reactionTimes = [];
    clearInterval(timerInterval);
    updateScore();

    gameOverScreen.classList.add('hidden');
    startBtn.classList.add('hidden');
    roundResult.classList.add('hidden');

    startRound();
  }

  function startRound() {
    currentRound++;
    if (currentRound > ROUND_TIMES.length) return endGame();

    roundActive = true;
    targetsFound = 0;
    timeLeft = ROUND_TIMES[currentRound - 1];
    updateTimerDisplay();
    roundDisplay.textContent = currentRound;

    generateTarget();
    generateBoard();

    clearInterval(timerInterval);
    timerInterval = setInterval(updateGameTimer, 1000);
    clickStartTime = Date.now();
  }

  function updateGameTimer() {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      roundActive = false;
      endRound(false);
    }
  }

  function updateTimerDisplay() {
    timeDisplay.textContent = timeLeft;
    if (timeLeft <= 5) {
      timeDisplay.style.color = '#d63031';
      timeDisplay.style.animation = 'pulse 0.5s infinite alternate';
    } else {
      timeDisplay.style.color = '';
      timeDisplay.style.animation = '';
    }
  }

  function generateTarget() {
    const shape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    target = { shape, color };

    targetShape.textContent = emojis[shape];
    targetShape.className = 'target-example ' + shape;
    targetShape.style.backgroundColor = color;
  }

  function generateBoard() {
    gameBoard.innerHTML = '';
    shapes = [];
    targetsInRound = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < targetsInRound; i++) {
      shapes.push({ ...target, isTarget: true, found: false });
    }

    for (let i = 0; i < 20 - targetsInRound; i++) {
      let shape, color;
      if (Math.random() > 0.5) {
        shape = target.shape;
        do {
          color = colors[Math.floor(Math.random() * colors.length)];
        } while (color === target.color);
      } else {
        do {
          shape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        } while (shape === target.shape);
        color = target.color;
      }
      shapes.push({ shape, color, isTarget: false, found: false });
    }

    shapes = shuffleArray(shapes);
    shapes.forEach((shape, index) => {
      const el = document.createElement('div');
      el.className = `shape ${shape.shape}`;
      el.style.backgroundColor = shape.color;
      el.innerHTML = emojis[shape.shape];
      el.dataset.index = index;
      el.addEventListener('click', handleShapeClick);
      gameBoard.appendChild(el);
    });

    clickStartTime = Date.now();
  }

  function handleShapeClick(e) {
    if (!roundActive) return;

    const el = e.currentTarget;
    const index = el.dataset.index;
    if (index === undefined) return;

    const shape = shapes[index];
    if (shape.found) return;

    const now = Date.now();
    const reactionTime = now - clickStartTime;
    reactionTimes.push(reactionTime);
    clickStartTime = now;

    if (shape.isTarget) {
      rightClicks++;
      shape.found = true;
      el.classList.add('correct');
      score++;
      targetsFound++;
      updateScore();

      if (targetsFound === targetsInRound) {
        clearInterval(timerInterval);
        roundActive = false;
        endRound(true);
      }
    } else {
      wrongClicks++;
      score = Math.max(0, score - 1);
      el.classList.add('incorrect');
      setTimeout(() => el.classList.remove('incorrect'), 500);
      updateScore();
    }
  }

  function updateScore() {
    scoreDisplay.textContent = score;
  }

  function endRound(success) {
    roundActive = false;

    roundResult.classList.remove('hidden');
    roundResult.classList.toggle('success', success);
    roundResult.classList.toggle('error', !success);
    roundResult.textContent = success
      ? `Great! You found all targets in Round ${currentRound}.`
      : `Time's up! You found ${targetsFound} of ${targetsInRound} targets.`;

    // Send data to ML backend
    sendDataToML();

    setTimeout(() => {
      roundResult.classList.add('hidden');
      if (currentRound < ROUND_TIMES.length) {
        startRound();
      } else {
        endGame();
      }
    }, 2500);
  }

  function sendDataToML() {
    const dataToSend = {
      reactionTimes: reactionTimes,
      rightClicks: rightClicks,
      wrongClicks: wrongClicks,
      score: score
    };

    fetch('http://127.0.0.1:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    })
    .then(response => response.json())
    .then(result => {
      console.log('ML prediction:', result);
      const focusLevel = result.focusLevel;
      adjustDifficultyBasedOnFocus(focusLevel);
    })
    .catch(error => {
      console.error('Error sending data to ML backend:', error);
    });
  }

  function adjustDifficultyBasedOnFocus(focusLevel) {
    console.log('Adjusting difficulty, focusLevel:', focusLevel);

    if (focusLevel < 0.3) {
      ROUND_TIMES[currentRound - 1] = Math.min(ROUND_TIMES[currentRound - 1] + 5, 20);
    } else if (focusLevel > 0.7) {
      ROUND_TIMES[currentRound - 1] = Math.max(ROUND_TIMES[currentRound - 1] - 3, 5);
    }
  }

  function endGame() {
    clearInterval(timerInterval);
    gameBoard.innerHTML = '';
    gameOverScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = score;

    finalRightClicksSpan.textContent = rightClicks;
    finalWrongClicksSpan.textContent = wrongClicks;

    let avgReaction = '-';
    if (reactionTimes.length > 0) {
      avgReaction = Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
      finalReactionTimeSpan.textContent = `${avgReaction} ms`;
    } else {
      finalReactionTimeSpan.textContent = '-';
    }

    const accuracy = rightClicks / (rightClicks + wrongClicks + 1e-5);
    let performanceMsg = '';
    if (score >= 45 && accuracy >= 0.85) performanceMsg = 'Excellent!';
    else if (score >= 30) performanceMsg = 'Good Job!';
    else performanceMsg = 'Keep Practicing!';
    performanceElement.textContent = performanceMsg;

    sendMetricsToMLModel(avgReaction, accuracy * 100, score);
  }

  async function sendMetricsToMLModel(avgReactionTime, accuracyPercent, currentScore) {
    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avgReactionTime, accuracyPercent, currentScore }),
      });
      const data = await response.json();
      console.log('ML Prediction:', data.prediction);
    } catch (error) {
      console.error('Error sending metrics to ML model:', error);
    }
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
});

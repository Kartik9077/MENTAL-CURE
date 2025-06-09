const roundsTotal = 5;
const wordsPerRound = 10;
const roundTime = 30; // 30 seconds per round

const wordRounds = [
  ['b_ _k', 'c_ _r', 't_ _e', 'd_ _g', 'p_ _l', 'm_ _n', 's_ _n', 'h_ _e', 'r_ _n', 'f_ _d'],
  ['cl_ _', 'fl_ _', 'pl_ _', 'br_ _', 'st_ _', 'gr_ _', 'sh_ _', 'sp_ _', 'tr_ _', 'bl_ _'],
  ['_a_ _', '_e_ _', '_i_ _', '_o_ _', '_u_ _', 'b_ _ _', 'c_ _ _', 'd_ _ _', 'f_ _ _', 'g_ _ _'],
  ['_r_ _', '_l_ _', '_n_ _', '_m_ _', '_s_ _', 'sl_ _', 'gl_ _', 'pl_ _', 'cl_ _', 'fl_ _'],
  ['_k_ _', '_t_ _', '_p_ _', '_b_ _', '_d_ _', 'sn_ _', 'kn_ _', 'gn_ _', 'ph_ _', 'wh_ _']
];

// Solutions for each word (for pattern matching)
const wordSolutions = [
  ['book', 'car', 'tree', 'dog', 'pool', 'man', 'sun', 'home', 'rain', 'food'],
  ['clap', 'flag', 'play', 'brow', 'star', 'grow', 'ship', 'spin', 'trip', 'blue'],
  ['bath', 'bell', 'fish', 'boat', 'bull', 'ball', 'call', 'doll', 'fall', 'gall'],
  ['bark', 'bolt', 'bent', 'bump', 'bass', 'slap', 'glow', 'play', 'clip', 'flap'],
  ['bake', 'bite', 'bump', 'barb', 'band', 'snap', 'knee', 'gnat', 'phon', 'what']
];

let currentRound = 0;
let currentWordIndex = 0;
let score = 0;
let timerId;
let timeLeft = roundTime;

// TestComplete Metrics Tracking
let correctWords = 0;
let totalAttemptedWords = 0;
let wordStartTime = 0;
let reactionTimes = [];
let testCompleteMode = false; // Set to true when running in TestComplete

const fillWordEl = document.getElementById('fill-word');
const answerInput = document.getElementById('answer-input');
const scoreEl = document.getElementById('score');
const roundEl = document.getElementById('round');
const timeEl = document.getElementById('time');
const skipBtn = document.getElementById('skip-btn');
const nextBtn = document.getElementById('next-btn');
const resultBox = document.getElementById('result-box');
const finalScoreEl = document.getElementById('final-score');

let attemptedWords = new Set();

function startRound() {
  attemptedWords.clear();
  currentWordIndex = 0;
  timeLeft = roundTime;
  roundEl.textContent = currentRound + 1;
  timeEl.textContent = timeLeft;
  nextBtn.classList.add('hidden');
  skipBtn.disabled = false;
  answerInput.disabled = false;
  answerInput.value = '';
  scoreEl.textContent = score;

  // Reset metrics for new round
  correctWords = 0;
  totalAttemptedWords = 0;
  reactionTimes = [];

  displayWord();
  timerId = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      endRound();
    }
  }, 1000);
}

function displayWord() {
  if (currentWordIndex >= wordsPerRound) {
    endRound();
    return;
  }
  fillWordEl.textContent = wordRounds[currentRound][currentWordIndex];
  answerInput.value = '';
  answerInput.focus();
  
  // Record start time for reaction time calculation
  wordStartTime = new Date().getTime();
  
  if (testCompleteMode) {
    Log.Message(`Displaying word ${currentWordIndex + 1} of round ${currentRound + 1}`);
    Log.Message(`Word pattern: ${wordRounds[currentRound][currentWordIndex]}`);
  }
}

function validateGuess(guess) {
  if (!guess || guess.length === 0) return false;
  
  if (/^(.)\1+$/.test(guess)) {
    if (testCompleteMode) Log.Message("Invalid guess: repeated characters");
    return false;
  }
  return true;
}

function doesGuessMatchPattern(guess, pattern) {
  const cleanPattern = pattern.replace(/ /g, '');
  
  if (guess.length !== cleanPattern.length) {
    if (testCompleteMode) Log.Message(`Length mismatch: ${guess.length} vs ${cleanPattern.length}`);
    return false;
  }
  
  for (let i = 0; i < cleanPattern.length; i++) {
    if (cleanPattern[i] !== '_' && cleanPattern[i].toLowerCase() !== guess[i].toLowerCase()) {
      if (testCompleteMode) Log.Message(`Character mismatch at position ${i}`);
      return false;
    }
  }
  
  return true;
}

async function checkWordExists(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!response.ok) {
      if (testCompleteMode) Log.Message(`Word not found in dictionary: ${word}`);
      return false;
    }
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 && data[0].meanings && data[0].meanings.length > 0;
  } catch (error) {
    if (testCompleteMode) Log.Error('Dictionary API error:', error);
    return false;
  }
}

async function checkAnswer() {
  let guess = answerInput.value.trim().toLowerCase();
  if (!validateGuess(guess)) {
    if (testCompleteMode) Log.Message("Invalid guess entered");
    alert('Please enter a valid word (no repeated characters only).');
    answerInput.value = '';
    return;
  }

  if (attemptedWords.has(currentWordIndex)) {
    if (testCompleteMode) Log.Message("Word already attempted");
    alert('You already attempted this word.');
    return;
  }

  const currentPattern = wordRounds[currentRound][currentWordIndex];
  
  // Track metrics
  totalAttemptedWords++;
  const currentTime = new Date().getTime();
  const reactionTime = currentTime - wordStartTime;
  reactionTimes.push(reactionTime);
  
  if (testCompleteMode) {
    Log.Message(`Word attempt: ${guess}`);
    Log.Message(`Pattern: ${currentPattern}`);
    Log.Message(`Reaction time: ${reactionTime}ms`);
  }

  if (!doesGuessMatchPattern(guess, currentPattern)) {
    if (testCompleteMode) Log.Message("Pattern mismatch");
    alert(`"${guess}" doesn't fit the pattern: ${currentPattern}`);
    answerInput.value = '';
    return;
  }

  const exists = await checkWordExists(guess);
  if (!exists) {
    if (testCompleteMode) Log.Message("Invalid word");
    alert(`"${guess}" is not a valid English word.`);
    answerInput.value = '';
    return;
  }

  // If all checks pass, award point
  attemptedWords.add(currentWordIndex);
  score++;
  correctWords++;
  scoreEl.textContent = score;

  if (testCompleteMode) {
    Log.Message("Correct word!");
    Log.Message(`Current score: ${score}`);
  }

  nextWord();
}

function nextWord() {
  currentWordIndex++;
  if (currentWordIndex >= wordsPerRound) {
    endRound();
  } else {
    displayWord();
  }
}

function skipWord() {
  if (testCompleteMode) Log.Message("Word skipped");
  currentWordIndex++;
  if (currentWordIndex >= wordsPerRound) {
    endRound();
  } else {
    displayWord();
  }
}

function endRound() {
  clearInterval(timerId);
  answerInput.disabled = true;
  skipBtn.disabled = true;
  nextBtn.classList.remove('hidden');
  
  if (testCompleteMode) {
    Log.Message(`Round ${currentRound + 1} ended`);
    Log.Message(`Correct words: ${correctWords}/${wordsPerRound}`);
    Log.Message(`Total attempts: ${totalAttemptedWords}`);
    const avgReactionTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    Log.Message(`Average reaction time: ${avgReactionTime.toFixed(2)}ms`);
  }
  
  if (currentRound + 1 >= roundsTotal) {
    nextBtn.textContent = 'See Results';
  } else {
    nextBtn.textContent = 'Next Round';
  }
}

function nextRound() {
  currentRound++;
  if (currentRound >= roundsTotal) {
    showResults();
  } else {
    startRound();
  }
}

function showResults() {
  document.querySelector('.game-area').classList.add('hidden');
  document.querySelector('.header').classList.add('hidden');
  resultBox.classList.remove('hidden');
  finalScoreEl.textContent = score;
  
  if (testCompleteMode) {
    Log.Message("Game completed");
    Log.Message(`Final score: ${score}/${roundsTotal * wordsPerRound}`);
    const avgReactionTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    Log.Message(`Overall average reaction time: ${avgReactionTime.toFixed(2)}ms`);
    Log.Message("Detailed reaction times: " + reactionTimes.join(", "));
  }
}

function restartGame() {
  score = 0;
  currentRound = 0;
  resultBox.classList.add('hidden');
  document.querySelector('.game-area').classList.remove('hidden');
  document.querySelector('.header').classList.remove('hidden');
  scoreEl.textContent = score;
  
  if (testCompleteMode) Log.Message("Game restarted");
  startRound();
}

// Event listeners
answerInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    checkAnswer();
  }
});

skipBtn.addEventListener('click', skipWord);
nextBtn.addEventListener('click', nextRound);
document.getElementById('restart-btn').addEventListener('click', restartGame);

// TestComplete specific functions
function enableTestCompleteMode() {
  testCompleteMode = true;
  Log.Message("TestComplete mode enabled");
}

function getGameMetrics() {
  return {
    totalRounds: roundsTotal,
    wordsPerRound: wordsPerRound,
    currentRound: currentRound,
    currentWordIndex: currentWordIndex,
    score: score,
    correctWords: correctWords,
    totalAttemptedWords: totalAttemptedWords,
    reactionTimes: reactionTimes,
    averageReactionTime: reactionTimes.length > 0 ? 
      reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0
  };
}

// Start the game
startRound();
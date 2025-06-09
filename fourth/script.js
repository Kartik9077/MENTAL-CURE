const rounds = 5;
const baseTime = 20; // seconds for first round, then -2 sec per round
const letters = ['S', 'A', 'T', 'R', 'D']; // target letters per round

let currentRound = 0;
let timer;
let timeLeft;
let score = 0;           // cumulative correct words across all rounds
let roundScore = 0;      // correct words in current round only
let usedWords = new Set();

let totalWordsEntered = 0;
let totalReactionTime = 0;
let roundWordsEntered = 0;
let roundStartTime = 0;

const startBtn = document.getElementById('start-btn');
const timeEl = document.getElementById('time');
const scoreEl = document.getElementById('score');
const roundEl = document.getElementById('round');
const targetLetterEl = document.getElementById('target-letter');
const wordInput = document.getElementById('word-input');
const wordsList = document.getElementById('words-list');
const finalResult = document.getElementById('final-result');

// Create and insert a round feedback element
const roundFeedback = document.createElement('div');
roundFeedback.className = 'round-result hidden';
document.querySelector('.controls').insertBefore(roundFeedback, finalResult);

startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none'; // Hide the start button during the test
    currentRound = 0;
    score = 0;
    roundScore = 0;
    totalWordsEntered = 0;
    totalReactionTime = 0;
    usedWords.clear();
    finalResult.classList.add('hidden');
    roundFeedback.classList.add('hidden');
    wordsList.innerHTML = '';
    wordInput.value = '';
    wordInput.disabled = false;
    wordInput.focus();
    nextRound();
});

function nextRound() {
    // Hide previous round feedback at the start of new round
    roundFeedback.classList.add('hidden');

    // Calculate reaction time for previous round before resetting
    if (roundStartTime !== 0 && roundWordsEntered > 0) {
        const roundDuration = Date.now() - roundStartTime;
        totalReactionTime += roundDuration / roundWordsEntered;
    }
    
    currentRound++;
    if (currentRound > rounds) {
        endGame();
        return;
    }
    
    roundEl.textContent = currentRound;
    const timeForRound = baseTime - (currentRound - 1) * 2;
    timeLeft = timeForRound;
    timeEl.textContent = timeLeft;
    targetLetterEl.textContent = letters[currentRound - 1];
    wordInput.value = '';
    wordsList.innerHTML = '';
    usedWords.clear();
    wordInput.disabled = false;
    wordInput.focus();

    roundWordsEntered = 0;
    roundScore = 0;          // reset round correct count
    roundStartTime = Date.now();

    timer = setInterval(() => {
        timeLeft--;
        timeEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            wordInput.disabled = true;
            
            // Show round feedback
            showRoundFeedback();
            
            setTimeout(nextRound, 2000);
        }
    }, 1000);
}

async function isValidWordAPI(word) {
    if (word.length < 2) return false;
    const lowerWord = word.toLowerCase();
    if (usedWords.has(lowerWord)) return false;

    // Check first letter match
    if (!lowerWord.startsWith(targetLetterEl.textContent.toLowerCase())) return false;

    // Check repeated chars like ddd or aaa
    const firstChar = lowerWord[0];
    if ([...lowerWord].every(ch => ch === firstChar)) return false;

    // Call dictionary API to validate word
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${lowerWord}`);
        if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) && data.length > 0;
        } else {
            return false;
        }
    } catch (e) {
        console.error("Dictionary API error:", e);
        return false;
    }
}

wordInput.addEventListener('keydown', async (e) => {
    if (e.key === ' ') {
        e.preventDefault();
        const word = wordInput.value.trim();
        if (!word) return;

        totalWordsEntered++; // count every word entered (valid or not)
        roundWordsEntered++;

        const valid = await isValidWordAPI(word);
        if (valid) {
            const lowerWord = word.toLowerCase();
            if (!usedWords.has(lowerWord)) {
                usedWords.add(lowerWord);
                score++;
                roundScore++;      // track correct words in this round
                scoreEl.textContent = score;
                const span = document.createElement('span');
                span.textContent = word;
                wordsList.appendChild(span);
            }
        }
        wordInput.value = '';
    }
});

function showRoundFeedback() {
    let feedbackText = '';
    if (roundScore === roundWordsEntered && roundWordsEntered > 0) {
        feedbackText = `Perfect! You got all ${roundWordsEntered} correct! 🎉`;
    } else if (roundScore >= roundWordsEntered / 2) {
        feedbackText = `Great job! ${roundScore} correct out of ${roundWordsEntered}`;
    } else {
        feedbackText = `Keep trying! ${roundScore} correct out of ${roundWordsEntered}`;
    }
    roundFeedback.textContent = feedbackText;
    roundFeedback.classList.remove('hidden');
}

function endGame() {
    function endGame() {
        if (roundStartTime !== 0 && roundWordsEntered > 0) {
            const roundDuration = Date.now() - roundStartTime;
            totalReactionTime += roundDuration / roundWordsEntered;
        }
    
        const avgReaction = totalWordsEntered ? (totalReactionTime / totalWordsEntered) : 0;
    
        finalResult.innerHTML = `
            <h2>Test Complete!</h2>
            <p><strong>Total correct words:</strong> ${score}</p>
            <p><strong>Total words entered:</strong> ${totalWordsEntered}</p>
            <p><strong>Average reaction time per word:</strong> ${avgReaction.toFixed(2)} seconds</p>
        `;
    
        finalResult.classList.remove('hidden');
        
        startBtn.style.display = 'inline-block'; // show start button again
        startBtn.disabled = false;
    
        targetLetterEl.textContent = '-';
        wordInput.disabled = true;
        roundFeedback.classList.add('hidden');
    }
    
    const avgReaction = totalWordsEntered ? (totalReactionTime / totalWordsEntered) : 0;

    finalResult.innerHTML = `
        Test Complete! <br />
        Total correct words: ${score} <br />
        Total words entered: ${totalWordsEntered} <br />
        Average reaction time per word: ${avgReaction.toFixed(2)} seconds
    `;
    finalResult.classList.remove('hidden');
    
    startBtn.style.display = 'inline-block'; // show start button again
    startBtn.disabled = false;

    targetLetterEl.textContent = '-';
    wordInput.disabled = true;
    roundFeedback.classList.add('hidden');
}

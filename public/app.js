let QUESTIONS = [];
let answers = [];

const subjectSelect = document.getElementById('subjectSelect');
const startBtn = document.getElementById('startBtn');
const quizSection = document.getElementById('quizSection');
const questionContainer = document.getElementById('questionContainer');
const submitBtn = document.getElementById('submitBtn');
const resultsSection = document.getElementById('resultsSection');
const scoreLine = document.getElementById('scoreLine');
const resultsList = document.getElementById('resultsList');
const restartBtn = document.getElementById('restartBtn');
const statusEl = document.getElementById('status');
const spinner = document.getElementById('spinner');

startBtn.addEventListener('click', async () => {
  const subject = subjectSelect.value;
  statusEl.textContent = 'Generating questions...';
  statusEl.classList.add('visible');
  spinner.classList.remove('hidden');  // show spinner

  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject })
    });
    const data = await res.json();
    console.log("API response:", data);

    let questions = data.questions;
    if (!questions && data.raw) {
      try {
        questions = JSON.parse(data.raw);
      } catch {
        alert('Could not parse questions');
        return;
      }
    }

    if (!questions || !Array.isArray(questions)) {
      alert('No questions received from API');
      return;
    }

    QUESTIONS = questions;
    answers = new Array(QUESTIONS.length).fill(null);
    quizSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    statusEl.textContent = '';
    statusEl.classList.remove('visible');
    renderQuestions();   // ✅ only called if QUESTIONS is valid
  } catch (err) {
    alert('Error fetching questions: ' + (err?.message || err));
  } finally {
    spinner.classList.add('hidden');  // hide spinner
  }
});

function renderQuestions() {
  if (!QUESTIONS || !Array.isArray(QUESTIONS)) return;

  questionContainer.innerHTML = '';
  QUESTIONS.forEach((q, qi) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'question';
    qDiv.innerHTML = `<strong>Q${qi+1}:</strong> ${q.text}`;

    q.options.forEach((opt, oi) => {
      const optDiv = document.createElement('div');
      optDiv.className = 'option';
      if (answers[qi] === oi) optDiv.classList.add('selected');
      optDiv.textContent = `${String.fromCharCode(65+oi)}. ${opt.text}`;
      optDiv.addEventListener('click', () => {
        answers[qi] = oi;
        renderQuestions();
      });
      qDiv.appendChild(optDiv);
    });

    questionContainer.appendChild(qDiv);
  });
}

submitBtn.addEventListener('click', () => {
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  resultsList.innerHTML = '';

  QUESTIONS.forEach((q, qi) => {
    const chosen = answers[qi];
    const chosenOpt = q.options[chosen];
    const correctIndex = q.options.findIndex(o => o.isCorrect);

    if (chosen === null) {
      skippedCount++;
    } else if (chosenOpt && chosenOpt.isCorrect) {
      correctCount++;
    } else {
      wrongCount++;
    }

    const item = document.createElement('div');
    item.innerHTML = `
      <p><strong>Q${qi+1}:</strong> ${q.text}</p>
      <p>Your answer: ${chosen !== null ? String.fromCharCode(65+chosen) : 'None'}
      | Correct answer: ${String.fromCharCode(65+correctIndex)}</p>
      <p>${chosenOpt ? chosenOpt.explanation : ''}</p>
    `;
    item.className = chosenOpt && chosenOpt.isCorrect ? 'correct' : 'incorrect';
    resultsList.appendChild(item);
  });

  scoreLine.textContent = `Score: ${correctCount}/${QUESTIONS.length}`;

  // Draw pie chart
  const ctx = document.getElementById('resultChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Correct', 'Wrong', 'Skipped'],
      datasets: [{
        data: [correctCount, wrongCount, skippedCount],
        backgroundColor: ['#10b981', '#ef4444', '#9ca3af']
      }]
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  quizSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
});

restartBtn.addEventListener('click', () => {
  quizSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  answers = [];
  QUESTIONS = [];
});

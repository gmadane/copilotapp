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

startBtn.addEventListener('click', async () => {
  const subject = subjectSelect.value;
  const res = await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject })
  });
  const data = await res.json();

  let questions = data.questions;
  if (!questions && data.raw) {
    try {
      questions = JSON.parse(data.raw);
    } catch (e) {
      alert("Could not parse questions");
      return;
    }
  }

  QUESTIONS = questions;
  answers = new Array(QUESTIONS.length).fill(null);
  quizSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  renderQuestions();
});

function renderQuestions() {
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
  resultsList.innerHTML = '';
  QUESTIONS.forEach((q, qi) => {
    const chosen = answers[qi];
    const chosenOpt = q.options[chosen];
    const correctIndex = q.options.findIndex(o => o.isCorrect);
    if (chosenOpt && chosenOpt.isCorrect) correctCount++;
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
  quizSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
});

restartBtn.addEventListener('click', () => {
  quizSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
});

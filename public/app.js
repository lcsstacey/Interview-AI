const questionEl = document.getElementById('question');
const transcriptEl = document.getElementById('transcript');
const answerEl = document.getElementById('answer');
const statusEl = document.getElementById('status');
const modeEl = document.getElementById('mode');
const resumeTextEl = document.getElementById('resumeText');
const notesTextEl = document.getElementById('notesText');

const jumpApp = document.getElementById('jumpApp');
const startRec = document.getElementById('startRec');
const stopRec = document.getElementById('stopRec');
const getAnswer = document.getElementById('getAnswer');
const summarize = document.getElementById('summarize');

const resumeFile = document.getElementById('resumeFile');
const notesFile = document.getElementById('notesFile');

let recognition;
let listening = false;

jumpApp.addEventListener('click', () => {
  document.getElementById('app').scrollIntoView({ behavior: 'smooth' });
});

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? '#ff9d9d' : '#9ee6b4';
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setStatus('Speech recognition is not supported in this browser.', true);
    return null;
  }

  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';

  rec.onresult = (event) => {
    let interim = '';
    let finalText = transcriptEl.value;

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (result.isFinal) {
        finalText += `${result[0].transcript.trim()}\n`;
      } else {
        interim += result[0].transcript;
      }
    }

    transcriptEl.value = finalText;

    const candidate = `${finalText} ${interim}`.trim();
    const lines = candidate.split('\n').map((l) => l.trim()).filter(Boolean);
    const lastLine = lines[lines.length - 1] || '';
    if (lastLine.endsWith('?')) {
      questionEl.value = lastLine;
    }
  };

  rec.onerror = (e) => setStatus(`Mic error: ${e.error}`, true);
  rec.onend = () => {
    if (listening) rec.start();
  };

  return rec;
}

recognition = setupSpeechRecognition();

startRec.addEventListener('click', () => {
  if (!recognition) return;
  listening = true;
  recognition.start();
  setStatus('Listening...');
});

stopRec.addEventListener('click', () => {
  if (!recognition) return;
  listening = false;
  recognition.stop();
  setStatus('Stopped listening.');
});

async function uploadFile(fileInput, targetTextarea) {
  const file = fileInput.files?.[0];
  if (!file) return;

  const form = new FormData();
  form.append('file', file);

  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Upload failed');
  targetTextarea.value = data.text.slice(0, 120000);
}

resumeFile.addEventListener('change', () => uploadFile(resumeFile, resumeTextEl).catch((e) => setStatus(e.message, true)));
notesFile.addEventListener('change', () => uploadFile(notesFile, notesTextEl).catch((e) => setStatus(e.message, true)));

getAnswer.addEventListener('click', async () => {
  try {
    setStatus('Generating answer...');

    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: questionEl.value,
        transcript: transcriptEl.value,
        resumeText: resumeTextEl.value,
        notesText: notesTextEl.value,
        mode: modeEl.value
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');

    answerEl.value = data.answer;
    setStatus('Answer generated.');
  } catch (error) {
    setStatus(error.message, true);
  }
});

summarize.addEventListener('click', async () => {
  try {
    setStatus('Summarizing transcript...');

    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: transcriptEl.value })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');

    answerEl.value = data.summary;
    setStatus('Summary generated.');
  } catch (error) {
    setStatus(error.message, true);
  }
});

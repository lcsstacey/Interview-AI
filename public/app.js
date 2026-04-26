const $ = (id) => document.getElementById(id);

const providerEl = $('provider');
const modelEl = $('model');
const apiKeyEl = $('apiKey');
const modeEl = $('mode');
const questionEl = $('question');
const transcriptEl = $('transcript');
const answerEl = $('answer');
const statusEl = $('status');
const resumeTextEl = $('resumeText');
const notesTextEl = $('notesText');

const jumpApp = $('jumpApp');
const startMic = $('startMic');
const stopMic = $('stopMic');
const startSystem = $('startSystem');
const stopSystem = $('stopSystem');
const getAnswer = $('getAnswer');
const summarize = $('summarize');
const resumeFile = $('resumeFile');
const notesFile = $('notesFile');

let recognition;
let micListening = false;
let captureStream;
let mediaRecorder;
let recordingInterval;

function status(msg, err = false) {
  statusEl.textContent = msg;
  statusEl.style.color = err ? '#ff9d9d' : '#9ee6b4';
}

function providerPayload() {
  return {
    provider: providerEl.value,
    model: modelEl.value.trim() || undefined,
    apiKey: apiKeyEl.value.trim() || undefined
  };
}

function detectLatestQuestion() {
  const lines = transcriptEl.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const lastQuestion = [...lines].reverse().find((line) => line.endsWith('?'));
  if (lastQuestion) questionEl.value = lastQuestion;
}

function setupMicStt() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    status('Web Speech API not available in this browser.', true);
    return null;
  }

  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'en-US';

  rec.onresult = (event) => {
    let finalText = transcriptEl.value;
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (result.isFinal) {
        finalText += `${result[0].transcript.trim()}\n`;
      }
    }
    transcriptEl.value = finalText;
    detectLatestQuestion();
  };

  rec.onerror = (event) => status(`Mic error: ${event.error}`, true);
  rec.onend = () => {
    if (micListening) rec.start();
  };

  return rec;
}

recognition = setupMicStt();

jumpApp.addEventListener('click', () => $('app').scrollIntoView({ behavior: 'smooth' }));

startMic.addEventListener('click', () => {
  if (!recognition) return;
  micListening = true;
  recognition.start();
  status('Microphone transcription started.');
});

stopMic.addEventListener('click', () => {
  if (!recognition) return;
  micListening = false;
  recognition.stop();
  status('Microphone transcription stopped.');
});

async function transcribeChunk(blob) {
  const data = new FormData();
  data.append('audio', blob, 'chunk.webm');
  data.append('provider', providerEl.value);
  if (apiKeyEl.value.trim()) data.append('apiKey', apiKeyEl.value.trim());

  const res = await fetch('/api/transcribe', { method: 'POST', body: data });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Transcription failed');

  if (json.text?.trim()) {
    transcriptEl.value += `${json.text.trim()}\n`;
    detectLatestQuestion();
  }
}

startSystem.addEventListener('click', async () => {
  try {
    if (providerEl.value !== 'openai') {
      status('System/tab audio transcription currently requires provider=openai.', true);
      return;
    }

    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    mediaRecorder = new MediaRecorder(captureStream, { mimeType: 'audio/webm' });
    mediaRecorder.ondataavailable = async (event) => {
      if (event.data && event.data.size > 0) {
        try {
          await transcribeChunk(event.data);
        } catch (err) {
          status(err.message, true);
        }
      }
    };

    mediaRecorder.start();
    recordingInterval = setInterval(() => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.requestData();
      }
    }, 8000);

    status('System/tab audio capture started. Share a tab/window with audio enabled.');
  } catch (error) {
    status(`Could not start system audio: ${error.message}`, true);
  }
});

stopSystem.addEventListener('click', () => {
  if (recordingInterval) clearInterval(recordingInterval);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  if (captureStream) captureStream.getTracks().forEach((t) => t.stop());
  status('System/tab audio capture stopped.');
});

async function uploadText(fileInput, target) {
  const file = fileInput.files?.[0];
  if (!file) return;
  const data = new FormData();
  data.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: data });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Upload failed');
  target.value = json.text.slice(0, 120000);
}

resumeFile.addEventListener('change', () => uploadText(resumeFile, resumeTextEl).catch((e) => status(e.message, true)));
notesFile.addEventListener('change', () => uploadText(notesFile, notesTextEl).catch((e) => status(e.message, true)));

getAnswer.addEventListener('click', async () => {
  try {
    status('Generating answer...');
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...providerPayload(),
        mode: modeEl.value,
        question: questionEl.value,
        transcript: transcriptEl.value,
        resumeText: resumeTextEl.value,
        notesText: notesTextEl.value
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to generate answer');
    answerEl.value = json.answer;
    status('Answer ready.');
  } catch (error) {
    status(error.message, true);
  }
});

summarize.addEventListener('click', async () => {
  try {
    status('Summarizing...');
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...providerPayload(),
        transcript: transcriptEl.value
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to summarize');
    answerEl.value = json.summary;
    status('Summary ready.');
  } catch (error) {
    status(error.message, true);
  }
});

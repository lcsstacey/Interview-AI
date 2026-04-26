const $ = (id) => document.getElementById(id);

const els = {
  mode: $('mode'),
  provider: $('provider'),
  model: $('model'),
  autopilot: $('autopilot'),
  status: $('status'),
  micBtn: $('micBtn'),
  tabBtn: $('tabBtn'),
  screenshotBtn: $('screenshotBtn'),
  askBtn: $('askBtn'),
  summarizeBtn: $('summarizeBtn'),
  clearBtn: $('clearBtn'),
  resumeFile: $('resumeFile'),
  resumeText: $('resumeText'),
  notesFile: $('notesFile'),
  notesText: $('notesText'),
  question: $('question'),
  transcript: $('transcript'),
  answer: $('answer'),
  recDot: $('recDot'),
  thinking: $('thinking'),
  screenshot: $('screenshot')
};

let config = null;
let micRec = null;
let micListening = false;
let tabStream = null;
let tabRecorder = null;
let tabChunks = [];
let tabInterval = null;
let pendingScreenshotB64 = null;
let lastAnsweredQuestion = '';
let inflight = null;

// ────────────────────────────────────────────────────────────────────────────
// Init
// ────────────────────────────────────────────────────────────────────────────
async function init() {
  const res = await fetch('/api/config');
  config = await res.json();

  const providers = [];
  if (config.providers.anthropic) providers.push('anthropic');
  if (config.providers.openai) providers.push('openai');

  if (!providers.length) {
    setStatus('No API keys set. Add one to .env and restart.', true);
  }

  els.provider.innerHTML = providers
    .map((p) => `<option value="${p}" ${p === config.defaultProvider ? 'selected' : ''}>${p}</option>`)
    .join('');

  refreshModels();
  els.provider.addEventListener('change', refreshModels);

  setupSpeechRecognition();
}

function refreshModels() {
  const p = els.provider.value;
  const list = config.models[p] || [];
  els.model.innerHTML = list
    .map((m) => `<option value="${m}" ${m === config.defaultModel ? 'selected' : ''}>${m}</option>`)
    .join('');
}

function setStatus(msg, isError = false) {
  els.status.textContent = msg;
  els.status.style.color = isError ? '#f87171' : '';
}

// ────────────────────────────────────────────────────────────────────────────
// Mic transcription (Web Speech API)
// ────────────────────────────────────────────────────────────────────────────
function setupSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    setStatus('Browser speech recognition unavailable. Use Chrome on macOS.', true);
    els.micBtn.disabled = true;
    return;
  }
  micRec = new SR();
  micRec.continuous = true;
  micRec.interimResults = true;
  micRec.lang = 'en-US';

  let interimEl = null;

  micRec.onresult = (event) => {
    if (interimEl) { interimEl.remove(); interimEl = null; }
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) {
        appendTranscript(r[0].transcript.trim(), 'mic');
      } else {
        interim += r[0].transcript;
      }
    }
    if (interim) {
      interimEl = document.createElement('span');
      interimEl.className = 'interim';
      interimEl.textContent = ' ' + interim;
      els.transcript.appendChild(interimEl);
      els.transcript.scrollTop = els.transcript.scrollHeight;
    }
  };
  micRec.onerror = (e) => setStatus(`Mic: ${e.error}`, true);
  micRec.onend = () => { if (micListening) micRec.start(); };
}

els.micBtn.addEventListener('click', () => {
  if (!micRec) return;
  if (micListening) {
    micListening = false;
    micRec.stop();
    els.micBtn.textContent = 'Start Mic';
    els.micBtn.classList.remove('recording');
    updateRecDot();
  } else {
    micListening = true;
    micRec.start();
    els.micBtn.textContent = 'Stop Mic';
    els.micBtn.classList.add('recording');
    updateRecDot();
    setStatus('Mic listening…');
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Tab/meeting audio capture → Whisper
// ────────────────────────────────────────────────────────────────────────────
els.tabBtn.addEventListener('click', async () => {
  if (tabStream) {
    stopTabCapture();
    return;
  }
  try {
    tabStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });
    const audioTracks = tabStream.getAudioTracks();
    if (!audioTracks.length) {
      setStatus('No audio in shared tab. Pick a tab and check "Share audio".', true);
      stopTabCapture();
      return;
    }
    const audioOnly = new MediaStream(audioTracks);
    startTabRecorder(audioOnly);
    els.tabBtn.textContent = 'Stop Capture';
    els.tabBtn.classList.add('recording');
    setStatus('Capturing meeting audio…');
    updateRecDot();
    tabStream.getVideoTracks()[0].onended = () => stopTabCapture();
  } catch (err) {
    setStatus(`Capture: ${err.message}`, true);
    stopTabCapture();
  }
});

function startTabRecorder(stream) {
  const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';
  tabRecorder = new MediaRecorder(stream, { mimeType: mime });
  tabRecorder.ondataavailable = (e) => { if (e.data.size > 0) tabChunks.push(e.data); };
  tabRecorder.onstop = async () => {
    if (!tabChunks.length) return;
    const blob = new Blob(tabChunks, { type: mime });
    tabChunks = [];
    if (blob.size < 6000) return; // skip near-silent chunks
    const fd = new FormData();
    fd.append('audio', blob, 'tab.webm');
    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.text && data.text.trim()) appendTranscript(data.text.trim(), 'tab');
    } catch (err) {
      console.error(err);
    }
  };
  tabRecorder.start();
  // chunk every 5 seconds for near-realtime transcription
  tabInterval = setInterval(() => {
    if (tabRecorder && tabRecorder.state === 'recording') {
      tabRecorder.stop();
      tabRecorder.start();
    }
  }, 5000);
}

function stopTabCapture() {
  if (tabInterval) { clearInterval(tabInterval); tabInterval = null; }
  if (tabRecorder && tabRecorder.state !== 'inactive') tabRecorder.stop();
  tabRecorder = null;
  if (tabStream) {
    tabStream.getTracks().forEach((t) => t.stop());
    tabStream = null;
  }
  els.tabBtn.textContent = 'Capture Meeting Audio';
  els.tabBtn.classList.remove('recording');
  updateRecDot();
}

function updateRecDot() {
  els.recDot.classList.toggle('live', micListening || !!tabStream);
}

// ────────────────────────────────────────────────────────────────────────────
// Transcript management & question detection
// ────────────────────────────────────────────────────────────────────────────
function appendTranscript(text, source) {
  if (!text) return;
  const div = document.createElement('div');
  div.className = 'line';
  const tag = document.createElement('span');
  tag.className = `source-tag tag-${source}`;
  tag.textContent = source === 'mic' ? 'You' : 'Them';
  div.appendChild(tag);
  div.appendChild(document.createTextNode(text));
  els.transcript.appendChild(div);
  els.transcript.scrollTop = els.transcript.scrollHeight;

  // Question detection: end with ? OR starts with interrogative
  const lower = text.toLowerCase().trim();
  const interrogative = /^(what|why|how|when|where|who|which|can you|could you|tell me|describe|walk me|explain|do you|have you|would you|are you)\b/.test(lower);
  const looksLikeQuestion = text.trim().endsWith('?') || interrogative;

  // Only auto-answer questions from the interviewer (tab) — not your own mic.
  // If only mic is on, allow it for solo practice.
  const fromInterviewer = source === 'tab' || (source === 'mic' && !tabStream);

  if (looksLikeQuestion && fromInterviewer) {
    els.question.value = text;
    if (els.autopilot.checked && text !== lastAnsweredQuestion) {
      lastAnsweredQuestion = text;
      askQuestion();
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Screenshot for coding questions
// ────────────────────────────────────────────────────────────────────────────
els.screenshotBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    const bitmap = await new ImageCapture(track).grabFrame();
    track.stop();
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    pendingScreenshotB64 = dataUrl.split(',')[1];
    els.screenshot.src = dataUrl;
    els.screenshot.hidden = false;
    setStatus('Screenshot captured. Click "Ask Now" to solve it.');
    if (els.mode.value !== 'coding') els.mode.value = 'coding';
  } catch (err) {
    setStatus(`Screenshot: ${err.message}`, true);
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Ask the model (streaming)
// ────────────────────────────────────────────────────────────────────────────
els.askBtn.addEventListener('click', () => askQuestion());

async function askQuestion() {
  if (inflight) inflight.abort();
  const ctrl = new AbortController();
  inflight = ctrl;

  const body = {
    question: els.question.value.trim(),
    transcript: els.transcript.innerText,
    resumeText: els.resumeText.value,
    notesText: els.notesText.value,
    mode: els.mode.value,
    provider: els.provider.value,
    model: els.model.value,
    imageBase64: pendingScreenshotB64
  };

  if (!body.question && !body.transcript && !body.imageBase64) {
    setStatus('Nothing to answer yet.', true);
    return;
  }

  els.thinking.hidden = false;
  els.answer.innerHTML = '';
  let buffer = '';

  try {
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    await consumeSSE(res, (event, data) => {
      if (event === 'delta') {
        buffer += data.text;
        renderMarkdown(buffer);
        els.answer.scrollTop = els.answer.scrollHeight;
      } else if (event === 'error') {
        setStatus(data.error, true);
      } else if (event === 'done') {
        setStatus('Answer ready.');
      }
    });
  } catch (err) {
    if (err.name !== 'AbortError') setStatus(err.message, true);
  } finally {
    els.thinking.hidden = true;
    pendingScreenshotB64 = null;
    if (inflight === ctrl) inflight = null;
  }
}

function renderMarkdown(text) {
  const html = window.marked ? marked.parse(text) : text;
  els.answer.innerHTML = html;
  if (window.hljs) {
    els.answer.querySelectorAll('pre code').forEach((b) => hljs.highlightElement(b));
  }
}

async function consumeSSE(res, onEvent) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const lines = block.split('\n');
      let event = 'message';
      let data = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) event = line.slice(7).trim();
        else if (line.startsWith('data: ')) data += line.slice(6);
      }
      if (data) {
        try { onEvent(event, JSON.parse(data)); } catch {}
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Summarize / utilities
// ────────────────────────────────────────────────────────────────────────────
els.summarizeBtn.addEventListener('click', async () => {
  if (!els.transcript.innerText.trim()) {
    setStatus('Transcript is empty.', true);
    return;
  }
  els.thinking.hidden = false;
  els.answer.innerHTML = '';
  let buf = '';
  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: els.transcript.innerText,
        provider: els.provider.value,
        model: els.model.value
      })
    });
    await consumeSSE(res, (event, data) => {
      if (event === 'delta') {
        buf += data.text;
        renderMarkdown(buf);
      } else if (event === 'error') {
        setStatus(data.error, true);
      }
    });
    setStatus('Notes ready.');
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    els.thinking.hidden = true;
  }
});

els.clearBtn.addEventListener('click', () => {
  els.transcript.innerHTML = '';
  els.answer.innerHTML = '<div class="placeholder"><p>Cleared.</p></div>';
  els.question.value = '';
  els.screenshot.hidden = true;
  pendingScreenshotB64 = null;
  lastAnsweredQuestion = '';
  setStatus('Cleared.');
});

// ────────────────────────────────────────────────────────────────────────────
// Resume / notes upload
// ────────────────────────────────────────────────────────────────────────────
async function uploadFile(input, target) {
  const file = input.files?.[0];
  if (!file) return;
  setStatus(`Uploading ${file.name}…`);
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  target.value = data.text;
  setStatus(`${file.name} loaded.`);
}

els.resumeFile.addEventListener('change', () =>
  uploadFile(els.resumeFile, els.resumeText).catch((e) => setStatus(e.message, true))
);
els.notesFile.addEventListener('change', () =>
  uploadFile(els.notesFile, els.notesText).catch((e) => setStatus(e.message, true))
);

init();

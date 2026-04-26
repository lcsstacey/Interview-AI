/**
 * Server-Sent-Events stream consumer.
 * Calls onEvent(eventName, parsedData) for each event.
 * Returns when stream finishes or aborted.
 */
export async function consumeSSE(response, onEvent, signal) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    if (signal?.aborted) {
      reader.cancel().catch(() => {});
      throw new DOMException('Aborted', 'AbortError');
    }
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
        try { onEvent(event, JSON.parse(data)); } catch (e) { /* skip */ }
      }
    }
  }
}

export async function streamPost(url, body, onDelta, signal) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  let full = '';
  await consumeSSE(
    res,
    (event, data) => {
      if (event === 'delta') {
        full += data.text;
        onDelta(full, data.text);
      } else if (event === 'error') {
        throw new Error(data.error);
      }
    },
    signal
  );
  return full;
}

export async function uploadFile(url, file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed: ${res.status}`);
  }
  return res.json();
}

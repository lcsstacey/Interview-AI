import { Router } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import { getProviders } from '../providers/index.js';
import { getEffectiveConfig } from '../env.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post('/document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const name = (req.file.originalname || '').toLowerCase();
    let text = '';
    if (name.endsWith('.pdf')) {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text || '';
    } else {
      text = req.file.buffer.toString('utf-8');
    }
    res.json({ text: text.slice(0, 200000), name: req.file.originalname });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/audio', upload.single('audio'), async (req, res) => {
  try {
    const { openai } = getProviders();
    if (!openai) return res.status(400).json({ error: 'OpenAI key required for Whisper. Add it in Settings.' });
    if (!req.file) return res.status(400).json({ error: 'No audio uploaded.' });
    const file = await OpenAI.toFile(req.file.buffer, req.file.originalname || 'audio.webm', {
      type: req.file.mimetype || 'audio/webm'
    });
    const result = await openai.audio.transcriptions.create({
      file,
      model: getEffectiveConfig().WHISPER_MODEL,
      response_format: 'json'
    });
    res.json({ text: result.text || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { neobankStreamConfig } from './streamConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// SSE endpoint for streaming analysis text
app.get('/api/stream/:vertical/:phase', (req, res) => {
  const { vertical, phase } = req.params;

  const configs = { neobank: neobankStreamConfig };
  const config = configs[vertical];

  if (!config || !config[phase]) {
    res.status(404).json({ error: 'Config not found' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sequence = config[phase];
  let index = 0;

  async function sendNext() {
    if (index >= sequence.length) {
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const item = sequence[index];
    index++;

    if (item.type === 'pause') {
      setTimeout(sendNext, item.duration);
    } else if (item.type === 'action') {
      res.write(`data: ${JSON.stringify({ type: 'action', action: item.action })}\n\n`);
      setTimeout(sendNext, 100);
    } else if (item.type === 'text') {
      // Stream text in chunks
      const text = item.text;
      const chunkSize = 3;
      let pos = 0;
      const charDelay = item.duration / Math.ceil(text.length / chunkSize);

      function sendChunk() {
        if (pos >= text.length) {
          res.write(`data: ${JSON.stringify({ type: 'text_end' })}\n\n`);
          setTimeout(sendNext, 50);
          return;
        }
        const chunk = text.slice(pos, pos + chunkSize);
        pos += chunkSize;
        res.write(`data: ${JSON.stringify({ type: 'text_chunk', chunk })}\n\n`);
        setTimeout(sendChunk, charDelay);
      }

      sendChunk();
    }
  }

  sendNext();

  req.on('close', () => {
    index = sequence.length; // Stop sending
  });
});

// Serve static files in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Edoo AI Demo server running on port ${PORT}`);
});

import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  initializeCorpus,
  getAllDocuments,
  getAllChunks,
  ingestUploadedFile,
  ingestWebUrl,
  deleteDocument,
  executeRAGQuery,
  getAuditLogs,
  runEvaluationBenchmark,
  getEngineConfig,
  updateEngineConfig
} from './server/ragEngine.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Initialize pre-seeded enterprise documents
  initializeCorpus();

  // -------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      problemCode: 'JP-020',
      activeDocs: getAllDocuments().length,
      activeChunks: getAllChunks().length
    });
  });

  // Get all documents
  app.get('/api/documents', (req, res) => {
    try {
      const docs = getAllDocuments();
      res.json({ documents: docs });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to list documents' });
    }
  });

  // Get all chunks (for chunk inspection view)
  app.get('/api/chunks', (req, res) => {
    try {
      const docId = req.query.docId as string;
      const allChunks = getAllChunks();
      const filtered = docId ? allChunks.filter(c => c.docId === docId) : allChunks;
      res.json({ chunks: filtered });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to list chunks' });
    }
  });

  // Upload file (PDF, DOCX, TXT)
  app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const doc = await ingestUploadedFile(req.file);
      res.json({
        success: true,
        message: `Successfully ingested '${doc.title}' with ${doc.chunkCount} chunks.`,
        document: doc
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to process uploaded file' });
    }
  });

  // Ingest URL (with TinyFish or direct fallback)
  app.post('/api/documents/url', async (req, res) => {
    try {
      const { url, apiKey } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Valid URL is required' });
      }
      const doc = await ingestWebUrl(url, apiKey);
      res.json({
        success: true,
        message: `Successfully crawled and indexed '${doc.title}' (${doc.chunkCount} chunks).`,
        document: doc
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to ingest web URL' });
    }
  });

  // Delete document
  app.delete('/api/documents/:id', (req, res) => {
    try {
      const { id } = req.params;
      const deleted = deleteDocument(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json({ success: true, message: 'Document deleted from knowledge base' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to delete document' });
    }
  });

  // Execute RAG Query
  app.post('/api/rag/query', async (req, res) => {
    try {
      const { query, threshold, engine, tinyfishApiKey } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Query text is required' });
      }
      const response = await executeRAGQuery(query.trim(), {
        threshold: typeof threshold === 'number' ? threshold : undefined,
        engine,
        tinyfishApiKey
      });
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to execute RAG query' });
    }
  });

  // Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    try {
      const logs = getAuditLogs();
      res.json({ logs });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to fetch audit logs' });
    }
  });

  // Evaluation Benchmark
  app.post('/api/evaluation/run', async (req, res) => {
    try {
      const { threshold } = req.body;
      const results = await runEvaluationBenchmark(typeof threshold === 'number' ? threshold : undefined);
      res.json({ results });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Evaluation benchmark failed' });
    }
  });

  // Configuration
  app.get('/api/config', (req, res) => {
    res.json({ config: getEngineConfig() });
  });

  app.post('/api/config', (req, res) => {
    try {
      const updated = updateEngineConfig(req.body);
      res.json({ config: updated });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to update config' });
    }
  });

  // -------------------------------------------------------------
  // Vite middleware setup
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise RAG Assistant server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

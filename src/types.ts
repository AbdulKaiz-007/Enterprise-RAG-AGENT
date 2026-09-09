export interface DocumentRecord {
  id: string;
  title: string;
  sourceType: 'internal' | 'uploaded_pdf' | 'uploaded_docx' | 'uploaded_txt' | 'web_url';
  urlOrPath?: string;
  chunkCount: number;
  createdAt: string;
  previewSnippet: string;
  sizeBytes?: number;
}

export interface ChunkRecord {
  id: string;
  docId: string;
  docTitle: string;
  sourceType: string;
  page?: number;
  section?: string;
  content: string;
  url?: string;
}

export interface CitationReference {
  chunkId: string;
  sourceName: string;
  sourceType: string;
  page?: number;
  section?: string;
  snippet: string;
  confidence: number;
  url?: string;
}

export interface RAGQueryResponse {
  query: string;
  answer: string;
  grounded: boolean;
  relevanceScore: number;
  verdict: 'GROUNDED' | 'REFUSED_UNSUPPORTED' | 'BLOCKED_GUARDRAIL';
  sources: CitationReference[];
  auditId: number;
  latencyMs: number;
  engineUsed: 'gemini' | 'tinyfish' | 'extractive';
  retrievedCount: number;
}

export interface AuditLogRecord {
  id: number;
  timestamp: string;
  query: string;
  grounded: boolean;
  relevanceScore: number;
  sources: string[];
  response: string;
  verdict: string;
  engineUsed?: string;
}

export interface GoldenBenchmarkItem {
  id: number;
  query: string;
  expectedAnswer: string;
  isAnswerable: boolean;
  actualAnswer?: string;
  simScore?: number;
  faithScore?: number;
  accurate?: boolean;
  verdict?: 'PASS' | 'FAIL';
  retrievedSources?: string[];
}

export interface EvaluationResults {
  tp: number;
  fn: number;
  fp: number;
  tn: number;
  precision: number;
  recall: number;
  specificity: number;
  f1Score: number;
  meanSemanticMatch: number;
  meanFaithfulness: number;
  totalCases: number;
  passedCount: number;
  items: GoldenBenchmarkItem[];
  evaluatedAt: string;
}

export interface EngineConfig {
  threshold: number; // e.g. 0.40 - 0.55
  synthesisEngine: 'auto' | 'gemini' | 'tinyfish' | 'extractive';
  hasGeminiKey: boolean;
  hasTinyfishKey: boolean;
  jobDomainFilterEnabled: boolean;
}

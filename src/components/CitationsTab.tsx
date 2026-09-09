import React, { useState, useEffect } from 'react';
import { Search, Database, Layers, CheckCircle2, ShieldAlert, BookOpen, ExternalLink, Filter, Cpu } from 'lucide-react';
import { ChunkRecord, DocumentRecord, EngineConfig } from '../types.js';

interface CitationsTabProps {
  documents: DocumentRecord[];
  config: EngineConfig;
}

export const CitationsTab: React.FC<CitationsTabProps> = ({ documents, config }) => {
  const [chunks, setChunks] = useState<ChunkRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [testQueryResults, setTestQueryResults] = useState<any[] | null>(null);
  const [evaluatingTestQuery, setEvaluatingTestQuery] = useState(false);

  const fetchChunks = async () => {
    setLoading(true);
    try {
      const url = selectedDocId === 'all' ? '/api/chunks' : `/api/chunks?docId=${selectedDocId}`;
      const res = await fetch(url);
      const data = await res.json();
      setChunks(data.chunks || []);
    } catch (e) {
      console.error('Failed to load chunks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChunks();
  }, [selectedDocId]);

  const handleRunRankTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setTestQueryResults(null);
      return;
    }

    setEvaluatingTestQuery(true);
    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          threshold: 0.0 // Raw retrieval to see ranking
        })
      });
      const data = await res.json();
      setTestQueryResults(data.sources || []);
    } catch (err) {
      console.error('Failed rank test', err);
    } finally {
      setEvaluatingTestQuery(false);
    }
  };

  const filteredChunks = chunks.filter(c => {
    if (!searchQuery || testQueryResults !== null) return true;
    return c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.docTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header & Interactive Test Sandbox */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Citation & Chunk Explorer</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect indexed vector passages, source metadata, and test semantic retrieval against candidate chunks.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="all">All Documents ({documents.length})</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.chunkCount} chunks)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Query rank tester */}
        <form onSubmit={handleRunRankTest} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value) setTestQueryResults(null);
              }}
              placeholder="Enter a test query to see exact semantic cross-encoder ranking & citations..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={evaluatingTestQuery || !searchQuery.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 whitespace-nowrap shadow-xs"
          >
            <Cpu className="w-4 h-4" />
            <span>{evaluatingTestQuery ? 'Evaluating...' : 'Simulate Ranking'}</span>
          </button>
        </form>

        {testQueryResults && (
          <div className="mt-4 p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold">Retrieval Simulation:</span> Top {testQueryResults.length} matching candidate citations.
              <span className="ml-2 font-mono text-[11px] opacity-80">Guardrail Threshold: {config.threshold.toFixed(2)}</span>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setTestQueryResults(null);
              }}
              className="text-xs font-semibold text-indigo-700 hover:underline"
            >
              Reset to All Chunks
            </button>
          </div>
        )}
      </div>

      {/* Chunks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Displaying {testQueryResults ? testQueryResults.length : filteredChunks.length} passages
          </span>
          <span>BM25 + Dense Hybrid Matching</span>
        </div>

        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading vector store passages...
          </div>
        ) : testQueryResults ? (
          /* Ranked Test Results */
          testQueryResults.map((res: any, idx: number) => {
            const passed = res.confidence >= config.threshold;
            return (
              <div
                key={res.chunkId || idx}
                className={`p-5 rounded-2xl border transition-all ${
                  passed
                    ? 'bg-white border-slate-200 hover:border-indigo-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 opacity-75'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-indigo-100 text-indigo-800">
                      Rank #{idx + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{res.sourceName}</span>
                    {res.page && (
                      <span className="text-xs text-slate-400 font-mono">Page {res.page}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold border ${
                      passed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}>
                      {passed ? 'Passed Guardrail' : 'Below Cutoff'}
                    </span>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Score: {(res.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-mono leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {res.snippet}
                </p>
              </div>
            );
          })
        ) : (
          /* Default Chunk List */
          filteredChunks.map((chunk, idx) => (
            <div
              key={chunk.id || idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded font-mono text-xs bg-slate-100 text-slate-700 font-semibold">
                    Chunk #{chunk.id.split('-').pop()}
                  </span>
                  <span className="font-bold text-sm text-slate-900">{chunk.docTitle}</span>
                  {chunk.page && (
                    <span className="text-xs text-slate-400">Page {chunk.page}</span>
                  )}
                  {chunk.section && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {chunk.section}
                    </span>
                  )}
                </div>

                <span className="text-xs font-mono text-slate-400">
                  {chunk.content.length} characters
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-700 font-mono leading-relaxed whitespace-pre-wrap">
                {chunk.content}
              </div>

              {chunk.url && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-right">
                  <a
                    href={chunk.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline inline-flex items-center space-x-1"
                  >
                    <span>View original source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))
        )}

        {!loading && filteredChunks.length === 0 && !testQueryResults && (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            No chunks found for the selected document or filter.
          </div>
        )}
      </div>
    </div>
  );
};

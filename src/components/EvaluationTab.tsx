import React, { useState, useEffect } from 'react';
import { ShieldCheck, Play, BarChart3, CheckCircle2, XCircle, AlertTriangle, Database, Clock, RefreshCw, FileText } from 'lucide-react';
import { AuditLogRecord, EvaluationResults, EngineConfig } from '../types.js';

interface EvaluationTabProps {
  config: EngineConfig;
}

export const EvaluationTab: React.FC<EvaluationTabProps> = ({ config }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [evalResults, setEvalResults] = useState<EvaluationResults | null>(null);
  const [runningEval, setRunningEval] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRunBenchmark = async () => {
    setRunningEval(true);
    try {
      const res = await fetch('/api/evaluation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: config.threshold })
      });
      const data = await res.json();
      setEvalResults(data.results);
      fetchAuditLogs(); // Refresh logs to include test queries
    } catch (err) {
      console.error('Failed to run benchmark', err);
    } finally {
      setRunningEval(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    // Run initial benchmark once on load
    handleRunBenchmark();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Benchmark Header & Runner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Compliance & RAG Evaluation Benchmark
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
              SQuAD / MS-MARCO Calibrated
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Automated verification against the golden test suite with in-scope compliance checks and out-of-scope negative controls. Enforces zero-hallucination standards.
          </p>
        </div>

        <button
          id="run-benchmark-btn"
          onClick={handleRunBenchmark}
          disabled={runningEval}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center space-x-2 whitespace-nowrap shadow-xs"
        >
          {runningEval ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Running 6 Test Cases...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Golden Benchmark</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Row */}
      {evalResults && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Precision
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {evalResults.precision}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Grounded validity</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Recall
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {evalResults.recall}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Answerable coverage</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Specificity
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {evalResults.specificity}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Zero-hallucination rate</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              F1-Score
            </span>
            <span className="text-2xl font-black text-indigo-600 font-mono">
              {evalResults.f1Score}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Harmonic balance</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Semantic Match
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {evalResults.meanSemanticMatch}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Mean target overlap</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Faithfulness
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {evalResults.meanFaithfulness}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Context allegiance</span>
          </div>
        </div>
      )}

      {/* 2-Column: Confusion Matrix Heatmap & Test Cases */}
      {evalResults && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Confusion Matrix Heatmap Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Confusion Matrix Heatmap</h3>
                <span className="text-xs font-mono text-slate-400">{evalResults.totalCases} Tested</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center my-4 font-mono">
                {/* TP */}
                <div className="p-4 rounded-xl bg-indigo-50 border-2 border-indigo-300">
                  <span className="text-[11px] text-indigo-600 font-semibold block">True Positive (TP)</span>
                  <span className="text-3xl font-black text-indigo-900">{evalResults.tp}</span>
                  <span className="text-[10px] text-indigo-700 block mt-1">In-Scope Answered</span>
                </div>

                {/* FN */}
                <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300">
                  <span className="text-[11px] text-amber-700 font-semibold block">False Negative (FN)</span>
                  <span className="text-3xl font-black text-amber-900">{evalResults.fn}</span>
                  <span className="text-[10px] text-amber-800 block mt-1">In-Scope Refused</span>
                </div>

                {/* FP */}
                <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300">
                  <span className="text-[11px] text-rose-600 font-semibold block">False Positive (FP)</span>
                  <span className="text-3xl font-black text-rose-900">{evalResults.fp}</span>
                  <span className="text-[10px] text-rose-700 block mt-1">Hallucination Leak</span>
                </div>

                {/* TN */}
                <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300">
                  <span className="text-[11px] text-emerald-600 font-semibold block">True Negative (TN)</span>
                  <span className="text-3xl font-black text-emerald-900">{evalResults.tn}</span>
                  <span className="text-[10px] text-emerald-700 block mt-1">Safety Refusal</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <div className="flex justify-between">
                <span>Total Golden Tests:</span>
                <strong className="text-slate-800">{evalResults.totalCases}</strong>
              </div>
              <div className="flex justify-between">
                <span>Benchmark Pass Rate:</span>
                <strong className="text-emerald-700">{((evalResults.passedCount / evalResults.totalCases) * 100).toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          {/* Benchmark Test Cases Detail */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Golden Benchmark Verification Results
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                {evalResults.passedCount} / {evalResults.totalCases} Passed
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {evalResults.items.map((item) => (
                <div key={item.id} className="p-4 text-xs space-y-2 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700">
                        #{item.id}
                      </span>
                      <span className="font-semibold text-slate-900 text-sm">{item.query}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] border flex items-center space-x-1 ${
                      item.verdict === 'PASS'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      {item.verdict === 'PASS' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                      )}
                      <span>{item.verdict}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-mono text-[11px]">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase block">Expected Truth:</span>
                      <p className="line-clamp-2">{item.expectedAnswer}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase block">Actual Response:</span>
                      <p className="line-clamp-2">{item.actualAnswer}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-mono">
                    <span>Similarity: <strong>{((item.simScore || 0) * 100).toFixed(0)}%</strong></span>
                    <span>Faithfulness: <strong>{((item.faithScore || 0) * 100).toFixed(0)}%</strong></span>
                    <span>Target: {item.isAnswerable ? 'In-Scope (1)' : 'Out-of-Scope (0)'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SQLite Audit Trail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Query Audit Trail (SQLite Compliance Store)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live immutable log of every natural-language question, groundedness flag, relevance score, and source references.
            </p>
          </div>

          <button
            onClick={fetchAuditLogs}
            disabled={loadingLogs}
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Query</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Sources</th>
                <th className="px-4 py-3">Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-700">#{log.id}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(log.timestamp).toISOString().slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="px-4 py-3 font-sans font-medium text-slate-900 max-w-xs truncate" title={log.query}>
                    {log.query}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                      log.grounded
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}>
                      {log.grounded ? 'GROUNDED' : 'REFUSED / BLOCKED'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {(log.relevanceScore * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={log.sources.join(', ')}>
                    {log.sources.join(', ')}
                  </td>
                  <td className="px-4 py-3 text-slate-400 capitalize">
                    {log.engineUsed || 'Extractive'}
                  </td>
                </tr>
              ))}

              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-sans">
                    No query audits recorded yet. Submit queries in the Assistant tab to generate audit logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

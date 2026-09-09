import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ShieldAlert, ShieldCheck, BookOpen, Clock, AlertCircle, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { RAGQueryResponse, CitationReference, EngineConfig } from '../types.js';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  ragMeta?: {
    grounded: boolean;
    relevanceScore: number;
    verdict: string;
    sources: CitationReference[];
    latencyMs: number;
    engineUsed: string;
  };
}

interface ChatTabProps {
  config: EngineConfig;
  onInspectChunk?: (chunkId: string) => void;
}

const SAMPLE_QUERIES = [
  { text: "How many days of annual leave can I carry over?", type: "in-scope", tag: "Policy" },
  { text: "What encryption is required for company laptops?", type: "in-scope", tag: "Security" },
  { text: "What are the key responsibilities for the Senior ML Engineer role?", type: "in-scope", tag: "Careers" },
  { text: "What keyword is used to re-raise an exception in Python?", type: "in-scope", tag: "Docs" },
  { text: "What technical architecture was implemented for Tutor Twin?", type: "in-scope", tag: "Resume" },
  { text: "Can employees book first-class flights or private jets?", type: "out-of-scope", tag: "Negative Control" },
  { text: "What is the reimbursement policy for pet insurance?", type: "out-of-scope", tag: "Negative Control" }
];

export const ChatTab: React.FC<ChatTabProps> = ({ config, onInspectChunk }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: "Hello! I am your Enterprise Document Assistant. I provide document-grounded answers about policies, SOPs, job descriptions, and technical documentation with verifiable citations.\n\nEvery answer is strictly bounded by approved documents. If a question cannot be answered from the indexed knowledge base, I will safely decline to prevent unsupported hallucinations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          threshold: config.threshold,
          engine: config.synthesisEngine
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: RAGQueryResponse = await res.json();

      const assistantMessage: ChatMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ragMeta: {
          grounded: data.grounded,
          relevanceScore: data.relevanceScore,
          verdict: data.verdict,
          sources: data.sources,
          latencyMs: data.latencyMs,
          engineUsed: data.engineUsed
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      // Auto expand citations if available
      if (data.sources.length > 0) {
        setExpandedCitations(prev => ({ ...prev, [assistantMessage.id]: true }));
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: `Error processing query: ${err?.message || 'Server communication error'}. Please verify connection.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCitations = (msgId: string) => {
    setExpandedCitations(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-5xl mx-auto px-4 py-4">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const meta = msg.ragMeta;
          const isBlocked = meta && !meta.grounded;

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 transition-all shadow-xs ${
                isUser
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : isBlocked
                  ? 'bg-amber-50 border border-amber-200 text-slate-800 rounded-bl-none'
                  : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none'
              }`}>
                {/* Header info for assistant */}
                {!isUser && meta && (
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100 text-xs">
                    <div className="flex items-center space-x-2">
                      {isBlocked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          Zero-Hallucination Guardrail Refusal
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Grounded in Enterprise Corpus
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-slate-500 font-mono text-[11px]">
                      <span>Confidence: {(meta.relevanceScore * 100).toFixed(0)}%</span>
                      <span>•</span>
                      <span>{meta.latencyMs}ms</span>
                      <span>•</span>
                      <span className="capitalize">{meta.engineUsed}</span>
                    </div>
                  </div>
                )}

                {/* Main Message Text */}
                <div className="prose prose-slate prose-sm max-w-none break-words whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>

                {/* Sources & Citations Section */}
                {!isUser && meta && meta.sources.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => toggleCitations(msg.id)}
                      className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 hover:text-indigo-600 py-1 transition-colors"
                    >
                      <span className="flex items-center space-x-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Supporting Citations & Evidence ({meta.sources.length})</span>
                      </span>
                      {expandedCitations[msg.id] ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {expandedCitations[msg.id] && (
                      <div className="mt-2 space-y-2.5">
                        {meta.sources.map((src, idx) => (
                          <div
                            key={src.chunkId || idx}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-indigo-300 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center space-x-2">
                                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold text-[10px]">
                                  Source {idx + 1}
                                </span>
                                <span className="font-semibold text-slate-800 truncate max-w-[220px] sm:max-w-xs">
                                  {src.sourceName}
                                </span>
                                {src.page && (
                                  <span className="text-slate-400 text-[10px]">Page {src.page}</span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Match: {(src.confidence * 100).toFixed(0)}%
                              </span>
                            </div>

                            <p className="text-slate-600 italic font-mono bg-white p-2 rounded border border-slate-100 leading-normal">
                              "{src.snippet}"
                            </p>

                            {src.url && (
                              <div className="mt-1.5 text-right">
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-indigo-600 hover:underline inline-flex items-center"
                                >
                                  View Live URL ↗
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer time & copy */}
                <div className="flex items-center justify-between mt-2 pt-1 text-[10px] opacity-70">
                  <span>{msg.timestamp}</span>
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="hover:opacity-100 inline-flex items-center space-x-1"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 max-w-sm shadow-xs">
              <div className="flex items-center space-x-3 text-slate-600 text-sm">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Retrieving & verifying enterprise sections...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Queries Chips */}
      <div className="py-2 overflow-x-auto scrollbar-none flex items-center space-x-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          Test Prompts:
        </span>
        {SAMPLE_QUERIES.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSubmit(sq.text)}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-all flex items-center space-x-1 border ${
              sq.type === 'in-scope'
                ? 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 border-slate-200'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
            }`}
          >
            <span className="opacity-60 text-[10px]">[{sq.tag}]</span>
            <span>{sq.text}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative flex items-center"
        >
          <input
            id="query-input"
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask any natural-language question about enterprise policies, SOPs, or roles..."
            disabled={loading}
            className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            id="submit-query-btn"
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="absolute right-2.5 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white transition-colors disabled:cursor-not-allowed shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-1">
          <span>Grounded retrieval with Calibrated Confidence Cutoff ({config.threshold.toFixed(2)})</span>
          <span>Zero-hallucination policy strictly enforced</span>
        </div>
      </div>
    </div>
  );
};

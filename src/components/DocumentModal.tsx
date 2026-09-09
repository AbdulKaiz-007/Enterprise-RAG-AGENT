import React, { useState, useEffect } from 'react';
import { X, Layers, FileText, ExternalLink } from 'lucide-react';
import { DocumentRecord, ChunkRecord } from '../types.js';

interface DocumentModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ document, onClose }) => {
  const [chunks, setChunks] = useState<ChunkRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!document) return;
    setLoading(true);
    fetch(`/api/chunks?docId=${document.id}`)
      .then(res => res.json())
      .then(data => setChunks(data.chunks || []))
      .catch(err => console.error('Failed to load doc chunks', err))
      .finally(() => setLoading(false));
  }, [document]);

  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 truncate max-w-md">
                {document.title}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                <span className="uppercase font-semibold text-indigo-600">
                  {document.sourceType.replace('_', ' ')}
                </span>
                <span>•</span>
                <span>{document.chunkCount} Indexed Chunks</span>
                {document.urlOrPath?.startsWith('http') && (
                  <>
                    <span>•</span>
                    <a
                      href={document.urlOrPath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline inline-flex items-center"
                    >
                      <span>Live URL</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chunks List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading document chunks...
            </div>
          ) : chunks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No chunks found for this document.
            </div>
          ) : (
            chunks.map((chunk, idx) => (
              <div
                key={chunk.id || idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2 text-xs">
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                      Chunk #{idx + 1}
                    </span>
                    {chunk.page && (
                      <span className="text-slate-500">Page {chunk.page}</span>
                    )}
                    {chunk.section && (
                      <span className="text-slate-600 font-sans font-medium">{chunk.section}</span>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {chunk.content.length} chars
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-700 font-mono leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-100">
                  {chunk.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

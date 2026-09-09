import React, { useState, useRef } from 'react';
import { UploadCloud, Globe, FileText, Trash2, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Layers, Search, Sparkles } from 'lucide-react';
import { DocumentRecord, EngineConfig } from '../types.js';

interface DocumentsTabProps {
  documents: DocumentRecord[];
  config: EngineConfig;
  onRefresh: () => void;
  onViewDocChunks: (doc: DocumentRecord) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  config,
  onRefresh,
  onViewDocChunks
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [crawling, setCrawling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt', 'md'].includes(ext || '')) {
      setStatusMessage({
        type: 'error',
        text: 'Unsupported file type. Please upload a PDF, DOCX, TXT, or MD document.'
      });
      return;
    }

    setUploading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setStatusMessage({
        type: 'success',
        text: data.message || `Successfully indexed ${file.name}`
      });
      onRefresh();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error processing document'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url) return;

    setCrawling(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/documents/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'URL ingestion failed');
      }

      setStatusMessage({
        type: 'success',
        text: data.message || `Successfully ingested URL: ${url}`
      });
      setUrlInput('');
      onRefresh();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to crawl webpage'
      });
    } finally {
      setCrawling(false);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    if (!confirm(`Remove "${title}" from the knowledge base? All indexed chunks will be deleted.`)) return;

    setDeletingId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Failed to delete document');
      }
      onRefresh();
      setStatusMessage({
        type: 'success',
        text: `Removed "${title}" from knowledge base.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not delete document'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.sourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.previewSnippet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Top Banner / Feedback Alert */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center space-x-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100 uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Ingestion Section: 2 Columns (File Upload & URL Scraper) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Ingestion Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Document Upload</h3>
                <p className="text-xs text-slate-500">Ingest PDF, DOCX, TXT manuals or resumes</p>
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
              />
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                {uploading ? 'Extracting & Indexing Chunks...' : 'Click to browse or drag & drop'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports PDF (with page tracking), Word DOCX, TXT, MD up to 25MB
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Recursive chunking: 450 chars (60 overlap)</span>
            <span className="font-semibold text-indigo-600">Vector Index Ready</span>
          </div>
        </div>

        {/* URL Ingestion Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Web URL Crawler</h3>
                <p className="text-xs text-slate-500">Fetch documentation, SOPs, or career portals</p>
              </div>
            </div>

            <form onSubmit={handleUrlCrawl} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Website URL
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://docs.python.org/3/tutorial/errors.html"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <div className="flex items-center space-x-1.5 font-medium text-slate-800 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>TinyFish Autonomous Web Agent & Fetch Engine</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Extracts clean markdown and removes web clutter. Automatically falls back to resilient HTML text extraction if TinyFish endpoint times out or key is missing.
                </p>
              </div>

              <button
                type="submit"
                disabled={crawling || !urlInput.trim()}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2 shadow-xs"
              >
                {crawling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scraping & Indexing Webpage...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Crawl & Index URL</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Active Knowledge Base Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Knowledge Base Documents ({documents.length})
            </h3>
            <p className="text-xs text-slate-500">
              Approved enterprise collection serving as the strict grounding boundary for RAG QA
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter indexed docs..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Document Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Chunks</th>
                <th className="px-4 py-3">Preview Excerpt</th>
                <th className="px-4 py-3">Ingested At</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-xs" title={doc.title}>
                        {doc.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                      doc.sourceType === 'internal'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : doc.sourceType === 'web_url'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {doc.sourceType.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-mono text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                      {doc.chunkCount}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 max-w-sm">
                    <p className="line-clamp-2">{doc.previewSnippet}</p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-2">
                    <button
                      onClick={() => onViewDocChunks(doc)}
                      className="px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors inline-flex items-center space-x-1"
                      title="Inspect all chunks of this document"
                    >
                      <Layers className="w-3.5 h-3.5 mr-1" />
                      <span>Chunks</span>
                    </button>

                    {doc.urlOrPath?.startsWith('http') && (
                      <a
                        href={doc.urlOrPath}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 inline-block align-middle"
                        title="Open Source Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 inline-block align-middle transition-colors"
                      title="Delete document and chunks"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No documents found matching "{searchTerm}".
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
